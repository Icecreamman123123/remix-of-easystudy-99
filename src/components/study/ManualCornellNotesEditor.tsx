import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, X, Copy } from "lucide-react";
import { CornellNoteItem, CornellNotesData } from "@/lib/study-api";

interface ManualCornellNotesEditorProps {
    onSubmit: (action: "create-cornell-notes", result: string, topic: string) => void;
    onCancel: () => void;
}

function createEmptyIdea(): CornellNoteItem {
    return {
        cue: "",
        note: "",
    };
}

export function ManualCornellNotesEditor({ onSubmit, onCancel }: ManualCornellNotesEditorProps) {
    const [topic, setTopic] = useState("");
    const [mainIdeas, setMainIdeas] = useState<CornellNoteItem[]>([createEmptyIdea()]);
    const [summary, setSummary] = useState("");

    const addIdea = () => {
        setMainIdeas((prev) => [...prev, createEmptyIdea()]);
    };

    const removeIdea = (index: number) => {
        if (mainIdeas.length <= 1) return;
        setMainIdeas((prev) => prev.filter((_, i) => i !== index));
    };

    const updateIdea = (index: number, field: keyof CornellNoteItem, value: string) => {
        setMainIdeas((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const duplicateIdea = (index: number) => {
        const idea = mainIdeas[index];
        const newIdea = { ...idea };
        const updated = [...mainIdeas];
        updated.splice(index + 1, 0, newIdea);
        setMainIdeas(updated);
    };

    const isValid = topic.trim() && mainIdeas.some(i => i.cue.trim() && i.note.trim()) && summary.trim();

    const handleSubmit = () => {
        if (!isValid) return;

        const data: CornellNotesData = {
            topic: topic.trim(),
            mainIdeas: mainIdeas.filter(i => i.cue.trim() || i.note.trim()),
            summary: summary.trim(),
        };

        const result = JSON.stringify(data);
        onSubmit("create-cornell-notes", result, topic.trim());
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Create Cornell Notes</CardTitle>
                        <CardDescription>
                            Structure your notes with cues, detailed notes, and a summary
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="cn-topic">Topic</Label>
                    <Input
                        id="cn-topic"
                        placeholder="e.g., The French Revolution"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <ScrollArea className="max-h-[400px] pr-2">
                    <div className="space-y-4">
                        {mainIdeas.map((idea, index) => (
                            <div
                                key={index}
                                className="p-3 border rounded-lg space-y-3 bg-muted/30"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{index + 1}</Badge>
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Main Idea / Cue</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => duplicateIdea(index)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:text-destructive"
                                            onClick={() => removeIdea(index)}
                                            disabled={mainIdeas.length <= 1}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <Input
                                    placeholder="Cue or Question"
                                    value={idea.cue}
                                    onChange={(e) => updateIdea(index, "cue", e.target.value)}
                                />
                                <Textarea
                                    placeholder="Notes and Details"
                                    value={idea.note}
                                    onChange={(e) => updateIdea(index, "note", e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <Button variant="outline" onClick={addIdea} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Main Idea
                </Button>

                <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="cn-summary">Summary</Label>
                    <Textarea
                        id="cn-summary"
                        placeholder="Summarize the main points of your notes..."
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                        {mainIdeas.length} idea{mainIdeas.length !== 1 ? "s" : ""}
                    </p>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="gap-2"
                    >
                        <Play className="h-4 w-4" />
                        Create Notes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
