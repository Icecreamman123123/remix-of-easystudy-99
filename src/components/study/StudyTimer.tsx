import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_SETTINGS = {
  focus: { duration: 10 * 60, label: "Focus Time", icon: Brain },
  shortBreak: { duration: 5 * 60, label: "Short Break", icon: Coffee },
  longBreak: { duration: 15 * 60, label: "Long Break", icon: Coffee },
};

export function StudyTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusCompleted, setFocusCompleted] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = useCallback((newMode: TimerMode) => {
    // Only allow break modes if focus has been completed
    if (newMode !== "focus" && !focusCompleted) {
      return;
    }

    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode].duration);
    setIsRunning(false);

    // Reset focus completed when switching to focus mode
    if (newMode === "focus") {
      setFocusCompleted(false);
    }
  }, [focusCompleted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === "focus") {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        setFocusCompleted(true);
        // After 4 focus sessions, suggest a long break
        if (newSessions % 4 === 0) {
          handleModeChange("longBreak");
        } else {
          handleModeChange("shortBreak");
        }
      } else {
        setFocusCompleted(false);
        handleModeChange("focus");
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessions, handleModeChange]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    // Don't allow reset during focus if running (no breaks before complete)
    if (mode === "focus" && isRunning) {
      return;
    }
    setTimeLeft(TIMER_SETTINGS[mode].duration);
    setIsRunning(false);
  };

  const progress = (timeLeft / TIMER_SETTINGS[mode].duration) * 100;
  const CurrentIcon = TIMER_SETTINGS[mode].icon;

  const isBreakLocked = (m: TimerMode) => m !== "focus" && !focusCompleted;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 icon-gradient rounded-md">
            <CurrentIcon className="h-4 w-4 text-white" />
          </div>
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(Object.keys(TIMER_SETTINGS) as TimerMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange(m)}
              disabled={isBreakLocked(m)}
              className={cn(
                "flex-1 text-xs relative",
                isBreakLocked(m) && "opacity-50"
              )}
            >
              {isBreakLocked(m) && <Lock className="h-3 w-3 mr-1" />}
              {TIMER_SETTINGS[m].label}
            </Button>
          ))}
        </div>

        {!focusCompleted && mode === "focus" && !isRunning && timeLeft === TIMER_SETTINGS.focus.duration && (
          <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-md py-2 px-3">
            🔒 Complete a focus session to unlock breaks
          </p>
        )}

        <div className="relative">
          <div
            className="absolute inset-0 bg-primary/10 rounded-lg transition-all"
            style={{ width: `${progress}%` }}
          />
          <div className="relative text-center py-8">
            <p className="text-5xl font-mono font-bold">{formatTime(timeLeft)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {TIMER_SETTINGS[mode].label} • Session {sessions + 1}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Button size="lg" onClick={toggleTimer}>
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={resetTimer}
            disabled={mode === "focus" && isRunning}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Complete 4 focus sessions for a long break
        </p>
      </CardContent>
    </Card>
  );
}
