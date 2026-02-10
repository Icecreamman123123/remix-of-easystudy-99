import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlashcardDecks, type FlashcardDeck, type SavedFlashcard } from "@/hooks/useFlashcardDecks-simple";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Loader2, Edit3 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: FlashcardDeck;
}

export function EditDeckDialog({ open, onOpenChange, deck }: EditDeckDialogProps) {
  const { getDeckFlashcards, updateFlashcard, addFlashcard, deleteFlashcard, updateDeck, refetch } = useFlashcardDecks();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashcards, setFlashcards] = useState<SavedFlashcard[]>([]);
  const [deckTitle, setDeckTitle] = useState(deck.title);
  const [deckTopic, setDeckTopic] = useState(deck.topic || "");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ question: "", answer: "", hint: "" });
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    if (open) {
      loadFlashcards();
      setDeckTitle(deck.title);
      setDeckTopic(deck.topic || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deck.id, deck.title, deck.topic]);

  const loadFlashcards = async () => {
    setLoading(true);
    const cards = await getDeckFlashcards(deck.id);
    setFlashcards(cards);
    setLoading(false);
  };

  const handleSaveDeckInfo = async () => {
    setSaving(true);
    const success = await updateDeck(deck.id, {
      title: deckTitle,
      topic: deckTopic || undefined,
    });
    setSaving(false);

    if (success) {
      toast({ title: "Deck updated", description: "Deck info saved successfully." });
    }
  };

  const handleUpdateCard = async (card: SavedFlashcard) => {
    setSaving(true);
    const success = await updateFlashcard(card.id, {
      question: card.question,
      answer: card.answer,
      hint: card.hint,
    });
    setSaving(false);

    if (success) {
      setEditingCardId(null);
      toast({ title: "Card updated" });
    }
  };

  const handleAddCard = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      toast({ title: "Error", description: "Question and answer are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const success = await addFlashcard(deck.id, newCard);
    setSaving(false);

    if (success) {
      setNewCard({ question: "", answer: "", hint: "" });
      setShowAddCard(false);
      await loadFlashcards();
      toast({ title: "Card added" });
    }
  };

  const handleDeleteCard = async () => {
    if (!deleteCardId) return;

    setSaving(true);
    const success = await deleteFlashcard(deleteCardId);
    setSaving(false);

    if (success) {
      setFlashcards(flashcards.filter((c) => c.id !== deleteCardId));
      setDeleteCardId(null);
      toast({ title: "Card deleted" });
    }
  };

  const updateCardLocally = (id: string, field: keyof SavedFlashcard, value: string) => {
    setFlashcards(flashcards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Deck
            </DialogTitle>
            <DialogDescription>
              Modify your flashcard deck and its cards
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Deck Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deck-title">Deck Title</Label>
                <Input
                  id="deck-title"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="Deck title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deck-topic">Topic</Label>
                <Input
                  id="deck-topic"
                  value={deckTopic}
                  onChange={(e) => setDeckTopic(e.target.value)}
                  placeholder="Topic (optional)"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDeckInfo}
              disabled={saving}
              className="w-fit"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Deck Info
            </Button>

            {/* Cards Section */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Flashcards ({flashcards.length})</Label>
              <Button size="sm" onClick={() => setShowAddCard(!showAddCard)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </div>

            {/* Add New Card Form */}
            {showAddCard && (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30 animate-in fade-in-50 slide-in-from-top-2">
                <Input
                  placeholder="Question"
                  value={newCard.question}
                  onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                />
                <Textarea
                  placeholder="Answer"
                  value={newCard.answer}
                  onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                  rows={2}
                />
                <Input
                  placeholder="Hint (optional)"
                  value={newCard.hint}
                  onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCard} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddCard(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Cards List */}
            <ScrollArea className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {flashcards.map((card, index) => (
                    <div
                      key={card.id}
                      className="border rounded-lg p-3 space-y-2 bg-card animate-in fade-in-50"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {editingCardId === card.id ? (
                        <>
                          <Input
                            value={card.question}
                            onChange={(e) => updateCardLocally(card.id, "question", e.target.value)}
                            placeholder="Question"
                          />
                          <Textarea
                            value={card.answer}
                            onChange={(e) => updateCardLocally(card.id, "answer", e.target.value)}
                            placeholder="Answer"
                            rows={2}
                          />
                          <Input
                            value={card.hint || ""}
                            onChange={(e) => updateCardLocally(card.id, "hint", e.target.value)}
                            placeholder="Hint (optional)"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateCard(card)} disabled={saving}>
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCardId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{card.question}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{card.answer}</p>
                            {card.hint && (
                              <p className="text-xs text-muted-foreground italic mt-1">💡 {card.hint}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingCardId(card.id)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteCardId(card.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCardId} onOpenChange={() => setDeleteCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
