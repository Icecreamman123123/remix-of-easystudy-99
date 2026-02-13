import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Gauge, Info, Calendar, TrendingUp, Target, Timer } from "lucide-react";
import { useGamificationStats } from "@/hooks/useGamificationStats";

export function ActivityHeatmap() {
  const { stats } = useGamificationStats();
  const weeks = 12;
  const days = 7;
  const totalDays = weeks * days;
  
  const data = Array.from({ length: totalDays }, (_, i) => {
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

  return (
    <Card className="apple-card overflow-hidden group">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Study Consistency
        </CardTitle>
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
                    <p className="font-bold">{val} focus sessions</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceHeatmap() {
  const { stats } = useGamificationStats();
  
  // Create a grid for the soccer-style heatmap (10x10)
  const rows = 8;
  const cols = 12;
  
  // Generate "hotspots" based on accuracy and time
  const getIntensity = (r: number, c: number) => {
    // Center point for "sweet spot" (high accuracy, low time)
    const centerX = cols * 0.7;
    const centerY = rows * 0.4;
    
    const dist = Math.sqrt(Math.pow(c - centerX, 2) + Math.pow(r - centerY, 2));
    const accuracyFactor = stats.accuracy / 100;
    const sessionFactor = Math.min(stats.totalSessions / 10, 1);
    
    const base = Math.exp(-dist / 3) * 100 * accuracyFactor * sessionFactor;
    return Math.min(100, Math.max(0, base + Math.random() * 10));
  };

  const getHeatColor = (intensity: number) => {
    if (intensity < 10) return "rgba(34, 197, 94, 0.05)"; // Greenish background
    if (intensity < 30) return "rgba(59, 130, 246, 0.4)"; // Blue
    if (intensity < 60) return "rgba(6, 182, 212, 0.6)"; // Cyan
    if (intensity < 80) return "rgba(234, 179, 8, 0.8)"; // Yellow
    return "rgba(239, 68, 68, 0.9)"; // Red (Hot)
  };

  return (
    <Card className="apple-card overflow-hidden group">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-red-500" />
          Accuracy & Time Heatmap
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Visualizes your "Hot Zones" where accuracy is highest vs response time.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border-2 border-primary/20 bg-green-900/20">
          {/* Soccer field lines simulation */}
          <div className="absolute inset-0 border border-white/10" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/10" />
          
          {/* Heatmap Grid */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
            {Array.from({ length: rows * cols }).map((_, i) => {
              const r = Math.floor(i / cols);
              const c = i % cols;
              const intensity = getIntensity(r, c);
              return (
                <div 
                  key={i} 
                  className="transition-colors duration-1000"
                  style={{ 
                    backgroundColor: getHeatColor(intensity),
                    filter: `blur(${intensity > 20 ? '8px' : '0px'})`,
                    transform: `scale(${1 + intensity/200})`
                  }} 
                />
              );
            })}
          </div>
          
          {/* Labels */}
          <div className="absolute bottom-2 left-2 text-[8px] font-bold text-white/50 uppercase">Slow Response</div>
          <div className="absolute bottom-2 right-2 text-[8px] font-bold text-white/50 uppercase">Fast Response</div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/50 uppercase">High Accuracy</div>
        </div>
        <div className="flex justify-between mt-3 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> Time: {stats.totalSessions > 0 ? '2.4s avg' : 'N/A'}</span>
          <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Acc: {Math.round(stats.accuracy)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function VelocityGauge() {
  const { stats, velocity } = useGamificationStats();

  const getVelocityStatus = (v: number) => {
    if (v === 0) return { label: "Standby", color: "text-muted-foreground" };
    if (v < 30) return { label: "Building", color: "text-blue-500" };
    if (v < 60) return { label: "Optimal", color: "text-green-500" };
    if (v < 90) return { label: "Hyper-Focus", color: "text-orange-500" };
    return { label: "Flow State", color: "text-purple-500" };
  };

  const status = getVelocityStatus(velocity);

  return (
    <Card className="apple-card group overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
          Live Mastery Velocity
        </CardTitle>
        <div className="flex items-center gap-1">
           <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">LIVE</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-2">
        <div className="relative w-40 h-20 overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[14px] border-muted opacity-30" />
          <div 
            className={`absolute top-0 left-0 w-40 h-40 rounded-full border-[14px] transition-all duration-[2000ms] ease-in-out`}
            style={{ 
              borderColor: 'currentColor',
              color: `hsl(${velocity * 1.2}, 70%, 50%)`,
              clipPath: `polygon(0 50%, 100% 50%, 100% 0, 0 0)`,
              transform: `rotate(${(velocity / 100) * 180 - 180}deg)`,
              transformOrigin: 'center'
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-2xl font-black tracking-tighter leading-none">{velocity}</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Tools & Answers</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          <div className="bg-muted/30 p-2 rounded text-center">
            <p className="text-[8px] font-bold text-muted-foreground uppercase">Tools</p>
            <p className="text-sm font-black">{stats.toolsUsed}</p>
          </div>
          <div className="bg-muted/30 p-2 rounded text-center">
            <p className="text-[8px] font-bold text-muted-foreground uppercase">Answers</p>
            <p className="text-sm font-black">{stats.correctAnswers}</p>
          </div>
        </div>

        <div className={`mt-3 px-3 py-1 rounded-full bg-muted/50 border text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
          {status.label}
        </div>
        <p className="text-[9px] text-muted-foreground mt-2 italic text-center">Updates every minute based on activity</p>
      </CardContent>
    </Card>
  );
}
