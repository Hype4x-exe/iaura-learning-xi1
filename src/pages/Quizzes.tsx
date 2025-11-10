import { useState, useEffect, memo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, CheckCircle2, XCircle, Trophy, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quiz {
  id: string;
  title: string;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string | null;
}

const Quizzes = memo(() => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);  
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleDeleteClick = useCallback((quizId: string) => {
    setQuizToDelete(quizId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!quizToDelete) return;

    setDeleting(true);
    try {
      // Delete all questions associated with this quiz first
      const { error: questionsError } = await supabase
        .from("questions")
        .delete()
        .eq("quiz_id", quizToDelete);

      if (questionsError) throw questionsError;

      // Delete the quiz
      const { error: quizError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizToDelete);

      if (quizError) throw quizError;

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizToDelete));
      toast.success("Quiz deleted successfully!");
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    } finally {
      setDeleting(false);
    }
  }, [quizToDelete, quizzes]);

  const loadQuiz = async (quiz: Quiz) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quiz.id);

      if (error) throw error;
      
      // Filter questions to only include those with options (MCQ questions)
      const validQuestions = (data || []).filter((q: Question) => q.options && (Array.isArray(q.options) ? q.options.length > 0 : Object.keys(q.options || {}).length > 0));
      
      if (validQuestions.length === 0) {
        toast.error("No valid multiple choice questions found in this quiz");
        return;
      }
      
      setQuestions(validQuestions);
      setSelectedQuiz(quiz);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast.error("Failed to load quiz questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const score = questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correct_answer ? 1 : 0);
    }, 0);

    const percentage = (score / questions.length) * 100;

    try {
      await supabase.from("quiz_attempts").insert({
        user_id: user?.id,
        quiz_id: selectedQuiz?.id,
        score: percentage,
        total_questions: questions.length,
      });

      setShowResults(true);
      toast.success(`Quiz completed! Score: ${percentage.toFixed(0)}%`);
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
      toast.error("Failed to save quiz results");
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <header className="pt-8 pb-6 text-center">
          <div className="max-w-md mx-auto">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
            <p className="text-muted-foreground text-sm">
              Test your knowledge with AI-generated quizzes
            </p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto space-y-4">
          {quizzes.length === 0 ? (
            <Card className="glass p-8 text-center">
              <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create study materials with AI to generate quizzes automatically
              </p>
            </Card>
          ) : (
            quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="glass transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 cursor-pointer" onClick={() => loadQuiz(quiz)}>
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <CardDescription>
                      Created {new Date(quiz.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(quiz.id);
                    }}
                    className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the quiz
                and all its questions from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (showResults) {
    const score = questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correct_answer ? 1 : 0);
    }, 0);
    const percentage = (score / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="glass p-8 text-center mb-6">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-5xl font-bold text-primary mb-4">{percentage.toFixed(0)}%</p>
            <p className="text-muted-foreground mb-6">
              You got {score} out of {questions.length} questions correct
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetQuiz} variant="outline">
                Back to Quizzes
              </Button>
              <Button onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
              }}>
                Review Answers
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer === question.correct_answer;

              return (
                <Card key={question.id} className="glass p-6">
                  <div className="flex items-start gap-3 mb-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold mb-2">
                        {index + 1}. {question.question_text}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your answer: <span className={isCorrect ? "text-green-500" : "text-red-500"}>{userAnswer || "Not answered"}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-500 mb-2">
                          Correct answer: {question.correct_answer}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{selectedQuiz.title}</h2>
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="glass p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question_text}</h3>
          
          {currentQuestion && currentQuestion.options ? (
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
            >
              {(Array.isArray(currentQuestion.options) ? currentQuestion.options : Object.values(currentQuestion.options || {})).map((option: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value={String(option)} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-muted-foreground">No options available for this question</p>
          )}
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={resetQuiz}
            variant="outline"
            className="flex-1"
          >
            Exit Quiz
          </Button>
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex-1"
          >
            Previous
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              className="flex-1"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

Quizzes.displayName = 'Quizzes';

export default Quizzes;
