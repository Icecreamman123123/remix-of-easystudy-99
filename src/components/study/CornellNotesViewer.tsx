import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CornellNotesData, CornellNoteItem } from "@/lib/study-api";
import { Eye, EyeOff, Printer, Download, Save, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CornellNotesViewerProps {
    data: CornellNotesData;
    onSave?: (data: CornellNotesData) => void;
}

export function CornellNotesViewer({ data: initialData, onSave }: CornellNotesViewerProps) {
    const [data, setData] = useState<CornellNotesData>(initialData);
    const [quizMode, setQuizMode] = useState(false);
    const [editing, setEditing] = useState(false);

    // Function to update a specific item
    const updateItem = (index: number, field: keyof CornellNoteItem, value: string) => {
        const newItems = [...data.mainIdeas];
        newItems[index] = { ...newItems[index], [field]: value };
        setData({ ...data, mainIdeas: newItems });
    };

    // Function to add a new item
    const addItem = () => {
        setData({
            ...data,
            mainIdeas: [...data.mainIdeas, { cue: "New Cue", note: "New Note" }]
        });
    };

    // Function to remove an item
    const removeItem = (index: number) => {
        const newItems = [...data.mainIdeas];
        newItems.splice(index, 1);
        setData({ ...data, mainIdeas: newItems });
    };

    const handlePrint = () => {
        setQuizMode(false);
        setTimeout(() => window.print(), 100);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto print:max-w-none print:p-0">
            {/* Controls Header - Hidden when printing */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Button
                        variant={quizMode ? "default" : "outline"}
                        onClick={() => setQuizMode(!quizMode)}
                        className="gap-2"
                    >
                        {quizMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {quizMode ? "Exit Quiz Mode" : "Quiz Mode"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(!editing)}>
                        {editing ? "View Mode" : "Edit Mode"}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print / PDF
                    </Button>
                    {onSave && (
                        <Button onClick={() => onSave(data)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    )}
                </div>
            </div>

            {/* Cornell Notes Paper */}
            <div className="bg-background border-2 border-primary/20 shadow-lg min-h-[800px] flex flex-col relative print:shadow-none print:border-none">

                {/* Header Section */}
                <div className="border-b-2 border-primary/20 p-6 flex justify-between items-start bg-muted/10 print:bg-transparent">
                    <div className="space-y-1">
                        <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Topic</Label>
                        {editing ? (
                            <Input
                                value={data.topic}
                                onChange={(e) => setData({ ...data, topic: e.target.value })}
                                className="font-bold text-2xl h-auto py-1 px-2 border-dashed"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-primary">{data.topic}</h1>
                        )}
                    </div>
                    <div className="text-right space-y-1 print:hidden">
                        <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</div>
                        <div className="text-xs uppercase tracking-wider font-semibold text-primary/60">Cornell System</div>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex flex-col md:flex-row print:flex-row relative">
                    {/* Cues Column (Left) */}
                    <div className="w-full md:w-[30%] print:w-[30%] border-b md:border-b-0 md:border-r-2 border-primary/20 p-6 bg-muted/5 print:bg-transparent">
                        <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4 block">
                            Cues / Questions
                        </Label>
                        <div className="space-y-8">
                            {data.mainIdeas.map((item, i) => (
                                <div key={i} className="min-h-[100px]">
                                    {editing ? (
                                        <Textarea
                                            value={item.cue}
                                            onChange={(e) => updateItem(i, 'cue', e.target.value)}
                                            className="font-semibold text-lg resize-none border-dashed bg-background"
                                            rows={3}
                                        />
                                    ) : (
                                        <div className="font-semibold text-lg text-foreground/90">{item.cue}</div>
                                    )}
                                </div>
                            ))}
                            {editing && (
                                <Button variant="ghost" size="sm" onClick={addItem} className="w-full border-dashed border">
                                    <Plus className="h-4 w-4 mr-2" /> Add Cue
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Notes Column (Right) */}
                    <div className="w-full md:w-[70%] print:w-[70%] p-6 relative">
                        <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4 block">
                            Notes / Details
                        </Label>

                        <div className="space-y-8">
                            {data.mainIdeas.map((item, i) => (
                                <div key={i} className="relative min-h-[100px] group">
                                    {editing && (
                                        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeItem(i)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className={`transition-all duration-300 ${quizMode ? "blur-md select-none grayscale opacity-30 cursor-pointer hover:blur-none hover:opacity-100" : ""}`}>
                                        {editing ? (
                                            <Textarea
                                                value={item.note}
                                                onChange={(e) => updateItem(i, 'note', e.target.value)}
                                                className="prose prose-sm max-w-none resize-none border-dashed bg-background"
                                                rows={6}
                                            />
                                        ) : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{item.note}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Footer */}
                <div className="border-t-2 border-primary/20 p-6 bg-muted/10 print:bg-transparent min-h-[150px]">
                    <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-2 block">
                        Summary
                    </Label>
                    {editing ? (
                        <Textarea
                            value={data.summary}
                            onChange={(e) => setData({ ...data, summary: e.target.value })}
                            className="w-full bg-background border-dashed"
                            rows={4}
                        />
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none italic text-muted-foreground">
                            {quizMode ? (
                                <div className="blur-sm select-none">
                                    {data.summary}
                                </div>
                            ) : (
                                <ReactMarkdown>{data.summary}</ReactMarkdown>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-xs text-muted-foreground print:hidden">
                <p>Cornell Notes System: Use the "Cues" to quiz yourself. Cover the "Notes" section (or use Quiz Mode) and try to recall the details.</p>
            </div>
        </div>
    );
}
