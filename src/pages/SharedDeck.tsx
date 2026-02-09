import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeckSharing } from "@/hooks/useDeckSharing";
import { useAuth } from "@/hooks/useAuth-simple";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Copy, 
  GraduationCap, 
  BookOpen, 
  LogIn,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

export default function SharedDeck() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getSharedDeck, copySharedDeck, loading } = useDeckSharing();
  const { toast } = useToast();

  const [deckData, setDeckData] = useState<{
    deck: { title: string; topic: string | null; description: string | null };
    flashcards: { question: string; answer: string }[];
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDeck = async () => {
      if (!shareCode) {
        setNotFound(true);
        return;
      }

      const data = await getSharedDeck(shareCode);
      if (data) {
        setDeckData({
          deck: data.deck,
          flashcards: data.flashcards,
        });
      } else {
        setNotFound(true);
      }
    };

    loadDeck();
  }, [shareCode]);

  const handleCopyDeck = async () => {
    if (!shareCode) return;

    setCopying(true);
    const success = await copySharedDeck(shareCode);
    setCopying(false);

    if (success) {
      setCopied(true);
      toast({
        title: "Deck copied!",
        description: "The deck has been added to your collection.",
      });
      setTimeout(() => navigate("/"), 2000);
    } else {
      toast({
        title: "Error",
        description: "Failed to copy deck. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-in fade-in-50 duration-300">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Deck Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This shared deck link is invalid or has expired.
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">StudyAce</h1>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {deckData && (
          <Card className="animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="text-2xl">{deckData.deck.title}</CardTitle>
              {deckData.deck.topic && (
                <p className="text-muted-foreground">Topic: {deckData.deck.topic}</p>
              )}
              {deckData.deck.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {deckData.deck.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <BookOpen className="h-4 w-4" />
                  <span>{deckData.flashcards.length} flashcards</span>
                </div>

                {/* Preview some cards */}
                <div className="space-y-2">
                  {deckData.flashcards.slice(0, 3).map((card, i) => (
                    <div
                      key={i}
                      className="bg-background rounded p-3 text-sm animate-in fade-in-50 duration-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <p className="font-medium truncate">{card.question}</p>
                    </div>
                  ))}
                  {deckData.flashcards.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{deckData.flashcards.length - 3} more cards
                    </p>
                  )}
                </div>
              </div>

              {copied ? (
                <div className="text-center py-4 animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
                  <p className="font-medium">Deck copied successfully!</p>
                  <p className="text-sm text-muted-foreground">Redirecting...</p>
                </div>
              ) : user ? (
                <Button
                  onClick={handleCopyDeck}
                  disabled={copying}
                  className="w-full transition-all duration-200 hover:scale-[1.02]"
                  size="lg"
                >
                  {copying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy to My Decks
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to copy this deck to your collection
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to Copy
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
