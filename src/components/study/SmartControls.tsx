import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Brain, Target, BarChart3 } from "lucide-react";

export function MethodSuitability({ method }: { method: string }) {
  const getSuitability = (m: string) => {
    const maps: Record<string, { label: string; color: string }> = {
      flashcards: { label: "Best for Memory", color: "bg-blue-500/10 text-blue-500" },
      quiz: { label: "Best for Testing", color: "bg-green-500/10 text-green-500" },
      mindmap: { label: "Best for Concepts", color: "bg-purple-500/10 text-purple-500" },
      summarize: { label: "Best for Review", color: "bg-orange-500/10 text-orange-500" },
    };
    return maps[method.toLowerCase()] || { label: "General Purpose", color: "bg-muted text-muted-foreground" };
  };

  const { label, color } = getSuitability(method);

  return (
    <Badge variant="outline" className={`text-[10px] font-normal border-none ${color}`}>
      {label}
    </Badge>
  );
}

export function AdaptiveDifficulty({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-semibold flex items-center gap-2">
          <Brain className="h-3 w-3" />
          Adaptive Difficulty
        </Label>
        <span className="text-[10px] font-bold bg-primary/20 px-2 py-0.5 rounded">
          LVL {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        max={10}
        step={1}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
        <span>Foundational</span>
        <span>Expert</span>
      </div>
    </div>
  );
}
