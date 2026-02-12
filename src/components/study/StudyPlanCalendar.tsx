import { useState, useMemo } from "react";
import { StudyPlanItem } from "@/lib/study-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileDown, ExternalLink, Play, Clock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface StudyPlanCalendarProps {
  plan: StudyPlanItem[];
  onStartSession?: (topic: string, day: number) => void;
  onSavePlan?: () => void;
  topic?: string;
}

export function StudyPlanCalendar({ plan, onStartSession, onSavePlan, topic }: StudyPlanCalendarProps) {
  const { toast } = useToast();
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<StudyPlanItem | null>(null);

  // Map plan days to actual dates starting from today
  const planDates = useMemo(() => {
    return plan.map((item, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return { ...item, date };
    });
  }, [plan]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" });

  const getPlanForDate = (day: number) => {
    return planDates.find(p => 
      p.date.getDate() === day && 
      p.date.getMonth() === viewMonth && 
      p.date.getFullYear() === viewYear
    );
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`Study Plan: ${topic || "My Plan"}`, pw / 2, y, { align: "center" });
    y += 15;

    planDates.forEach((item) => {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Day ${item.day} — ${item.date.toLocaleDateString()} — ${item.topic}`, margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const desc = doc.splitTextToSize(item.description, pw - margin * 2);
      doc.text(desc, margin, y);
      y += desc.length * 5 + 3;
      item.activities.forEach(a => {
        const lines = doc.splitTextToSize(`• ${a}`, pw - margin * 2 - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 5;
      });
      y += 8;
    });

    doc.save(`study-plan-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exported", description: "Study plan saved as PDF." });
  };

  const exportGoogleCalendar = () => {
    // Create ICS content for Google Calendar import
    const events = planDates.map(item => {
      const start = new Date(item.date);
      start.setHours(9, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + item.timeMinutes);

      const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

      return `BEGIN:VEVENT
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:Study: ${item.topic}
DESCRIPTION:${item.description}\\n\\nActivities:\\n${item.activities.map(a => `- ${a}`).join("\\n")}
END:VEVENT`;
    });

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EasyStudy//Study Plan//EN
${events.join("\n")}
END:VCALENDAR`;

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-plan-${new Date().toISOString().split("T")[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Calendar exported", description: "Import the .ics file into Google Calendar or any calendar app." });
  };

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <h3 className="text-lg font-semibold min-w-[180px] text-center">{monthName}</h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPdf}>
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportGoogleCalendar}>
            <ExternalLink className="h-4 w-4 mr-1" /> Calendar
          </Button>
          {onSavePlan && (
            <Button size="sm" onClick={onSavePlan}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[80px] border-b border-r bg-muted/20" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const planItem = getPlanForDate(day);
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

            return (
              <div
                key={day}
                className={cn(
                  "p-1.5 min-h-[80px] border-b border-r cursor-pointer transition-colors hover:bg-accent/30",
                  isToday && "bg-primary/5",
                  planItem && "bg-primary/10"
                )}
                onClick={() => planItem && setSelectedDay(planItem)}
              >
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isToday && "text-primary font-bold"
                )}>
                  {day}
                </div>
                {planItem && (
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-medium text-primary truncate">{planItem.topic}</div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{planItem.timeMinutes}m</span>
                    </div>
                    <Badge 
                      variant={planItem.difficulty > 7 ? "destructive" : planItem.difficulty > 4 ? "default" : "secondary"} 
                      className="text-[8px] h-3.5 px-1"
                    >
                      D:{planItem.difficulty}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Day {selectedDay.day}: {selectedDay.topic}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedDay.timeMinutes} min</span>
                  <Badge variant={selectedDay.difficulty > 7 ? "destructive" : selectedDay.difficulty > 4 ? "default" : "secondary"}>
                    Difficulty: {selectedDay.difficulty}/10
                  </Badge>
                </div>
                <p className="text-sm">{selectedDay.description}</p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Activities</h4>
                  <ul className="space-y-1.5">
                    {selectedDay.activities.map((a, i) => (
                      <li key={i} className="text-sm flex items-start gap-2 bg-muted/50 p-2 rounded-md">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                {onStartSession && (
                  <Button className="w-full" onClick={() => { onStartSession(selectedDay.topic, selectedDay.day); setSelectedDay(null); }}>
                    <Play className="h-4 w-4 mr-2" /> Start Session
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
