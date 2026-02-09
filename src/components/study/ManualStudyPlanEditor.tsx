import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, X, Copy, Calendar, Clock, BarChart2 } from "lucide-react";
import { StudyPlanItem } from "@/lib/study-api";

interface ManualStudyPlanEditorProps {
    onSubmit: (action: "create-study-plan", result: string, topic: string) => void;
    onCancel: () => void;
}

function createEmptyDay(dayNumber: number): StudyPlanItem {
    return {
        day: dayNumber,
        topic: "",
        activities: [""],
        difficulty: 5,
        timeMinutes: 30,
        description: "",
    };
}

export function ManualStudyPlanEditor({ onSubmit, onCancel }: ManualStudyPlanEditorProps) {
    const [sessionTopic, setSessionTopic] = useState("");
    const [days, setDays] = useState<StudyPlanItem[]>([createEmptyDay(1)]);

    const addDay = () => {
        setDays((prev) => [...prev, createEmptyDay(prev.length + 1)]);
    };

    const removeDay = (index: number) => {
        if (days.length <= 1) return;
        const updated = days.filter((_, i) => i !== index).map((day, i) => ({ ...day, day: i + 1 }));
        setDays(updated);
    };

    const updateDay = (index: number, field: keyof StudyPlanItem, value: any) => {
        setDays((prev) =>
            prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
        );
    };

    const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
        setDays((prev) =>
            prev.map((day, i) => {
                if (i !== dayIndex) return day;
                const newActivities = [...day.activities];
                newActivities[activityIndex] = value;
                return { ...day, activities: newActivities };
            })
        );
    };

    const addActivity = (dayIndex: number) => {
        setDays((prev) =>
            prev.map((day, i) => {
                if (i !== dayIndex) return day;
                return { ...day, activities: [...day.activities, ""] };
            })
        );
    };

    const removeActivity = (dayIndex: number, activityIndex: number) => {
        setDays((prev) =>
            prev.map((day, i) => {
                if (i !== dayIndex || day.activities.length <= 1) return day;
                return { ...day, activities: day.activities.filter((_, ai) => ai !== activityIndex) };
            })
        );
    };

    const duplicateDay = (index: number) => {
        const day = days[index];
        const newDay = { ...day };
        const updated = [...days];
        updated.splice(index + 1, 0, newDay);
        setDays(updated.map((d, i) => ({ ...d, day: i + 1 })));
    };

    const isValid = sessionTopic.trim() && days.every(d => d.topic.trim() && d.description.trim() && d.activities.some(a => a.trim()));

    const handleSubmit = () => {
        if (!isValid) return;

        const planData = days.map(d => ({
            ...d,
            activities: d.activities.filter(a => a.trim())
        }));

        const result = JSON.stringify(planData);
        onSubmit("create-study-plan", result, sessionTopic.trim());
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Create Study Plan</CardTitle>
                        <CardDescription>
                            Plan your study trajectory day by day
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="sp-topic">Main Topic / Goal</Label>
                    <Input
                        id="sp-topic"
                        placeholder="e.g., Master JavaScript in 7 Days"
                        value={sessionTopic}
                        onChange={(e) => setSessionTopic(e.target.value)}
                    />
                </div>

                <ScrollArea className="max-h-[500px] pr-2">
                    <div className="space-y-6">
                        {days.map((day, dIndex) => (
                            <div
                                key={dIndex}
                                className="p-4 border rounded-lg space-y-4 bg-muted/30 relative"
                            >
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="font-bold">Day {day.day}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => duplicateDay(dIndex)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:text-destructive"
                                            onClick={() => removeDay(dIndex)}
                                            disabled={days.length <= 1}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Daily Topic</Label>
                                        <Input
                                            placeholder="e.g., Fundamentals of JSX"
                                            value={day.topic}
                                            onChange={(e) => updateDay(dIndex, "topic", e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Min
                                            </Label>
                                            <Input
                                                type="number"
                                                min={5}
                                                max={480}
                                                value={day.timeMinutes}
                                                onChange={(e) => updateDay(dIndex, "timeMinutes", parseInt(e.target.value) || 30)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs flex items-center gap-1">
                                                <BarChart2 className="h-3 w-3" /> Diff (1-10)
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={day.difficulty}
                                                onChange={(e) => updateDay(dIndex, "difficulty", parseInt(e.target.value) || 5)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                        placeholder="Briefly describe what you'll achieve today"
                                        value={day.description}
                                        onChange={(e) => updateDay(dIndex, "description", e.target.value)}
                                        className="min-h-[60px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Activities</Label>
                                    <div className="space-y-2">
                                        {day.activities.map((activity, aIndex) => (
                                            <div key={aIndex} className="flex gap-2">
                                                <Input
                                                    placeholder={`Activity ${aIndex + 1}`}
                                                    value={activity}
                                                    onChange={(e) => updateActivity(dIndex, aIndex, e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 hover:text-destructive"
                                                    onClick={() => removeActivity(dIndex, aIndex)}
                                                    disabled={day.activities.length <= 1}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addActivity(dIndex)}
                                            className="h-7 text-xs w-full border-dashed border"
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Activity
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <Button variant="outline" onClick={addDay} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Day
                </Button>

                <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                        {days.length} day{days.length !== 1 ? "s" : ""} planned
                    </p>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="gap-2"
                    >
                        <Play className="h-4 w-4" />
                        Start Study Plan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
