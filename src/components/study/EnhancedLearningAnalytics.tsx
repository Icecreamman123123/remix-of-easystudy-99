import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  Award,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  dailyAccuracy: Array<{ day: string; accuracy: number }>;
  studyMethods: Array<{ name: string; sessions: number }>;
  weeklyProgress: Array<{ week: string; points: number }>;
}

const MOCK_DATA: AnalyticsData = {
  dailyAccuracy: [
    { day: "Mon", accuracy: 75 },
    { day: "Tue", accuracy: 82 },
    { day: "Wed", accuracy: 78 },
    { day: "Thu", accuracy: 85 },
    { day: "Fri", accuracy: 88 },
    { day: "Sat", accuracy: 80 },
    { day: "Sun", accuracy: 92 },
  ],
  studyMethods: [
    { name: "Flashcards", sessions: 15 },
    { name: "Quizzes", sessions: 12 },
    { name: "Mind Maps", sessions: 8 },
    { name: "Practice Tests", sessions: 6 },
  ],
  weeklyProgress: [
    { week: "Week 1", points: 250 },
    { week: "Week 2", points: 380 },
    { week: "Week 3", points: 420 },
    { week: "Week 4", points: 510 },
  ],
};

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

export function EnhancedLearningAnalytics() {
  const avgAccuracy =
    MOCK_DATA.dailyAccuracy.reduce((sum, d) => sum + d.accuracy, 0) /
    MOCK_DATA.dailyAccuracy.length;

  const totalSessions = MOCK_DATA.studyMethods.reduce(
    (sum, m) => sum + m.sessions,
    0
  );

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="methods">Methods</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Accuracy</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">
                    {Math.round(avgAccuracy)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-500 mt-1">
                    {totalSessions}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Accuracy Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Accuracy (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={MOCK_DATA.dailyAccuracy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="methods" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Study Methods Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={MOCK_DATA.studyMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, sessions }) => `${name} (${sessions})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {MOCK_DATA.studyMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-sm">Method Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_DATA.studyMethods.map((method, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{method.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {method.sessions} sessions
                  </span>
                </div>
                <Progress
                  value={(method.sessions / totalSessions) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="trends" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Weekly Points Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={MOCK_DATA.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="points" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <p className="text-sm text-muted-foreground">
                Your accuracy is improving! Keep up the consistent studying.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <p className="text-sm text-muted-foreground">
                Flashcards are your most-used method. Try mixing in other techniques for variety.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <p className="text-sm text-muted-foreground">
                You're on track to reach your weekly goal! 2 more sessions needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
