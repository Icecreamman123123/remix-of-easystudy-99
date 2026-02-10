import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFlashcardDecks, type FlashcardDeck, type SavedFlashcard } from "@/hooks/useFlashcardDecks";
import { FlashcardViewer } from "./FlashcardViewer";
import { PracticeTest } from "./PracticeTest";
import { MindMap } from "./MindMap";
import { ShareDeckDialog } from "./ShareDeckDialog";
import { EditDeckDialog } from "./EditDeckDialog";
import { useStudySessions } from "@/hooks/useStudySessions";
import { calculateNextReview, booleanToQuality } from "@/lib/spaced-repetition";
import { 
  BookOpen, 
  Trash2, 
  Play, 
  Loader2, 
  FolderOpen, 
  Share2, 
  Clock, 
  Sparkles,
  Edit3,
  ClipboardList,
  Layers,
  Network
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

type StudyMode = 'flashcards' | 'test' | 'mindmap';

export function MyDecks() {
  const { decks, loading, getDeckFlashcards, getDueCards, deleteDeck, updateFlashcardProgress, refetch } = useFlashcardDecks();
  const { recordSession } = useStudySessions();
  const { toast } = useToast();
  
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [flashcards, setFlashcards] = useState<SavedFlashcard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<FlashcardDeck | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deckToShare, setDeckToShare] = useState<FlashcardDeck | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState<FlashcardDeck | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('flashcards');
  const [isDueMode, setIsDueMode] = useState(false);

  const handleStudyDeck = async (deck: FlashcardDeck, mode: StudyMode = 'flashcards', dueOnly: boolean = false) => {
    setLoadingFlashcards(true);
    setStudyMode(mode);
    setIsDueMode(dueOnly);
    
    const cards = dueOnly 
      ? await getDueCards(deck.id)
      : await getDeckFlashcards(deck.id);
    
    setFlashcards(cards);
    setSelectedDeck(deck);
    setLoadingFlashcards(false);
  };

  const handleCardResult = async (flashcardId: string, correct: boolean) => {
    const quality = booleanToQuality(correct);
    const result = calculateNextReview(quality);
    await updateFlashcardProgress(flashcardId, correct, result.nextReviewDate);
  };


  const handleComplete = async (results: { correct: number; total: number }) => {
    if (selectedDeck) {
      await recordSession(
        studyMode === 'test' ? 'quiz' : 'flashcard',
        results.total,
        results.correct,
        results.total,
        undefined,
        selectedDeck.id
      );
      toast({
        title: "Session complete!",
        description: `You got ${results.correct} out of ${results.total} correct.`,
      });
    }
    setSelectedDeck(null);
    setFlashcards([]);
  };

  const handleDeleteClick = (deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeckToDelete(deck);
    setDeleteDialogOpen(true);
  };

  const handleShareClick = (deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeckToShare(deck);
    setShareDialogOpen(true);
  };

  const handleEditClick = (deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeckToEdit(deck);
    setEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deckToDelete) {
      const success = await deleteDeck(deckToDelete.id);
      if (success) {
        toast({
          title: "Deck deleted",
          description: `"${deckToDelete.title}" has been deleted.`,
        });
      }
    }
    setDeleteDialogOpen(false);
    setDeckToDelete(null);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      refetch(); // Refresh deck list after editing
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (selectedDeck && flashcards.length > 0) {
    return (
      <Card className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">{selectedDeck.title}</CardTitle>
            <div className="flex gap-2 mt-1">
              {isDueMode && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Due for review
                </Badge>
              )}
              <Badge variant="outline">
                {studyMode === 'flashcards' && <><Layers className="h-3 w-3 mr-1" /> Flashcards</>}
                {studyMode === 'test' && <><ClipboardList className="h-3 w-3 mr-1" /> Practice Test</>}
                {studyMode === 'mindmap' && <><Network className="h-3 w-3 mr-1" /> Mind Map</>}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedDeck(null)}>
            Back to Decks
          </Button>
        </CardHeader>
        <CardContent>
          {studyMode === 'flashcards' && (
            <FlashcardViewer 
              flashcards={flashcards.map((fc) => ({
                id: fc.id,
                question: fc.question,
                answer: fc.answer,
                hint: fc.hint || undefined,
              }))} 
              onComplete={handleComplete}
              onCardResult={handleCardResult}
            />
          )}
          {studyMode === 'test' && (
            <PracticeTest
              flashcards={flashcards}
              onComplete={handleComplete}
            />
          )}
          {studyMode === 'mindmap' && (
            <MindMap
              flashcards={flashcards}
              deckTitle={selectedDeck.title}
              onComplete={() => {
                setSelectedDeck(null);
                setFlashcards([]);
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  if (selectedDeck && flashcards.length === 0) {
    return (
      <Card className="animate-in fade-in-50 duration-300">
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-primary mb-3" />
          <h3 className="font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground mb-4">
            No cards due for review. Great job staying on top of your studies!
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setSelectedDeck(null)}>
              Back to Decks
            </Button>
            <Button onClick={() => handleStudyDeck(selectedDeck, 'flashcards', false)}>
              Study All Cards
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="animate-in fade-in-50 duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              My Flashcard Decks
            </CardTitle>
            <Badge variant={decks.length >= 10 ? "destructive" : "secondary"}>
              {decks.length}/10 Decks
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No saved decks yet</p>
              <p className="text-sm">Generate flashcards and save them to study later</p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {decks.map((deck, index) => (
                  <div
                    key={deck.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-all duration-200 hover:shadow-md animate-in fade-in-50 slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{deck.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {deck.flashcard_count} cards • {deck.topic || "No topic"}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleEditClick(deck, e)}
                          title="Edit deck"
                          className="transition-transform hover:scale-105"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleShareClick(deck, e)}
                          title="Share deck"
                          className="transition-transform hover:scale-105"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive transition-transform hover:scale-105"
                          onClick={(e) => handleDeleteClick(deck, e)}
                          title="Delete deck"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Study Mode Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStudyDeck(deck, 'flashcards', true)}
                        disabled={loadingFlashcards}
                        className="text-xs transition-transform hover:scale-105"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Due Cards
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStudyDeck(deck, 'flashcards', false)}
                        disabled={loadingFlashcards}
                        className="text-xs transition-transform hover:scale-105"
                      >
                        {loadingFlashcards ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Flashcards
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStudyDeck(deck, 'test', false)}
                        disabled={loadingFlashcards}
                        className="text-xs transition-transform hover:scale-105"
                      >
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStudyDeck(deck, 'mindmap', false)}
                        disabled={loadingFlashcards}
                        className="text-xs transition-transform hover:scale-105"
                      >
                        <Network className="h-3 w-3 mr-1" />
                        Mind Map
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="animate-in fade-in-0 zoom-in-95 duration-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deckToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deckToShare && (
        <ShareDeckDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          deckId={deckToShare.id}
          deckTitle={deckToShare.title}
        />
      )}

      {deckToEdit && (
        <EditDeckDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          deck={deckToEdit}
        />
      )}
    </>
  );
}
