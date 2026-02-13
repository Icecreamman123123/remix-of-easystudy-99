import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Zap,
  Trophy,
  Star,
  Flame,
  Award,
  TrendingUp,
  Target,
  Crown,
  Info,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useGamificationStats } from "@/hooks/useGamificationStats";

export function GamificationHub() {
  const { stats } = useGamificationStats();

  const levelProgress = (stats.points / stats.nextLevelPoints) * 100;
  const pointsToNextLevel = stats.nextLevelPoints - stats.points;

  const getLevelTier = (level: number) => {
    if (level >= 10) return { label: "Grandmaster", icon: "👑", color: "text-purple-500", bg: "bg-purple-500/10" };
    if (level >= 7) return { label: "Expert", icon: "⭐", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (level >= 5) return { label: "Scholar", icon: "🏆", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (level >= 3) return { label: "Apprentice", icon: "🎯", color: "text-green-500", bg: "bg-green-500/10" };
    return { label: "Novice", icon: "🌟", color: "text-muted-foreground", bg: "bg-muted" };
  };

  const tier = getLevelTier(stats.level);

  return (
    <TooltipProvider>
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Progress
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Crown className="h-4 w-4" /> Rankings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Level Card - Interactive */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="apple-card bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20 overflow-hidden group cursor-help">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="h-20 w-20 text-primary rotate-12" />
                </div>
                <CardHeader className="pb-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500 animate-bounce" />
                        Level {stats.level}
                      </CardTitle>
                      <Badge variant="secondary" className={`${tier.bg} ${tier.color} border-none font-bold uppercase tracking-widest text-[10px]`}>
                        {tier.label}
                      </Badge>
                    </div>
                    <span className="text-4xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-500">{tier.icon}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mastery Progress</span>
                      <span className="text-xs font-mono font-bold">
                        {stats.points} <span className="text-muted-foreground">/ {stats.nextLevelPoints} XP</span>
                      </span>
                    </div>
                    <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden border border-primary/10">
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${levelProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground italic">
                      Gain {pointsToNextLevel} more XP to reach Level {stats.level + 1}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px] p-3 space-y-2">
              <p className="font-bold text-sm">Leveling System</p>
              <p className="text-xs text-muted-foreground">Your level reflects your total study investment. Each session adds XP based on duration and accuracy.</p>
              <div className="pt-2 border-t border-border flex justify-between items-center text-[10px] font-bold">
                <span>NEXT REWARD:</span>
                <span className="text-primary">Custom Profile Icon</span>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Stats Grid - Responsive & Interactive */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "XP Points", val: stats.points, icon: Zap, color: "text-yellow-500", desc: "Total experience earned from all study sessions." },
              { label: "Sessions", val: stats.totalSessions, icon: Target, color: "text-blue-500", desc: "Number of focused study blocks completed." },
              { label: "Accuracy", val: `${Math.round(stats.accuracy)}%`, icon: TrendingUp, color: "text-green-500", desc: "Average score across all quizzes and tests." },
              { label: "Day Streak", val: stats.streak, icon: Flame, color: "text-orange-500", desc: "Consecutive days of active studying." }
            ].map((item, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Card className="apple-card hover-glow cursor-help group transition-all duration-300">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{item.label}</p>
                        <item.icon className={`h-4 w-4 ${item.color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
                      </div>
                      <p className="text-2xl font-black mt-2 tracking-tighter">{item.val}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[150px]">{item.desc}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Achievements Preview */}
          <Card className="apple-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Badges Earned
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider">View All <ChevronRight className="h-3 w-3 ml-1" /></Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: "🎯", label: "First Steps", hint: "Completed 1st session" },
                  { icon: "⚡", label: "Quick Learner", hint: "80%+ accuracy" },
                  { icon: "🔥", label: "On Fire", hint: "3 day streak" },
                ].map((achievement, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1.5 py-1 px-2 cursor-help hover:bg-primary/10 transition-colors">
                        <span>{achievement.icon}</span>
                        <span className="text-[10px] font-bold">{achievement.label}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-bold">{achievement.label}</p>
                      <p className="text-[10px] text-muted-foreground">{achievement.hint}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card className="apple-card overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Global Rankings
                </CardTitle>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Week 7</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[
                  { rank: 1, name: "StudySage", points: 2450, badge: "👑", self: false },
                  { rank: 2, name: "You", points: stats.points, badge: "⭐", self: true },
                  { rank: 3, name: "QuizWhiz", points: 1820, badge: "🏆", self: false },
                  { rank: 4, name: "Brainiac", points: 1540, badge: "🎯", self: false },
                ].sort((a, b) => b.points - a.points).map((user, idx) => (
                  <div
                    key={user.name}
                    className={`flex items-center justify-between p-4 transition-colors ${user.self ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-black w-4 ${idx === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${user.self ? 'border-primary bg-primary/20' : 'border-muted bg-muted'}`}>
                          {user.badge}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${user.self ? 'text-primary' : ''}`}>{user.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Tier: {getLevelTier(Math.floor(user.points/100)).label}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm tabular-nums">{user.points}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
