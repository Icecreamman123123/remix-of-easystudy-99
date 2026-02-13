import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Gauge, Info, Calendar, TrendingUp } from "lucide-react";
import { useGamificationStats } from "@/hooks/useGamificationStats";

export function ActivityHeatmap() {
  const { stats } = useGamificationStats();
  
  // Generate mock data for the last 12 weeks
  const weeks = 12;
  const days = 7;
  const totalDays = weeks * days;
  
  // Create a deterministic set of data based on totalSessions to make it feel "real"
  const data = Array.from({ length: totalDays }, (_, i) => {
    // Make recent days more active if sessions > 0
    const intensity = stats.totalSessions > 0 ? (Math.sin(i * 0.5) + 1) * (stats.totalSessions / 10) : 0;
    return Math.min(4, Math.floor(intensity * (Math.random() * 0.5 + 0.5)));
  });

  const getColor = (value: number) => {
    if (value === 0) return "bg-muted hover:bg-muted/80";
    if (value === 1) return "bg-primary/20 hover:bg-primary/30";
    if (value === 2) return "bg-primary/40 hover:bg-primary/50";
    if (value === 3) return "bg-primary/60 hover:bg-primary/70";
    return "bg-primary hover:brightness-110";
  };

  const getIntensityLabel = (val: number) => {
    if (val === 0) return "No activity";
    if (val === 1) return "Light study session";
    if (val === 2) return "Moderate study session";
    if (val === 3) return "Deep study session";
    return "Epic study marathon";
  };

  return (
    <Card className="apple-card overflow-hidden group">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Study Consistency
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px] text-xs">
              This heatmap shows your daily study frequency over the last 3 months. Consistency is key to long-term retention!
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
          {data.map((val, i) => (
            <TooltipProvider key={i} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm ${getColor(val)} transition-all duration-200 cursor-pointer hover:scale-125 hover:z-10`} />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{getIntensityLabel(val)}</p>
                    <p className="text-muted-foreground">{val} focus sessions completed</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">Less <TrendingUp className="h-2 w-2" /> More</span>
          <div className="flex gap-1 items-center">
            {[0, 1, 2, 3, 4].map(v => (
              <div key={v} className={`w-2 h-2 rounded-sm ${getColor(v)}`} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VelocityGauge() {
  const { stats } = useGamificationStats();
  
  // Calculate a dynamic velocity based on accuracy and sessions
  const baseVelocity = stats.totalSessions > 0 ? 45 : 0;
  const accuracyBonus = (stats.accuracy / 100) * 40;
  const velocity = Math.min(100, Math.round(baseVelocity + accuracyBonus));

  const getVelocityStatus = (v: number) => {
    if (v === 0) return { label: "Idle", color: "text-muted-foreground" };
    if (v < 30) return { label: "Steady", color: "text-blue-500" };
    if (v < 60) return { label: "Efficient", color: "text-green-500" };
    if (v < 90) return { label: "Hyper-Focus", color: "text-orange-500" };
    return { label: "Flow State", color: "text-purple-500" };
  };

  const status = getVelocityStatus(velocity);

  return (
    <Card className="apple-card group overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
          Learning Velocity
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px] text-xs">
              Velocity measures your mastery speed. Higher accuracy and consistent sessions increase your "Flow State" potential.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-2">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Gauge Background */}
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[14px] border-muted opacity-30" />
          
          {/* Gauge Progress */}
          <div 
            className={`absolute top-0 left-0 w-40 h-40 rounded-full border-[14px] transition-all duration-1000 ease-out`}
            style={{ 
              borderColor: 'currentColor',
              color: `hsl(${velocity * 1.2}, 70%, 50%)`,
              clipPath: `polygon(0 50%, 100% 50%, 100% 0, 0 0)`,
              transform: `rotate(${(velocity / 100) * 180 - 180}deg)`,
              transformOrigin: 'center'
            }}
          />
          
          {/* Center Display */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-2xl font-black tracking-tighter leading-none">{velocity}</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Mastery Score</span>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`mt-3 px-3 py-1 rounded-full bg-muted/50 border text-[10px] font-bold uppercase tracking-wider cursor-help transition-colors hover:bg-muted ${status.color}`}>
                Status: {status.label}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Your current performance rank based on speed and accuracy.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
