import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Save, 
  Share2, 
  FileText, 
  MessageSquare,
  ChevronUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FloatingQuickActions() {
  const [isVisible, setIsVisible] = useState(false);

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

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-full h-12 w-12 shadow-lg hover:scale-110 transition-transform">
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="gap-2">
            <Save className="h-4 w-4" /> Save to Deck
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <MessageSquare className="h-4 w-4" /> Ask AI Assistant
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <FileText className="h-4 w-4" /> Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Share2 className="h-4 w-4" /> Share Progress
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        variant="secondary" 
        size="icon" 
        className="rounded-full h-10 w-10 shadow-md opacity-80 hover:opacity-100"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
