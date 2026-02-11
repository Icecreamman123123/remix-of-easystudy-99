import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Gauge } from "lucide-react";

export function ActivityHeatmap() {
  // Generate mock data for the last 12 weeks
  const weeks = 12;
  const days = 7;
  const data = Array.from({ length: weeks * days }, () => Math.floor(Math.random() * 5));

  const getColor = (value: number) => {
    if (value === 0) return "bg-muted";
    if (value === 1) return "bg-primary/20";
    if (value === 2) return "bg-primary/40";
    if (value === 3) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Study Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {data.map((val, i) => (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger>
                  <div className={`w-3 h-3 rounded-sm ${getColor(val)} transition-colors hover:ring-1 hover:ring-primary`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{val} sessions on this day</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-sm bg-muted" />
            <div className="w-2 h-2 rounded-sm bg-primary/20" />
            <div className="w-2 h-2 rounded-sm bg-primary/60" />
            <div className="w-2 h-2 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function VelocityGauge({ velocity = 75 }: { velocity?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Learning Velocity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-0">
        <div className="relative w-32 h-16 overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-muted" />
          <div 
            className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-primary transition-all duration-1000 ease-out"
            style={{ 
              clipPath: `polygon(0 50%, 100% 50%, 100% 0, 0 0)`,
              transform: `rotate(${(velocity / 100) * 180 - 180}deg)`,
              transformOrigin: 'center'
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xl font-bold">
            {velocity}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Cards per hour</p>
      </CardContent>
    </Card>
  );
}
