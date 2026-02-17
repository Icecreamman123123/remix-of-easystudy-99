import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, GraduationCap } from "lucide-react";
import { StudyTemplate, generateTemplateDeck } from "@/lib/study-templates";
import { ResultsViewer } from "./ResultsViewer";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface TemplateUseDialogProps {
    template: StudyTemplate | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const GRADE_LEVELS = [
    { value: "1", label: "Grade 1" },
    { value: "2", label: "Grade 2" },
    { value: "3", label: "Grade 3" },
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" },
    { value: "10", label: "Grade 10" },
    { value: "11", label: "Grade 11" },
    { value: "12", label: "Grade 12" },
    { value: "university", label: "University" },
    { value: "phd", label: "PhD Level" },
];

export function TemplateUseDialog({ template, open, onOpenChange }: TemplateUseDialogProps) {
    const [topic, setTopic] = useState("");
    const [gradeLevel, setGradeLevel] = useState("8");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const { toast } = useToast();
    const { language, t } = useI18n();

    const handleGenerate = async () => {
        if (!template || !topic.trim()) return;

        setLoading(true);
        try {
            const { rawResult, flashcards } = await generateTemplateDeck(
                template.id,
                topic,
                gradeLevel,
                language
            );

            // If we got flashcards but no rawResult, stringify them so ResultsViewer can parse them back
            // (This happens if we fallback to the hardcoded cards in generateTemplateDeck)
            const finalResult = rawResult || JSON.stringify(flashcards);

            if (!finalResult || finalResult === "[]") {
                throw new Error("Failed to generate content. Please try again.");
            }

            setResult(finalResult);
            toast({
                title: "Success!",
                description: `Generated ${template.name} for ${topic}.`,
            });
        } catch (error) {
            console.error("Generation error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate content.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after a small delay to avoid flicker during closing animation
        setTimeout(() => {
            setResult(null);
            setTopic("");
            setLoading(false);
        }, 300);
    };

    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={result ? "sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" : "sm:max-w-md"}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {result ? <Sparkles className="h-5 w-5 text-primary" /> : <GraduationCap className="h-5 w-5 text-primary" />}
                        {result ? t("template.ready") : `${t("template.use")} ${template.name}`}
                    </DialogTitle>
                    {!result && (
                        <DialogDescription>
                            {template.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {result ? (
                    <div className="flex-1 overflow-hidden py-2">
                        <ResultsViewer
                            action={template.action as any}
                            result={result}
                            topic={topic}
                            gradeLevel={gradeLevel}
                            onClose={handleClose}
                        />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-topic">{t("template.topic")}</Label>
                            <Input
                                id="template-topic"
                                placeholder="e.g., Photosynthesis, Civil War, Python functions..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-grade">{t("template.grade")}</Label>
                            <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={loading}>
                                <SelectTrigger id="template-grade">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRADE_LEVELS.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                {t("common.cancel")}
                            </Button>
                            <Button onClick={handleGenerate} disabled={!topic.trim() || loading} className="gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("template.generating")}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        {t("template.generate")}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
