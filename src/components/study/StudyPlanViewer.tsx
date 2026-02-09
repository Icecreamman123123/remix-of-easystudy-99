import { StudyPlanItem } from "@/lib/study-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, BarChart2, Play, CheckCircle2, Save, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface StudyPlanViewerProps {
    plan: StudyPlanItem[];
    onStartSession?: (topic: string, day: number) => void;
    onSavePlan?: () => void;
    className?: string;
}

export function StudyPlanViewer({ plan, onStartSession, onSavePlan, className }: StudyPlanViewerProps) {
    const maxDifficulty = 10;

    // Prepare data for Pie Chart
    const topicData = plan.reduce((acc, session) => {
        const existing = acc.find(item => item.name === session.topic);
        if (existing) {
            existing.value += session.timeMinutes;
        } else {
            acc.push({ name: session.topic, value: session.timeMinutes });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    const difficultyData = plan.reduce((acc, session) => {
        const level = session.difficulty <= 3 ? "Easy" : session.difficulty <= 7 ? "Medium" : "Hard";
        const existing = acc.find(item => item.name === level);
        if (existing) {
            existing.value += session.timeMinutes;
        } else {
            acc.push({ name: level, value: session.timeMinutes });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    // Use topic data if we have more than 1 topic, otherwise use difficulty
    const chartData = topicData.length > 1 ? topicData : difficultyData;
    const chartTitle = topicData.length > 1 ? "Time by Topic" : "Time by Difficulty";
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className={cn("space-y-6", className)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Difficulty Graph */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-primary" />
                            Difficulty Curve
                        </CardTitle>
                        <CardDescription>Intensity tracking over your study period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 flex items-end gap-2 w-full pt-4">
                            {plan.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                        Diff: {day.difficulty}/10
                                    </div>
                                    <div
                                        className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm relative overflow-hidden"
                                        style={{ height: `${(day.difficulty / maxDifficulty) * 100}%` }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/50 h-full w-full opacity-50" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Day {day.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Pie Chart */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            {chartTitle}
                        </CardTitle>
                        <CardDescription>Breakdown of your study focus</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${value} mins`, 'Duration']}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {plan.map((day, i) => (
                    <Card key={i} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Day {day.day}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {day.timeMinutes} min</span>
                                        <span>•</span>
                                        <Badge variant={day.difficulty > 7 ? "destructive" : day.difficulty > 4 ? "default" : "secondary"} className="text-[10px] h-5">
                                            Difficulty: {day.difficulty}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl font-bold">{day.topic}</h3>
                                    <p className="text-muted-foreground text-sm">{day.description}</p>
                                </div>
                                <Button
                                    className="shrink-0"
                                    onClick={() => onStartSession?.(day.topic, day.day)}
                                >
                                    <Play className="h-4 w-4 mr-2" /> Start Session
                                </Button>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Planned Activities
                                </h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {day.activities.map((activity, j) => (
                                        <li key={j} className="text-sm flex items-start gap-2 bg-muted/50 p-2 rounded-md">
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                            {activity}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            {onSavePlan && (
                <div className="sticky bottom-4 flex justify-end">
                    <Button size="lg" className="shadow-lg" onClick={onSavePlan}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Plan to Templates
                    </Button>
                </div>
            )}
        </div>
    );
}
