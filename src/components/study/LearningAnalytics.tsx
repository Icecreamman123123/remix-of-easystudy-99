import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStudySessions } from "@/hooks/useStudySessions-simple";
import { 
  TrendingUp, 
  Target, 
  Flame, 
  BookOpen, 
  Loader2,
  Clock,
  Trophy,
  BarChart3,
  Gamepad2,
  Box,
  Network,
  ClipboardList
} from "lucide-react";

interface ModeStats {
  sessions: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgDuration: number;
}

const MODE_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  flashcards: { label: "Flashcards", icon: BookOpen, color: "text-blue-500" },
  quiz: { label: "Quiz", icon: ClipboardList, color: "text-purple-500" },
  "practice-test": { label: "Practice Test", icon: Target, color: "text-green-500" },
  "study-runner": { label: "Study Runner", icon: Gamepad2, color: "text-yellow-500" },
  leitner: { label: "Leitner", icon: Box, color: "text-orange-500" },
  "mind-map": { label: "Mind Map", icon: Network, color: "text-pink-500" },
};

export function LearningAnalytics() {
  const { stats, loading } = useStudySessions();
  const [selectedMode, setSelectedMode] = useState<string>("all");

  const modeStats = useMemo(() => {
    if (!stats?.recentSessions) return {};
    
    const byMode: Record<string, any[]> = {};
    
    stats.recentSessions.forEach(session => {
      const mode = session.session_type || "unknown";
      if (!byMode[mode]) byMode[mode] = [];
      byMode[mode].push(session);
    });
    
    const result: Record<string, ModeStats> = {};
    
    Object.entries(byMode).forEach(([mode, sessions]) => {
      const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
      const correctAnswers = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      
      result[mode] = {
        sessions: sessions.length,
        totalQuestions,
        correctAnswers,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        avgDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      };
    });
    
    return result;
  }, [stats]);

  const recentByDate = useMemo(() => {
    if (!stats?.recentSessions) return [];
    
    const last7Days: { date: string; sessions: number; accuracy: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const daySessions = stats.recentSessions.filter(
        s => s.completed_at.split("T")[0] === dateStr
      );
      
      const totalQ = daySessions.reduce((sum, s) => sum + s.total_questions, 0);
      const correctQ = daySessions.reduce((sum, s) => sum + s.correct_answers, 0);
      
      last7Days.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        sessions: daySessions.length,
        accuracy: totalQ > 0 ? (correctQ / totalQ) * 100 : 0,
      });
    }
    
    return last7Days;
  }, [stats]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Learning Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Complete study sessions to see detailed analytics!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Learning Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">{stats.streakDays}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{Math.round(stats.averageAccuracy)}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{stats.totalCardsStudied}</p>
            <p className="text-xs text-muted-foreground">Cards</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Last 7 Days
          </h4>
          <div className="flex gap-1 h-16">
            {recentByDate.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <div 
                  className="w-full bg-primary/20 rounded-t transition-all"
                  style={{ 
                    height: `${Math.max(4, (day.sessions / Math.max(...recentByDate.map(d => d.sessions), 1)) * 100)}%`,
                    opacity: day.sessions > 0 ? 1 : 0.3
                  }}
                >
                  {day.sessions > 0 && (
                    <div 
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${day.accuracy}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mode-specific Stats */}
        <Tabs value={selectedMode} onValueChange={setSelectedMode}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs flex-1">All</TabsTrigger>
            {Object.keys(modeStats).slice(0, 4).map(mode => {
              const config = MODE_CONFIG[mode] || { label: mode, icon: BookOpen, color: "text-primary" };
              return (
                <TabsTrigger key={mode} value={mode} className="text-xs flex-1">
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <TabsContent value="all" className="mt-3">
            <div className="space-y-2">
              {Object.entries(modeStats).map(([mode, modeData]) => {
                const config = MODE_CONFIG[mode] || { label: mode, icon: BookOpen, color: "text-primary" };
                const Icon = config.icon;
                return (
                  <div key={mode} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{config.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {modeData.sessions} sessions
                        </Badge>
                      </div>
                      <Progress value={modeData.accuracy} className="h-1.5" />
                    </div>
                    <span className="text-sm font-bold">{Math.round(modeData.accuracy)}%</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          {Object.entries(modeStats).map(([mode, modeData]) => {
            const config = MODE_CONFIG[mode] || { label: mode, icon: BookOpen, color: "text-primary" };
            const Icon = config.icon;
            return (
              <TabsContent key={mode} value={mode} className="mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${config.color}`} />
                    <p className="text-xl font-bold">{modeData.sessions}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{Math.round(modeData.accuracy)}%</p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{modeData.totalQuestions}</p>
                    <p className="text-xs text-muted-foreground">Questions</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">
                      {modeData.avgDuration > 0 
                        ? `${Math.round(modeData.avgDuration / 60)}m` 
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
