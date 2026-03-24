import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";


function Router() {
  const botUsername = "YourBotUsername"; // This should ideally come from env
  const botLink = `https://t.me/${botUsername}`;

  return (
    <Switch>
      <Route path="/">
        {() => {
          // Redirect root to Telegram Bot
          useEffect(() => {
            window.location.href = botLink;
          }, []);
          return (
            <div className="flex items-center justify-center min-h-screen font-mono text-sm uppercase opacity-50">
              Redirecting to Telegram Bot...
            </div>
          );
        }}
      </Route>
      <Route path="/send/:token" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
