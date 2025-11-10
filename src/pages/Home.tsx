import { useState, memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, MessageSquare, Sparkles, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";

const Home = memo(() => {
  const navigate = useNavigate();
  const [quote] = useState("The beautiful thing about learning is that nobody can take it away from you.");

  return (
    <div className="min-h-screen bg-background p-4 pb-24 sm:pb-28">
      {/* Header with Logo */}
      <header className="pt-8 pb-6 fade-in-up">
        <div className="max-w-md mx-auto glass rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="iarua learning" 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-md"
              />
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-primary">
                  iarua learning
                </h1>
                <p className="text-muted-foreground text-xs">AI Study Companion</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Daily Quote Card */}
      <Card className="glass mx-auto max-w-md p-5 sm:p-6 mb-4 sm:mb-6 fade-in-up border-border" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 sm:mt-1 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-foreground/80 italic leading-relaxed">
            {quote}
          </p>
        </div>
      </Card>

      {/* Study Center Card */}
      <Card className="glass mx-auto max-w-md p-6 sm:p-8 mb-6 sm:mb-8 fade-in-up border-border" style={{ animationDelay: '0.2s' }}>
        <div className="text-center space-y-4 sm:space-y-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center shadow-md">
            <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Ready to Learn?</h2>
            <p className="text-muted-foreground text-xs sm:text-sm px-2">
              Upload materials, practice flashcards, or chat with your AI tutor
            </p>
          </div>
          <Button 
            onClick={() => navigate("/materials")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 sm:py-7 rounded-2xl shadow-md text-sm sm:text-base"
          >
            Start Session
          </Button>
        </div>
      </Card>

      {/* Quick Actions Grid */}
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 sm:gap-4 fade-in-up" style={{ animationDelay: '0.3s' }}>
        <Card 
          onClick={() => navigate("/flashcards")}
          className="glass p-6 sm:p-7 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 border-border"
        >
          <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">Flashcards</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Practice & Review</p>
        </Card>

        <Card 
          onClick={() => navigate("/notes")}
          className="glass p-6 sm:p-7 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 border-border"
        >
          <Brain className="w-8 h-8 sm:w-9 sm:h-9 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">Study Notes</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">AI Generated</p>
        </Card>

        <Card 
          onClick={() => navigate("/quizzes")}
          className="glass p-6 sm:p-7 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 border-border"
        >
          <MessageSquare className="w-8 h-8 sm:w-9 sm:h-9 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">Quizzes</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Test Your Knowledge</p>
        </Card>

        <Card 
          onClick={() => navigate("/tutor")}
          className="glass p-6 sm:p-7 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-95 border-border"
        >
          <MessageSquare className="w-8 h-8 sm:w-9 sm:h-9 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">AI Tutor</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Get Help</p>
        </Card>
      </div>
    </div>
  );
});

Home.displayName = 'Home';

export default Home;
