import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AegisLayout from "@/components/AegisLayout";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import ConfigReview from "@/pages/ConfigReview";
import Findings from "@/pages/Findings";
import HeaderReview from "@/pages/HeaderReview";
import NotFound from "@/pages/NotFound";
import Portfolio from "@/pages/Portfolio";
import Programs from "@/pages/Programs";
import Reports from "@/pages/Reports";
import Safety from "@/pages/Safety";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/"><AegisLayout><Dashboard /></AegisLayout></Route>
      <Route path="/programs"><AegisLayout><Programs /></AegisLayout></Route>
      <Route path="/assets"><AegisLayout><Assets /></AegisLayout></Route>
      <Route path="/findings"><AegisLayout><Findings /></AegisLayout></Route>
      <Route path="/reports"><AegisLayout><Reports /></AegisLayout></Route>
      <Route path="/header-review"><AegisLayout><HeaderReview /></AegisLayout></Route>
      <Route path="/config-review"><AegisLayout><ConfigReview /></AegisLayout></Route>
      <Route path="/safety"><AegisLayout><Safety /></AegisLayout></Route>
      <Route path="/portfolio" component={Portfolio} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
