import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Award, TrendingUp, Settings, LogOut, Loader2, Check, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Stats = {
  flashcardsCount: number;
  notesCount: number;
  materialsCount: number;
};

type Theme = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
};

const THEMES: Theme[] = [
  {
    id: "vibrant",
    name: "Vibrant",
    primary: "#00D4FF",
    secondary: "#FF006E",
    accent: "#00D4FF",
    description: "Bold and energetic"
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "#0066FF",
    secondary: "#00D4FF",
    accent: "#0066FF",
    description: "Cool and calm"
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#FF6B35",
    secondary: "#FFD23F",
    accent: "#FF6B35",
    description: "Warm and inviting"
  },
  {
    id: "forest",
    name: "Forest",
    primary: "#2D6A4F",
    secondary: "#40916C",
    accent: "#52B788",
    description: "Natural and fresh"
  },
  {
    id: "purple",
    name: "Purple",
    primary: "#9D4EDD",
    secondary: "#E0AAFF",
    accent: "#9D4EDD",
    description: "Creative and elegant"
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#E75480",
    secondary: "#FF9ECD",
    accent: "#E75480",
    description: "Soft and romantic"
  }
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { currentTheme, isDarkMode, setTheme, setDarkMode } = useTheme();
  const [stats, setStats] = useState<Stats>({ flashcardsCount: 0, notesCount: 0, materialsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showThemeSettings, setShowThemeSettings] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const handleThemeChange = async (themeId: string) => {
    await setTheme(themeId as any);
  };

  const handleDarkModeToggle = async () => {
    await setDarkMode(!isDarkMode);
  };

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const [flashcards, notes, materials] = await Promise.all([
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("materials").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setStats({
        flashcardsCount: flashcards.count || 0,
        notesCount: notes.count || 0,
        materialsCount: materials.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg p-4 pb-24">
      <header className="pt-8 pb-6 text-center fade-in-up">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-neon flex items-center justify-center shadow-neon breathe">
            <User className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-neon opacity-30 blur-2xl animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-1 bg-gradient-neon bg-clip-text text-transparent">
          {user?.email?.split("@")[0] || "Student"}
        </h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        {/* Theme Settings Card */}
        <Card className="glass-strong p-6 shadow-float fade-in-up border-white/40" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Theme Settings
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThemeSettings(!showThemeSettings)}
              className="text-xs"
            >
              {showThemeSettings ? "Hide" : "Show"}
            </Button>
          </div>

          {showThemeSettings && (
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-[16px]">
                <div className="flex items-center gap-2">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{isDarkMode ? "Dark" : "Light"} Mode</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDarkModeToggle}
                  className="rounded-full"
                >
                  {isDarkMode ? "Light" : "Dark"}
                </Button>
              </div>

              {/* Color Themes Grid */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Color Themes</p>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={cn(
                        "relative p-4 rounded-[16px] border-2 transition-all duration-300 group",
                        currentTheme === theme.id
                          ? "border-white/60 bg-white/20 scale-105"
                          : "border-white/20 bg-white/10 hover:border-white/40"
                      )}
                    >
                      {/* Theme Color Preview */}
                      <div className="flex gap-1.5 mb-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-md"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full shadow-md"
                          style={{ backgroundColor: theme.secondary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full shadow-md"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <p className="text-xs font-bold text-left">{theme.name}</p>
                      <p className="text-[10px] text-muted-foreground text-left">{theme.description}</p>
                      
                      {/* Checkmark for Selected Theme */}
                      {currentTheme === theme.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gradient-neon flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
        {/* Stats Card with Glow */}
        <Card className="glass-strong p-6 shadow-float fade-in-up border-white/40" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-bold mb-5 text-lg">Your Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center group">
              <div className="relative inline-block mb-3">
                <div className="w-14 h-14 mx-auto rounded-[16px] bg-gradient-neon flex items-center justify-center shadow-neon transition-transform duration-500 group-hover:scale-110">
                  <TrendingUp className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-[16px] bg-gradient-neon opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
              </div>
              <p className="text-2xl font-bold mb-1 bg-gradient-neon bg-clip-text text-transparent">{stats.flashcardsCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Flashcards</p>
            </div>
            
            <div className="text-center group">
              <div className="relative inline-block mb-3">
                <div className="w-14 h-14 mx-auto rounded-[16px] bg-gradient-neon flex items-center justify-center shadow-neon transition-transform duration-500 group-hover:scale-110">
                  <Award className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-[16px] bg-gradient-neon opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
              </div>
              <p className="text-2xl font-bold mb-1 bg-gradient-neon bg-clip-text text-transparent">{stats.notesCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Notes</p>
            </div>
            
            <div className="text-center group">
              <div className="relative inline-block mb-3">
                <div className="w-14 h-14 mx-auto rounded-[16px] bg-gradient-neon flex items-center justify-center shadow-neon transition-transform duration-500 group-hover:scale-110">
                  <Settings className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-[16px] bg-gradient-neon opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
              </div>
              <p className="text-2xl font-bold mb-1 bg-gradient-neon bg-clip-text text-transparent">{stats.materialsCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Materials</p>
            </div>
          </div>
        </Card>

        {/* Liquid Progress Bar */}
        <Card className="glass-strong p-6 shadow-glass fade-in-up border-white/40" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-bold mb-4 text-lg">Keep Learning!</h2>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-3 backdrop-blur-sm">
            <div className="h-full bg-gradient-neon w-3/4 transition-all duration-1000 shadow-neon relative">
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            You're making great progress! Keep studying to reach your goals.
          </p>
        </Card>

        {/* Glass Sign Out Button */}
        <Button
          onClick={signOut}
          className="w-full glass rounded-[20px] py-7 hover:shadow-glow transition-all duration-500 border-white/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          <span className="font-semibold">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default Profile;
