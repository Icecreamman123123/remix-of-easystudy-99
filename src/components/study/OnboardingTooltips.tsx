import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle, X } from "lucide-react";

interface TooltipConfig {
  id: string;
  title: string;
  content: string;
  position?: "top" | "right" | "bottom" | "left";
}

const ONBOARDING_TOOLTIPS: TooltipConfig[] = [
  {
    id: "study-input",
    title: "Study Input",
    content:
      "Enter a topic or upload materials here. You can choose from multiple study methods below.",
    position: "bottom",
  },
  {
    id: "study-methods",
    title: "Study Methods",
    content:
      "Select from various proven study techniques like flashcards, quizzes, mind maps, and more.",
    position: "top",
  },
  {
    id: "pomodoro-timer",
    title: "Pomodoro Timer",
    content:
      "Use this timer to maintain focused study sessions with strategic breaks.",
    position: "left",
  },
  {
    id: "achievements",
    title: "Achievements",
    content:
      "Earn badges and milestones as you progress. Build streaks and unlock new levels!",
    position: "left",
  },
];

interface OnboardingTooltipsProps {
  targetId: string;
  children: React.ReactNode;
}

export function OnboardingTooltip({
  targetId,
  children,
}: OnboardingTooltipsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTooltip, setHasSeenTooltip] = useState(false);

  useEffect(() => {
    // Check if user has seen this tooltip before
    const seenTooltips = localStorage.getItem("seenOnboardingTooltips");
    const seen = seenTooltips ? JSON.parse(seenTooltips) : {};
    setHasSeenTooltip(seen[targetId] || false);

    // Show tooltip after a delay on first visit
    if (!seen[targetId]) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [targetId]);

  const tooltip = ONBOARDING_TOOLTIPS.find((t) => t.id === targetId);

  if (!tooltip) return <>{children}</>;

  const handleDismiss = () => {
    setIsVisible(false);
    const seenTooltips = localStorage.getItem("seenOnboardingTooltips");
    const seen = seenTooltips ? JSON.parse(seenTooltips) : {};
    seen[targetId] = true;
    localStorage.setItem("seenOnboardingTooltips", JSON.stringify(seen));
    setHasSeenTooltip(true);
  };

  return (
    <TooltipProvider>
      <Tooltip open={isVisible && !hasSeenTooltip} onOpenChange={setIsVisible}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={tooltip.position || "top"}
          className="max-w-xs bg-primary text-primary-foreground"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{tooltip.title}</p>
                <p className="text-xs mt-1">{tooltip.content}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function OnboardingGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenOnboardingGuide");
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  const handleClose = () => {
    setShowGuide(false);
    localStorage.setItem("hasSeenOnboardingGuide", "true");
  };

  if (!showGuide) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm">
      <div className="bg-card border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Welcome to EasyStudy!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Here are some tips to get started:
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="text-xs space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Choose a study method that matches your learning style</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Use the Pomodoro timer for focused study sessions</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Earn achievements and build your study streak</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Sign in to save your progress and track analytics</span>
          </li>
        </ul>

        <Button
          size="sm"
          onClick={handleClose}
          className="w-full"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
}
