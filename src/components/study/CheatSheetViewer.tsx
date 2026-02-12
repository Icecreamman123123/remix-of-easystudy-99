import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, AlertTriangle, Lightbulb, Calculator } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CheatSheetViewerProps {
  content: string;
  topic?: string;
}

export function CheatSheetViewer({ content, topic }: CheatSheetViewerProps) {
  return (
    <div className="space-y-4">
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
      </div>
      <ScrollArea className="h-[600px] pr-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
}
