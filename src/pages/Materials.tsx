import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Materials = () => {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const saveMaterialAndContent = async (
    materialTitle: string,
    materialContent: string,
    sourceType: string,
    generatedData: any
  ) => {
    if (!user) return;

    try {
      // Save material
      const { data: material, error: materialError } = await supabase
        .from("materials")
        .insert({
          user_id: user.id,
          title: materialTitle,
          content: materialContent,
          source_type: sourceType,
          summary: generatedData.summary,
        })
        .select()
        .single();

      if (materialError) throw materialError;

      // Save notes
      if (generatedData.key_points || generatedData.examples) {
        await supabase.from("notes").insert({
          user_id: user.id,
          material_id: material.id,
          title: `${materialTitle} - Notes`,
          content: generatedData.summary,
          key_points: generatedData.key_points,
          examples: generatedData.examples,
        });
      }

      // Save flashcards
      if (generatedData.flashcards && Array.isArray(generatedData.flashcards)) {
        const flashcardsData = generatedData.flashcards.map((card: any) => ({
          user_id: user.id,
          material_id: material.id,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty || "medium",
        }));
        await supabase.from("flashcards").insert(flashcardsData);
      }

      // Save quiz
      if (generatedData.quiz_questions && Array.isArray(generatedData.quiz_questions)) {
        const { data: quiz } = await supabase
          .from("quizzes")
          .insert({
            user_id: user.id,
            material_id: material.id,
            title: `${materialTitle} - Quiz`,
          })
          .select()
          .single();

        if (quiz) {
          const questionsData = generatedData.quiz_questions.map((q: any) => ({
            quiz_id: quiz.id,
            question_text: q.question,
            question_type: q.type,
            options: q.options || null,
            correct_answer: q.correct_answer,
            explanation: q.explanation || null,
          }));
          await supabase.from("questions").insert(questionsData);
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving to database:", error);
      throw error;
    }
  };

  const handleTopicGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    setProgress([]);

    try {
      setProgress((prev) => [...prev, "Generating content from AI..."]);

      const { data, error } = await supabase.functions.invoke("generate-from-topic", {
        body: { topic: topic.trim() },
      });

      if (error) throw error;

      setProgress((prev) => [...prev, "Content generated! Saving to your workspace..."]);

      await saveMaterialAndContent(data.title || topic, topic, "ai_generated", data);

      setProgress((prev) => [...prev, "✓ All done! Your materials are ready."]);
      
      setTimeout(() => {
        toast.success("Study materials created successfully!");
        navigate("/notes");
      }, 1500);
    } catch (error: any) {
      console.error("Error generating from topic:", error);
      toast.error(error.message || "Failed to generate materials");
      setProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setProgress([]);

    try {
      setProgress((prev) => [...prev, "Analyzing your material..."]);

      const { data, error } = await supabase.functions.invoke("process-material", {
        body: { 
          content: text.trim(),
          title: text.trim().substring(0, 100) + "..."
        },
      });

      if (error) throw error;

      setProgress((prev) => [...prev, "Creating study materials..."]);

      await saveMaterialAndContent(
        text.substring(0, 100) + "...",
        text,
        "paste",
        data
      );

      setProgress((prev) => [...prev, "✓ All done! Your materials are ready."]);
      
      setTimeout(() => {
        toast.success("Material processed successfully!");
        setText("");
        navigate("/notes");
      }, 1500);
    } catch (error: any) {
      console.error("Error processing material:", error);
      toast.error(error.message || "Failed to process material");
      setProgress([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4 pb-24">
      <header className="pt-8 pb-6 text-center fade-in-up">
        <h1 className="text-3xl font-bold mb-2">Create Study Materials</h1>
        <p className="text-muted-foreground text-sm">
          Generate from a topic or upload your own content
        </p>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        <Tabs defaultValue="topic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass rounded-2xl p-1">
            <TabsTrigger value="topic" className="rounded-xl">AI Generate</TabsTrigger>
            <TabsTrigger value="upload" className="rounded-xl">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="topic" className="space-y-4">
            <Card className="glass-strong p-6 shadow-glass fade-in-up mt-4">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-lg mb-1">AI Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter any topic and AI will create comprehensive study materials
                  </p>
                </div>

                <div>
                  <Label htmlFor="topic">Study Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Photosynthesis, World War II, Calculus"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="glass border-primary/20 rounded-2xl mt-2"
                    disabled={loading}
                  />
                </div>

                {progress.length > 0 && (
                  <Card className="glass p-4">
                    <div className="space-y-2">
                      {progress.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Button
                  onClick={handleTopicGenerate}
                  disabled={loading || !topic.trim()}
                  className="w-full liquid-button bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-2xl shadow-float"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Study Materials
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card className="glass-strong p-6 shadow-glass fade-in-up mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Paste Text</label>
                  <Textarea
                    placeholder="Paste your study material here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[250px] glass border-primary/20 rounded-2xl resize-none"
                    disabled={loading}
                  />
                </div>

                {progress.length > 0 && (
                  <Card className="glass p-4">
                    <div className="space-y-2">
                      {progress.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Button
                  onClick={handleTextSubmit}
                  disabled={loading || !text.trim()}
                  className="w-full liquid-button bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-2xl shadow-float"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Process Material
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Materials;
