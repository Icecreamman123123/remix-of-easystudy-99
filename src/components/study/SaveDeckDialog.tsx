import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useFlashcardDecks } from "@/hooks/useFlashcardDecks";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@/lib/study-api";

interface SaveDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards: Flashcard[];
  topic?: string;
}

export function SaveDeckDialog({
  open,
  onOpenChange,
  flashcards,
  topic,
}: SaveDeckDialogProps) {
  const [title, setTitle] = useState(topic || "");
  const [saving, setSaving] = useState(false);
  const { saveDeckWithFlashcards } = useFlashcardDecks();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your flashcard deck.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const deck = await saveDeckWithFlashcards(title, flashcards, topic);
    setSaving(false);

    if (deck) {
      toast({
        title: "Deck saved!",
        description: `"${title}" with ${flashcards.length} flashcards has been saved.`,
      });
      onOpenChange(false);
      setTitle("");
    } else {
      toast({
        title: "Save failed",
        description: "Could not save the deck. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Flashcard Deck</DialogTitle>
          <DialogDescription>
            Save these {flashcards.length} flashcards to study later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deck-title">Deck Title</Label>
            <Input
              id="deck-title"
              placeholder="e.g., Biology Chapter 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Deck
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
