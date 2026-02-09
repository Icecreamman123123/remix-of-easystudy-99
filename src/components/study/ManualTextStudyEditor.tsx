import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Play, FileText } from "lucide-react";
import { StudyAction } from "@/lib/study-api";

interface ManualTextStudyEditorProps {
    action: StudyAction;
    label: string;
    onSubmit: (action: StudyAction, result: string, topic: string) => void;
    onCancel: () => void;
}

export function ManualTextStudyEditor({ action, label, onSubmit, onCancel }: ManualTextStudyEditorProps) {
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("");

    const isValid = topic.trim() && content.trim();

    const handleSubmit = () => {
        if (!isValid) return;
        onSubmit(action, content, topic.trim());
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Create {label}</CardTitle>
                        <CardDescription>
                            Write your own {label.toLowerCase()} manually
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="ts-topic">Topic</Label>
                    <Input
                        id="ts-topic"
                        placeholder="e.g., Quantum Mechanics"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="ts-content">Content (Markdown supported)</Label>
                    <Textarea
                        id="ts-content"
                        placeholder={`Enter your ${label.toLowerCase()} here...`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                    />
                </div>

                <div className="flex items-center justify-end pt-2 border-t">
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="gap-2"
                    >
                        <Play className="h-4 w-4" />
                        View {label}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
