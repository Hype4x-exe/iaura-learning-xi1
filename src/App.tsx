import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load all page components for better performance
const Home = lazy(() => import("./pages/Home"));
const Materials = lazy(() => import("./pages/Materials"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const AITutor = lazy(() => import("./pages/AITutor"));
const Notes = lazy(() => import("./pages/Notes"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Navigation = lazy(() => import("./components/Navigation"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Home /><Navigation /></ProtectedRoute>} />
                <Route path="/materials" element={<ProtectedRoute><Materials /><Navigation /></ProtectedRoute>} />
                <Route path="/flashcards" element={<ProtectedRoute><Flashcards /><Navigation /></ProtectedRoute>} />
                <Route path="/tutor" element={<ProtectedRoute><AITutor /><Navigation /></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><Notes /><Navigation /></ProtectedRoute>} />
                <Route path="/quizzes" element={<ProtectedRoute><Quizzes /><Navigation /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /><Navigation /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
