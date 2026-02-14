import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  FileDown,
  Presentation,
  Grid3X3,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import ReactMarkdown from "react-markdown";

export interface Slide {
  title: string;
  bullets: string[];
  speakerNotes?: string;
  layout?: "title" | "content" | "two-column" | "section";
}

interface SlidePresenterProps {
  slides: Slide[];
  topic?: string;
}

const SLIDE_COLORS = [
  { bg: "from-slate-900 to-slate-800", accent: "bg-blue-500", text: "text-slate-50" },
  { bg: "from-slate-50 to-slate-100", accent: "bg-blue-600", text: "text-slate-900" },
  { bg: "from-slate-50 to-slate-100", accent: "bg-emerald-600", text: "text-slate-900" },
  { bg: "from-slate-50 to-slate-100", accent: "bg-violet-600", text: "text-slate-900" },
  { bg: "from-slate-50 to-slate-100", accent: "bg-amber-600", text: "text-slate-900" },
  { bg: "from-slate-50 to-slate-100", accent: "bg-rose-600", text: "text-slate-900" },
];

function getSlideTheme(index: number, total: number) {
  if (index === 0) return SLIDE_COLORS[0]; // Title slide is dark
  return SLIDE_COLORS[((index - 1) % (SLIDE_COLORS.length - 1)) + 1];
}

function SlideRenderer({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const theme = getSlideTheme(index, total);
  const isTitle = index === 0 || slide.layout === "title" || slide.layout === "section";

  return (
    <div className={`w-full aspect-video rounded-xl bg-gradient-to-br ${theme.bg} ${theme.text} relative overflow-hidden shadow-2xl`}>
      {/* Decorative elements */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.accent}`} />
      <div className="absolute bottom-4 right-6 text-xs opacity-40 font-mono">
        {index + 1} / {total}
      </div>

      {isTitle ? (
        <div className="flex flex-col items-center justify-center h-full px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
            {slide.title}
          </h1>
          {slide.bullets.length > 0 && (
            <p className="text-lg opacity-70 max-w-2xl">{slide.bullets[0]}</p>
          )}
          {slide.bullets.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {slide.bullets.slice(1).map((b, i) => (
                <Badge key={i} variant="secondary" className="text-sm px-3 py-1 opacity-80">
                  {b}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full px-10 py-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">{slide.title}</h2>
          <div className="flex-1 flex flex-col justify-center">
            <ul className="space-y-3">
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg leading-relaxed">
                  <span className={`mt-1.5 w-2 h-2 rounded-full ${theme.accent} shrink-0`} />
                  <span className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span>{children}</span>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        code: ({ children }) => (
                          <code className="bg-black/20 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                        ),
                      }}
                    >
                      {bullet}
                    </ReactMarkdown>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function parseSlides(response: string): Slide[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.filter((s: any) =>
        typeof s.title === "string" && Array.isArray(s.bullets)
      ).map((s: any) => ({
        title: s.title,
        bullets: s.bullets.map(String),
        speakerNotes: s.speakerNotes || s.speaker_notes || "",
        layout: s.layout || "content",
      }));
    }
    return [];
  } catch (e) {
    console.error("parseSlides failed:", e);
    return [];
  }
}

function exportSlidesToPdf(slides: Slide[], topic?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  slides.forEach((slide, i) => {
    if (i > 0) doc.addPage();

    // Background
    if (i === 0) {
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, w, h, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, w, h, "F");
      doc.setTextColor(30, 41, 59);
    }

    // Accent bar
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, w, 4, "F");

    // Title
    doc.setFontSize(i === 0 ? 28 : 22);
    doc.setFont("helvetica", "bold");
    const titleX = i === 0 ? w / 2 : 25;
    const titleAlign = i === 0 ? "center" : "left";
    doc.text(slide.title, titleX, i === 0 ? h / 2 - 20 : 25, { align: titleAlign as any });

    // Bullets
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    let y = i === 0 ? h / 2 + 10 : 42;
    slide.bullets.forEach((bullet) => {
      if (y > h - 20) return;
      const lines = doc.splitTextToSize(`• ${bullet}`, w - 60);
      doc.text(lines, 30, y);
      y += lines.length * 7 + 4;
    });

    // Slide number
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i + 1} / ${slides.length}`, w - 20, h - 10);
  });

  doc.save(`${(topic || "Presentation").replace(/[^a-zA-Z0-9 ]/g, "")}.pdf`);
}

function exportSlidesToPptxText(slides: Slide[], topic?: string) {
  // Export as a structured text file that can be imported into presentation tools
  let text = `# ${topic || "Presentation"}\n\n`;
  slides.forEach((slide, i) => {
    text += `---\n## Slide ${i + 1}: ${slide.title}\n\n`;
    slide.bullets.forEach((b) => {
      text += `- ${b}\n`;
    });
    if (slide.speakerNotes) {
      text += `\n> Speaker Notes: ${slide.speakerNotes}\n`;
    }
    text += "\n";
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${(topic || "Presentation").replace(/[^a-zA-Z0-9 ]/g, "")}_slides.md`);
}

export function SlidePresenter({ slides, topic }: SlidePresenterProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "Escape") {
        setIsFullscreen(false);
        setShowGrid(false);
      }
      if (e.key === "g" || e.key === "G") {
        setShowGrid((v) => !v);
      }
      if (e.key === "f" || e.key === "F") {
        setIsFullscreen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  if (slides.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No slides generated</p>
      </div>
    );
  }

  // Grid view
  if (showGrid) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            <Grid3X3 className="h-3 w-3 mr-1" />
            {slides.length} Slides
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowGrid(false)}>
            Back to Presenter
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {slides.map((slide, i) => (
            <button
              key={i}
              className={`text-left rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                i === currentSlide ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
              onClick={() => {
                setCurrentSlide(i);
                setShowGrid(false);
              }}
            >
              <div className="scale-100">
                <SlideRenderer slide={slide} index={i} total={slides.length} />
              </div>
              <div className="p-2 bg-muted text-xs text-muted-foreground truncate">
                {i + 1}. {slide.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <SlideRenderer slide={slides[currentSlide]} index={currentSlide} total={slides.length} />
        </div>
        {showNotes && slides[currentSlide].speakerNotes && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-2xl bg-black/80 text-white/80 text-sm px-6 py-3 rounded-lg">
            {slides[currentSlide].speakerNotes}
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={goPrev} disabled={currentSlide === 0}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-white/60 text-sm font-mono">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={goNext} disabled={currentSlide === slides.length - 1}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => setShowNotes((v) => !v)}>
            Notes
          </Button>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => setIsFullscreen(false)}>
            <Minimize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Normal presenter view
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Presentation className="h-3 w-3 mr-1" />
            Presenter Slides
          </Badge>
          {topic && <Badge variant="secondary" className="text-xs">{topic}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowGrid(true)} title="Grid view (G)">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)} title="Present (F)">
            <Maximize className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportSlidesToPdf(slides, topic)}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSlidesToPptxText(slides, topic)}>
                Export as Markdown (PPTX-ready)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Current slide */}
      <SlideRenderer slide={slides[currentSlide]} index={currentSlide} total={slides.length} />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentSlide === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground font-mono">
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <Button variant="outline" size="sm" onClick={goNext} disabled={currentSlide === slides.length - 1}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Speaker notes */}
      {slides[currentSlide].speakerNotes && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Speaker Notes</p>
          <p className="text-sm">{slides[currentSlide].speakerNotes}</p>
        </div>
      )}

      {/* Thumbnail strip */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {slides.map((slide, i) => (
            <button
              key={i}
              className={`shrink-0 w-32 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                i === currentSlide ? "border-primary ring-1 ring-primary/30" : "border-border opacity-60"
              }`}
              onClick={() => setCurrentSlide(i)}
            >
              <div className="pointer-events-none transform scale-[0.15] origin-top-left w-[640px] h-[360px]">
                <SlideRenderer slide={slide} index={i} total={slides.length} />
              </div>
              <div className="relative -mt-[306px] h-[360px]" style={{ transform: "scale(0.15)", transformOrigin: "top left", width: 640, height: 360, position: "absolute", top: 0, left: 0, opacity: 0 }} />
            </button>
          ))}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground text-center">
        Use arrow keys to navigate • Press F for fullscreen • Press G for grid view
      </p>
    </div>
  );
}
