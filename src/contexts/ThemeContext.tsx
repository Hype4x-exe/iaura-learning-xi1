import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Theme = "vibrant" | "ocean" | "sunset" | "forest" | "purple" | "rose";

interface ThemeContextType {
  currentTheme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  setDarkMode: (darkMode: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES = {
  vibrant: { primary: "#00D4FF", secondary: "#FF006E", accent: "#00D4FF" },
  ocean: { primary: "#0066FF", secondary: "#00D4FF", accent: "#0066FF" },
  sunset: { primary: "#FF6B35", secondary: "#FFD23F", accent: "#FF6B35" },
  forest: { primary: "#2D6A4F", secondary: "#40916C", accent: "#52B788" },
  purple: { primary: "#9D4EDD", secondary: "#E0AAFF", accent: "#9D4EDD" },
  rose: { primary: "#E75480", secondary: "#FF9ECD", accent: "#E75480" }
};

const hexToHSL = (hex: string) => {
  let h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16) / 255;
  let g = parseInt(h.substring(2, 4), 16) / 255;
  let b = parseInt(h.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    
    switch (max) {
      case r:
        hue = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / (max - min) + 2) / 6;
        break;
      case b:
        hue = ((r - g) / (max - min) + 4) / 6;
        break;
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}`;
};

const applyTheme = (themeId: Theme, darkMode: boolean) => {
  const theme = THEMES[themeId];
  const root = document.documentElement;
  
  const primaryHSL = hexToHSL(theme.primary);
  const secondaryHSL = hexToHSL(theme.secondary);
  const accentHSL = hexToHSL(theme.accent);
  
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--accent', accentHSL);
  
  if (darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<Theme>("vibrant");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preferences on mount and when user changes
  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Try to load from Supabase
          const { data, error } = await supabase
            .from("user_preferences")
            .select("theme, dark_mode")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            throw error;
          }

          if (data) {
            setCurrentTheme((data.theme as Theme) || "vibrant");
            setIsDarkMode(data.dark_mode || false);
            applyTheme((data.theme as Theme) || "vibrant", data.dark_mode || false);
          } else {
            // Fallback to localStorage
            const savedTheme = (localStorage.getItem("appTheme") as Theme) || "vibrant";
            const savedDarkMode = localStorage.getItem("darkMode") === "true";
            setCurrentTheme(savedTheme);
            setIsDarkMode(savedDarkMode);
            applyTheme(savedTheme, savedDarkMode);
          }
        } else {
          // Not logged in, use localStorage
          const savedTheme = (localStorage.getItem("appTheme") as Theme) || "vibrant";
          const savedDarkMode = localStorage.getItem("darkMode") === "true";
          setCurrentTheme(savedTheme);
          setIsDarkMode(savedDarkMode);
          applyTheme(savedTheme, savedDarkMode);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
        const savedTheme = (localStorage.getItem("appTheme") as Theme) || "vibrant";
        const savedDarkMode = localStorage.getItem("darkMode") === "true";
        setCurrentTheme(savedTheme);
        setIsDarkMode(savedDarkMode);
        applyTheme(savedTheme, savedDarkMode);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [user]);

  const setTheme = async (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("appTheme", theme);
    applyTheme(theme, isDarkMode);

    if (user) {
      try {
        await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            theme,
            dark_mode: isDarkMode,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    }
  };

  const setDarkMode = async (darkMode: boolean) => {
    setIsDarkMode(darkMode);
    localStorage.setItem("darkMode", String(darkMode));
    applyTheme(currentTheme, darkMode);

    if (user) {
      try {
        await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            theme: currentTheme,
            dark_mode: darkMode,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });
      } catch (error) {
        console.error("Error saving dark mode:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, isDarkMode, setTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
