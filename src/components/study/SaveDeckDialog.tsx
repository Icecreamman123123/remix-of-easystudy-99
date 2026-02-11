import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { STUDY_TEMPLATES } from "@/lib/study-templates";
import { TemplatesManager } from "@/components/study/TemplatesManager";
import { useStudyTemplates } from "@/hooks/useStudyTemplates";
import { Plus, Trash2 } from "lucide-react";
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
  const { templates: userTemplates, loading: userTemplatesLoading } = useStudyTemplates();
  const [templatesManagerOpen, setTemplatesManagerOpen] = React.useState(false);

  // Template preview/edit state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewCards, setPreviewCards] = useState<Flashcard[]>([]);

  // Reset title when topic changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle(topic || "");
    } else {
      // Clear preview state when dialog is closed
      setPreviewOpen(false);
      setPreviewCards([]);
      setPreviewTitle("");
      setSaving(false);
    }
  }, [open, topic]);
  // Show preview editor when creating from a template
  const handleCreateFromTemplate = async (templateId: string) => {
    const effectiveTopic = topic || title || "";
    if (!effectiveTopic.trim()) {
      toast({
        title: "Topic or Title required",
        description: "Please enter a topic or title before creating from a template.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { generateTemplateDeck } = await import("@/lib/study-templates");
      const { title: templateTitle, flashcards: templateCards } = await generateTemplateDeck(templateId, effectiveTopic, undefined);

      setPreviewTitle(title.trim() || templateTitle);
      setPreviewCards(templateCards);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Template creation failed:", err);
      toast({ title: "Template failed", description: String((err as Error).message || "Unknown error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreviewCard = (index: number, field: "question" | "answer" | "hint", value: string) => {
    setPreviewCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddPreviewCard = () => {
    setPreviewCards((prev) => [...prev, { question: "New question", answer: "Answer", hint: "" }]);
  };

  const handleRemovePreviewCard = (index: number) => {
    setPreviewCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFromPreview = async () => {
    if (!previewTitle.trim()) {
      toast({ title: "Title required", description: "Please enter a title.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const deck = await saveDeckWithFlashcards(previewTitle.trim(), previewCards, topic || previewTitle);
      if (deck && deck.error === "limit_reached") {
        toast({ title: "Deck limit reached", description: deck.message, variant: "destructive" });
      } else if (deck && !deck.error) {
        toast({ title: "Deck created", description: `"${previewTitle}" has been created from a template.` });
        onOpenChange(false);
        setTitle("");
        setPreviewOpen(false);
        setPreviewCards([]);
      } else {
        toast({ title: "Create failed", description: "Could not create deck.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Save from preview failed:", err);
      toast({ title: "Create failed", description: String((err as Error).message || "Unknown error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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

    if (deck && deck.error === "limit_reached") {
      toast({
        title: "Deck limit reached",
        description: deck.message,
        variant: "destructive",
      });
    } else if (deck && !deck.error) {
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
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle>Save Flashcard Deck</DialogTitle>
              <DialogDescription>
                Save these {flashcards.length} flashcards to study later
              </DialogDescription>
            </div>

            {/* Templates dropdown */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">Templates</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Built-in Templates</DropdownMenuLabel>
                  {STUDY_TEMPLATES.map((t) => (
                    <DropdownMenuItem key={t.id} onSelect={() => handleCreateFromTemplate(t.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-xs text-muted-foreground">{t.description}</span>
                          {t.preview && (
                            <span className="text-xs italic text-muted-foreground mt-1">{t.preview}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.defaultCount || "—"} cards</div>
                      </div>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Your Templates</DropdownMenuLabel>

                  {/* user-defined templates */}
                  {userTemplatesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                  ) : userTemplates.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No saved templates</div>
                  ) : (
                    userTemplates.map((t) => {
                      const userPreview = (t.payload && (t.payload.preview || t.payload.summary)) || t.description || '';
                      return (
                        <DropdownMenuItem key={t.id} onSelect={async () => {
                          // use payload to create template-like deck
                          const { name: tname, action, payload } = t as any;
                          const effectiveTopic = topic || title || "";
                          const { generateTemplateDeck } = await import("@/lib/study-templates");
                          const { flashcards } = await generateTemplateDeck(action === "generate-flashcards" ? "exam-revision" : action, effectiveTopic, undefined);
                          setPreviewTitle(tname);
                          setPreviewCards(flashcards.map((c:any)=>({question:c.question, answer:c.answer, hint:c.hint})));
                          setPreviewOpen(true);
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{t.name}</span>
                              <span className="text-xs text-muted-foreground">{t.description}</span>
                              {userPreview && (
                                <span className="text-xs italic text-muted-foreground mt-1">{typeof userPreview === 'string' ? (userPreview.length > 80 ? userPreview.slice(0,80) + '...' : userPreview) : String(userPreview)}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{t.estimated_count || "—"} cards</div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setTemplatesManagerOpen(true)}>
                    Manage templates
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TemplatesManager open={templatesManagerOpen} onOpenChange={setTemplatesManagerOpen} />
            </div>
          </div>
        </DialogHeader>

        {previewOpen ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preview-title">Deck Title</Label>
              <Input
                id="preview-title"
                placeholder="e.g., Biology Chapter 5"
                value={previewTitle}
                onChange={(e) => setPreviewTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>Preview & Edit Cards</Label>
              <div className="space-y-4 max-h-[360px] overflow-auto mt-2">
                {previewCards.map((c, i) => (
                  <div key={i} className="border rounded p-3">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="text-sm">Question</Label>
                        <Textarea value={c.question} onChange={(e) => handleUpdatePreviewCard(i, "question", e.target.value)} />
                        <Label className="mt-2 text-sm">Answer</Label>
                        <Textarea value={c.answer} onChange={(e) => handleUpdatePreviewCard(i, "answer", e.target.value)} />
                        <Label className="mt-2 text-sm">Hint (optional)</Label>
                        <Input value={c.hint || ""} onChange={(e) => handleUpdatePreviewCard(i, "hint", e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-2 items-start">
                        <Button size="sm" variant="ghost" onClick={handleAddPreviewCard} title="Add card">
                          <Plus />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemovePreviewCard(i)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={handleAddPreviewCard}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Card
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {previewOpen ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back
            </Button>
            <Button onClick={handleSaveFromPreview} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Deck
                </>
              )}
            </Button>
          </DialogFooter>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
