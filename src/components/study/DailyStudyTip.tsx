import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { STUDY_TIPS } from "@/lib/study-tips";
import { Button } from "@/components/ui/button";

export function DailyStudyTip() {
    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        // Get a stable index based on the day of the year
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);

        setTipIndex(day % STUDY_TIPS.length);
    }, []);

    const nextTip = () => setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length);
    const prevTip = () => setTipIndex((prev) => (prev - 1 + STUDY_TIPS.length) % STUDY_TIPS.length);

    return (
        <Card className="glass-card overflow-hidden border-primary/20 shadow-lg group">
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <Lightbulb className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-sm tracking-tight uppercase">Daily Study Tip</h3>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevTip}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextTip}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <p className="text-sm leading-relaxed text-foreground/90 font-medium italic">
                        "{STUDY_TIPS[tipIndex]}"
                    </p>
                </div>

                <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                    <span>Tip #{tipIndex + 1}</span>
                    <span className="bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Boost your score</span>
                </div>
            </CardContent>
        </Card>
    );
}
