import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Trophy,
  Star,
  Flame,
  Award,
  TrendingUp,
  Target,
  Crown,
} from "lucide-react";

interface UserStats {
  points: number;
  level: number;
  nextLevelPoints: number;
  totalSessions: number;
  accuracy: number;
  streak: number;
}

export function GamificationHub() {
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    level: 1,
    nextLevelPoints: 100,
    totalSessions: 0,
    accuracy: 0,
    streak: 0,
  });

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem("userGameStats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const levelProgress = (stats.points / stats.nextLevelPoints) * 100;
  const pointsToNextLevel = stats.nextLevelPoints - stats.points;

  const getLevelBadge = (level: number) => {
    if (level >= 10) return "👑";
    if (level >= 7) return "⭐";
    if (level >= 5) return "🏆";
    if (level >= 3) return "🎯";
    return "🌟";
  };

  return (
    <Tabs defaultValue="progress" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>

      <TabsContent value="progress" className="space-y-4">
        {/* Level Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Level {stats.level}
              </CardTitle>
              <span className="text-2xl">{getLevelBadge(stats.level)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress to Level {stats.level + 1}</span>
                <span className="text-xs text-muted-foreground">
                  {stats.points} / {stats.nextLevelPoints}
                </span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {pointsToNextLevel} points to next level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold text-primary mt-1">{stats.points}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                  <p className="text-2xl font-bold text-blue-500 mt-1">{stats.totalSessions}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">{Math.round(stats.accuracy)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold text-orange-500 mt-1">{stats.streak}</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: "🎯", label: "First Steps" },
                { icon: "⚡", label: "Quick Learner" },
                { icon: "🏆", label: "Study Master" },
              ].map((achievement, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  <span>{achievement.icon}</span>
                  {achievement.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="leaderboard" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Top Performers (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rank: 1, name: "You", points: stats.points, badge: "👑" },
                { rank: 2, name: "Study Master", points: stats.points - 50, badge: "⭐" },
                { rank: 3, name: "Quick Learner", points: stats.points - 100, badge: "🏆" },
              ].map((user) => (
                <div
                  key={user.rank}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary w-6">{user.rank}</span>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.badge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{user.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-500" />
              Leaderboard Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Earn points by completing study sessions, maintaining streaks, and achieving high accuracy. 
              Compete with other learners and climb the leaderboard!
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
