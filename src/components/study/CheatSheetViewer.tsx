import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, AlertTriangle, Lightbulb, Calculator, FileText, Star, List } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CheatSheetViewerProps {
  content: string;
  topic?: string;
}

interface Section {
  title: string;
  body: string;
}

const SECTION_COLORS = [
  "border-l-blue-400 bg-blue-50/40 dark:bg-blue-950/20",
  "border-l-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20",
  "border-l-violet-400 bg-violet-50/40 dark:bg-violet-950/20",
  "border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/20",
  "border-l-rose-400 bg-rose-50/40 dark:bg-rose-950/20",
  "border-l-cyan-400 bg-cyan-50/40 dark:bg-cyan-950/20",
  "border-l-pink-400 bg-pink-50/40 dark:bg-pink-950/20",
  "border-l-teal-400 bg-teal-50/40 dark:bg-teal-950/20",
];

const TITLE_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200",
];

function parseSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({
          title: currentTitle || "Overview",
          body: currentBody.join("\n").trim(),
        });
      }
      currentTitle = headingMatch[1].trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentTitle || currentBody.length > 0) {
    sections.push({
      title: currentTitle || "Overview",
      body: currentBody.join("\n").trim(),
    });
  }

  return sections.filter((s) => s.body.length > 0);
}

function SectionIcon({ index }: { index: number }) {
  const icons = [BookOpen, Star, Lightbulb, Calculator, FileText, List, AlertTriangle, Star];
  const Icon = icons[index % icons.length];
  return <Icon className="h-3.5 w-3.5" />;
}

export function CheatSheetViewer({ content, topic }: CheatSheetViewerProps) {
  const sections = useMemo(() => parseSections(content), [content]);

  // If no sections parsed, fall back to raw markdown
  if (sections.length === 0) {
    return (
      <div className="space-y-4">
        <Header topic={topic} />
        <ScrollArea className="h-[600px] pr-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header topic={topic} sectionCount={sections.length} />
      <ScrollArea className="h-[650px] pr-2">
        <div className="columns-1 md:columns-2 gap-4 space-y-4">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`break-inside-avoid rounded-lg border-l-4 p-4 ${SECTION_COLORS[i % SECTION_COLORS.length]}`}
            >
              <div className="mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TITLE_COLORS[i % TITLE_COLORS.length]}`}
                >
                  <SectionIcon index={i} />
                  {section.title}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{section.body}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function Header({ topic, sectionCount }: { topic?: string; sectionCount?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="outline" className="text-xs">
        <BookOpen className="h-3 w-3 mr-1" />
        Cheat Sheet
      </Badge>
      {topic && (
        <Badge variant="secondary" className="text-xs">
          {topic}
        </Badge>
      )}
      {sectionCount && (
        <Badge variant="secondary" className="text-xs">
          {sectionCount} sections
        </Badge>
      )}
    </div>
  );
}
