import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Save, 
  Share2, 
  FileText, 
  MessageSquare,
  ChevronUp,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onSave?: () => void;
  onAskAI?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

export function FloatingQuickActions({ onSave, onAskAI, onExport, onShare }: QuickActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const handleAction = (name: string, callback?: () => void) => {
    if (callback) {
      callback();
    } else {
      toast({
        title: `${name} Action`,
        description: `Triggered ${name} from quick actions.`,
      });
    }
  };

  const exportAsPDF = () => {
    toast({
      title: "Exporting...",
      description: "Preparing your study material for PDF export.",
    });
    // Simulate export
    setTimeout(() => {
       window.print();
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-full h-14 w-14 shadow-2xl hover:scale-110 transition-transform bg-primary border-4 border-background">
            <Plus className="h-7 w-7" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-2 space-y-1">
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={() => handleAction("Save", onSave)}>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Save className="h-4 w-4 text-blue-500" /></div>
            <span className="font-semibold">Save to Deck</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={() => handleAction("Ask AI", onAskAI)}>
            <div className="p-2 bg-purple-500/10 rounded-lg"><MessageSquare className="h-4 w-4 text-purple-500" /></div>
            <span className="font-semibold">Ask Assistant</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={exportAsPDF}>
            <div className="p-2 bg-orange-500/10 rounded-lg"><Download className="h-4 w-4 text-orange-500" /></div>
            <span className="font-semibold">Export PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={() => handleAction("Share", onShare)}>
            <div className="p-2 bg-green-500/10 rounded-lg"><Share2 className="h-4 w-4 text-green-500" /></div>
            <span className="font-semibold">Share Link</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        variant="secondary" 
        size="icon" 
        className="rounded-full h-10 w-10 shadow-md opacity-80 hover:opacity-100 border-2 border-background"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
