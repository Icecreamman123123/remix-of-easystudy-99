import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, X, GripVertical, Copy } from "lucide-react";
import { StudyAction } from "@/lib/study-api";

interface FlashcardEntry {
  id: string;
  question: string;
  answer: string;
  hint: string;
}

interface ManualFlashcardEditorProps {
  targetAction: StudyAction;
  actionLabel: string;
  onSubmit: (action: StudyAction, result: string, topic: string) => void;
  onCancel: () => void;
}

function createEmptyCard(): FlashcardEntry {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question: "",
    answer: "",
    hint: "",
  };
}

export function ManualFlashcardEditor({ targetAction, actionLabel, onSubmit, onCancel }: ManualFlashcardEditorProps) {
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<FlashcardEntry[]>([createEmptyCard(), createEmptyCard(), createEmptyCard()]);

  const addCard = () => {
    setCards((prev) => [...prev, createEmptyCard()]);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 2) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const duplicateCard = (index: number) => {
    const card = cards[index];
    const newCard: FlashcardEntry = {
      ...card,
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    const updated = [...cards];
    updated.splice(index + 1, 0, newCard);
    setCards(updated);
  };

  const updateCard = (id: string, field: keyof FlashcardEntry, value: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());

  const handleSubmit = () => {
    if (validCards.length < 2) return;

    const flashcards = validCards.map((c) => ({
      question: c.question.trim(),
      answer: c.answer.trim(),
      ...(c.hint.trim() ? { hint: c.hint.trim() } : {}),
    }));

    const result = JSON.stringify(flashcards);
    onSubmit(targetAction, result, title.trim() || "Manual Study Set");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Create {actionLabel}</CardTitle>
            <CardDescription>
              Add your own questions and answers manually
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="set-title">Title</Label>
          <Input
            id="set-title"
            placeholder="e.g., Chapter 5 Biology Terms"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="p-3 border rounded-lg space-y-2 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => duplicateCard(index)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => removeCard(card.id)}
                      disabled={cards.length <= 2}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Question / Front side"
                  value={card.question}
                  onChange={(e) => updateCard(card.id, "question", e.target.value)}
                />
                <Textarea
                  placeholder="Answer / Back side"
                  value={card.answer}
                  onChange={(e) => updateCard(card.id, "answer", e.target.value)}
                  className="min-h-[60px]"
                />
                <Input
                  placeholder="Hint (optional)"
                  value={card.hint}
                  onChange={(e) => updateCard(card.id, "hint", e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button variant="outline" onClick={addCard} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {validCards.length} valid card{validCards.length !== 1 ? "s" : ""} (min 2)
          </p>
          <Button
            onClick={handleSubmit}
            disabled={validCards.length < 2}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Start {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
