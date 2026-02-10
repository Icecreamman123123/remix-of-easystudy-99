import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudySessions } from "@/hooks/useStudySessions-simple";
import { TrendingUp, Target, Flame, BookOpen, Loader2 } from "lucide-react";

export function StudyStats() {
  const { stats, loading } = useStudySessions();

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
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Complete a study session to see your stats!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{stats.streakDays}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{Math.round(stats.averageAccuracy)}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.totalCardsStudied}</p>
            <p className="text-xs text-muted-foreground">Cards Studied</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
