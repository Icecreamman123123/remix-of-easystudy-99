import { useStreakAndAchievements } from "@/hooks/useStreakAndAchievements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Award, Trophy } from "lucide-react";

interface StreakDisplay {
  compact?: boolean;
  showMilestones?: boolean;
}

export function StreakDisplay({ compact = false, showMilestones = true }: StreakDisplay) {
  const { streakLoading, streakData, achievements } = useStreakAndAchievements();

  if (streakLoading || !streakData) {
    return (
      <Card className="p-4">
        <div className="text-center text-sm text-muted-foreground">Loading streak data...</div>
      </Card>
    );
  }

  const { currentStreak, longestStreak, studiedToday, daysUntilReset } = streakData;

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Flame
            className={`h-5 w-5 ${
              currentStreak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"
            }`}
          />
          <span className="font-bold text-lg">{currentStreak}</span>
        </div>
        {studiedToday && <Badge variant="default">Studied Today ✓</Badge>}
        {daysUntilReset && daysUntilReset <= 1 && currentStreak > 0 && (
          <Badge variant="destructive">Streak expires soon!</Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Daily Streak</h3>
            <div className="flex items-center gap-2 mt-2">
              <Flame className={`h-8 w-8 ${currentStreak > 0 ? "text-orange-500" : ""} fill-orange-500`} />
              <div>
                <p className="text-3xl font-bold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-2xl font-bold mt-1">{longestStreak}</p>
          </div>
        </div>

        {studiedToday && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            ✓ You studied today!
          </Badge>
        )}

        {currentStreak > 0 && !studiedToday && daysUntilReset && (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 p-2 rounded text-sm">
            Study today to keep your streak! Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}.
          </div>
        )}

        {showMilestones && (
          <StreakMilestones currentStreak={currentStreak} />
        )}
      </div>
    </Card>
  );
}

function StreakMilestones({ currentStreak }: { currentStreak: number }) {
  const milestones = [
    { days: 7, label: "Week Warrior", emoji: "🎯" },
    { days: 14, label: "Two Weeks", emoji: "⚡" },
    { days: 30, label: "Month Master", emoji: "⭐" },
    { days: 100, label: "Century Champion", emoji: "👑" },
  ];

  const nextMilestone = milestones.find((m) => m.days > currentStreak);
  const recentlyUnlocked = milestones.filter((m) => m.days <= currentStreak);

  return (
    <div className="space-y-3 border-t pt-4">
      {recentlyUnlocked.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Milestones Unlocked</p>
          <div className="flex flex-wrap gap-2">
            {recentlyUnlocked.map((m) => (
              <Badge key={m.days} variant="secondary">
                {m.emoji} {m.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {nextMilestone && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Next Goal: {nextMilestone.label}
          </p>
          <div className="flex items-center gap-2">
            <Progress value={(currentStreak / nextMilestone.days) * 100} className="flex-1" />
            <span className="text-sm font-medium">
              {nextMilestone.days - currentStreak} days away
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AchievementsDisplay() {
  const { achievementLoading, achievements } = useStreakAndAchievements();

  if (achievementLoading || !achievements) {
    return (
      <Card className="p-4">
        <div className="text-center text-sm text-muted-foreground">Loading achievements...</div>
      </Card>
    );
  }

  const { earned, progress, nextMilestones } = achievements;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Achievements</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress.completedCount} / {progress.totalCount} achieved
                </span>
              </div>
              <Progress value={progress.percentComplete} className="h-2" />
            </div>
          </div>
        </div>

        {nextMilestones.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Next Milestones</p>
            <div className="grid grid-cols-1 gap-3">
              {nextMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{milestone.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{milestone.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {earned.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Earned Achievements ({earned.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {earned.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900"
                  title={achievement.achievement?.description}
                >
                  <span className="text-2xl">{achievement.achievement?.icon}</span>
                  <p className="text-xs text-center mt-1 font-medium leading-tight">
                    {achievement.achievement?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
