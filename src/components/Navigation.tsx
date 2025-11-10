import { memo } from "react";
import { Home, BookOpen, FileText, MessageSquare, User, ClipboardCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Cards", path: "/flashcards" },
    { icon: ClipboardCheck, label: "Quiz", path: "/quizzes" },
    { icon: FileText, label: "Notes", path: "/notes" },
    { icon: MessageSquare, label: "Tutor", path: "/tutor" },
    { icon: User, label: "You", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-3 pb-safe pb-3 sm:pb-6">
      <div className="glass-strong max-w-3xl mx-auto rounded-3xl shadow-float p-1.5 sm:p-2 flex justify-between items-center border border-border">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-2xl sm:rounded-[18px] flex-1 transition-all duration-300",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95"
              )}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] sm:text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
