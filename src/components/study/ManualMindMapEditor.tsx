import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, X, Copy, Network } from "lucide-react";
import { Concept } from "@/lib/study-api";

interface ManualMindMapEditorProps {
    onSubmit: (action: "mind-map", result: string, topic: string) => void;
    onCancel: () => void;
}

function createEmptyConcept(): Concept {
    return {
        concept: "",
        definition: "",
        example: "",
    };
}

export function ManualMindMapEditor({ onSubmit, onCancel }: ManualMindMapEditorProps) {
    const [topic, setTopic] = useState("");
    const [concepts, setConcepts] = useState<Concept[]>([createEmptyConcept(), createEmptyConcept()]);

    const addConcept = () => {
        setConcepts((prev) => [...prev, createEmptyConcept()]);
    };

    const removeConcept = (index: number) => {
        if (concepts.length <= 2) return;
        setConcepts((prev) => prev.filter((_, i) => i !== index));
    };

    const updateConcept = (index: number, field: keyof Concept, value: string) => {
        setConcepts((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const duplicateConcept = (index: number) => {
        const item = concepts[index];
        const newItem = { ...item };
        const updated = [...concepts];
        updated.splice(index + 1, 0, newItem);
        setConcepts(updated);
    };

    const isValid = topic.trim() && concepts.filter(c => c.concept.trim() && c.definition.trim()).length >= 2;

    const handleSubmit = () => {
        if (!isValid) return;

        const exportData = concepts.filter(c => c.concept.trim() && c.definition.trim());
        const result = JSON.stringify(exportData);
        onSubmit("mind-map", result, topic.trim());
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Create Mind Map</CardTitle>
                        <CardDescription>
                            Build a network of concepts and definitions
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="mm-topic">Map Title / Center Note</Label>
                    <Input
                        id="mm-topic"
                        placeholder="e.g., Photosynthesis Overview"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <ScrollArea className="max-h-[400px] pr-2">
                    <div className="space-y-3">
                        {concepts.map((item, index) => (
                            <div
                                key={index}
                                className="p-3 border rounded-lg space-y-2 bg-muted/30"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {index + 1}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => duplicateConcept(index)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:text-destructive"
                                            onClick={() => removeConcept(index)}
                                            disabled={concepts.length <= 2}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <Input
                                    placeholder="Concept / Term"
                                    value={item.concept}
                                    onChange={(e) => updateConcept(index, "concept", e.target.value)}
                                />
                                <Textarea
                                    placeholder="Definition or Details"
                                    value={item.definition}
                                    onChange={(e) => updateConcept(index, "definition", e.target.value)}
                                    className="min-h-[60px]"
                                />
                                <Input
                                    placeholder="Example/Tip (optional)"
                                    value={item.example}
                                    onChange={(e) => updateConcept(index, "example", e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <Button variant="outline" onClick={addConcept} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Concept
                </Button>

                <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                        {concepts.length} concept{concepts.length !== 1 ? "s" : ""} (min 2)
                    </p>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="gap-2"
                    >
                        <Network className="h-4 w-4" />
                        Generate Mind Map
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
