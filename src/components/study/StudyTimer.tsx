import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain, Lock, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_SETTINGS = {
  focus: { duration: 10 * 60, label: "Focus", icon: Brain, color: "hsl(var(--primary))" },
  shortBreak: { duration: 5 * 60, label: "Short Break", icon: Coffee, color: "hsl(var(--chart-2))" },
  longBreak: { duration: 15 * 60, label: "Long Break", icon: Coffee, color: "hsl(var(--chart-4))" },
};

export function StudyTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusCompleted, setFocusCompleted] = useState(false);

  const totalDuration = TIMER_SETTINGS[mode].duration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = useCallback((newMode: TimerMode) => {
    if (newMode !== "focus" && !focusCompleted) return;
    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode].duration);
    setIsRunning(false);
    if (newMode === "focus") setFocusCompleted(false);
  }, [focusCompleted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === "focus") {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        setFocusCompleted(true);
        handleModeChange(newSessions % 4 === 0 ? "longBreak" : "shortBreak");
      } else {
        setFocusCompleted(false);
        handleModeChange("focus");
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessions, handleModeChange]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    if (mode === "focus" && isRunning) return;
    setTimeLeft(TIMER_SETTINGS[mode].duration);
    setIsRunning(false);
  };

  const isBreakLocked = (m: TimerMode) => m !== "focus" && !focusCompleted;
  const CurrentIcon = TIMER_SETTINGS[mode].icon;

  // Circular progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-1.5 bg-muted/50 rounded-lg p-1">
          {(Object.keys(TIMER_SETTINGS) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              disabled={isBreakLocked(m)}
              className={cn(
                "flex-1 text-xs font-medium py-2 px-2 rounded-md transition-all flex items-center justify-center gap-1",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                isBreakLocked(m) && "opacity-40 cursor-not-allowed"
              )}
            >
              {isBreakLocked(m) && <Lock className="h-3 w-3" />}
              {TIMER_SETTINGS[m].label}
            </button>
          ))}
        </div>

        {/* Circular timer */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={TIMER_SETTINGS[mode].color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <CurrentIcon className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-4xl font-mono font-bold tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Session {sessions + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            disabled={mode === "focus" && isRunning}
            className="h-10 w-10 rounded-full"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            onClick={toggleTimer}
            className="h-14 w-14 rounded-full shadow-lg"
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (mode === "focus") {
                setTimeLeft(0);
              }
            }}
            disabled={!isRunning || mode !== "focus"}
            className="h-10 w-10 rounded-full"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Session dots */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i < (sessions % 4)
                  ? "bg-primary scale-110"
                  : "bg-muted-foreground/20"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-2">
            {4 - (sessions % 4)} until long break
          </span>
        </div>

        {!focusCompleted && mode === "focus" && !isRunning && timeLeft === TIMER_SETTINGS.focus.duration && (
          <p className="text-[11px] text-center text-muted-foreground">
            🔒 Complete a focus session to unlock breaks
          </p>
        )}
      </CardContent>
    </Card>
  );
}
