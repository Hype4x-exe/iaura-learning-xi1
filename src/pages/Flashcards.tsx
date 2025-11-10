import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  is_starred: boolean;
};

const Flashcards = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFlashcards();
  }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length);
    setFlipped(false);
  };

  const handlePrev = () => {
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
    setFlipped(false);
  };

  const toggleStar = async () => {
    if (!cards[currentCard]) return;

    const newStarredState = !cards[currentCard].is_starred;
    
    try {
      await supabase
        .from("flashcards")
        .update({ is_starred: newStarredState })
        .eq("id", cards[currentCard].id);

      setCards(cards.map((card, idx) => 
        idx === currentCard ? { ...card, is_starred: newStarredState } : card
      ));
    } catch (error) {
      console.error("Error updating flashcard:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 pb-24 flex items-center justify-center">
        <Card className="glass-strong p-12 text-center shadow-glass max-w-md">
          <p className="text-sm text-muted-foreground">
            No flashcards yet. Generate study materials to create flashcards!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg p-4 pb-24">
      <header className="pt-8 pb-6 text-center fade-in-up">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-neon bg-clip-text text-transparent">Flashcards</h1>
        <p className="text-muted-foreground text-sm">
          Card {currentCard + 1} of {cards.length}
        </p>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        {/* Flashcard with Liquid Ripple */}
        <div className="perspective-1000 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card
            onClick={() => setFlipped(!flipped)}
            className={cn(
              "glass-strong p-8 min-h-[340px] shadow-float cursor-pointer transition-all duration-700 border-white/40 liquid-ripple",
              flipped ? "scale-105" : "hover:scale-102"
            )}
          >
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              {!flipped ? (
                <>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center shadow-neon">
                      <span className="text-2xl font-bold text-primary-foreground">?</span>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-neon opacity-30 blur-xl animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                      Question
                    </p>
                    <p className="text-xl font-bold leading-relaxed">
                      {cards[currentCard].question}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground bg-white/20 px-4 py-2 rounded-full">
                    Tap to reveal answer
                  </p>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in-50 duration-500">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center shadow-neon">
                      <span className="text-2xl font-bold text-primary-foreground">✓</span>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-neon opacity-30 blur-xl animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                      Answer
                    </p>
                    <p className="text-lg leading-relaxed">
                      {cards[currentCard].answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Controls with Glass Buttons - Vertical Stack for One-Handed Use */}
        <div className="flex items-center justify-center gap-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Left side - Previous button */}
          <Button
            onClick={handlePrev}
            size="lg"
            className="glass hover:shadow-glow transition-all duration-500 rounded-[20px] w-14 h-14 p-0 border-white/30 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Center - Star button */}
          <Button
            onClick={toggleStar}
            size="lg"
            className={cn(
              "glass transition-all duration-500 rounded-[20px] w-14 h-14 p-0 border-white/30 flex-shrink-0",
              cards[currentCard]?.is_starred && "bg-gradient-neon text-primary-foreground shadow-neon"
            )}
          >
            <Star className={cn("w-6 h-6", cards[currentCard]?.is_starred && "fill-current")} />
          </Button>

          {/* Right side - Next button */}
          <Button
            onClick={handleNext}
            size="lg"
            className="glass hover:shadow-glow transition-all duration-500 rounded-[20px] w-14 h-14 p-0 border-white/30 flex-shrink-0"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Glowing Progress Bar */}
        <div className="glass-strong rounded-[20px] p-5 shadow-glass fade-in-up border-white/40" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="font-bold bg-gradient-neon bg-clip-text text-transparent">
              {Math.round(((currentCard + 1) / cards.length) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-neon transition-all duration-700 shadow-neon relative"
              style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
