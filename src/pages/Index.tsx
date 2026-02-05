import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { StudyInput } from "@/components/study/StudyInput";
import { ResultsViewer } from "@/components/study/ResultsViewer";
import { StudyTimer } from "@/components/study/StudyTimer";
import { MyDecks } from "@/components/study/MyDecks";
import { LearningAnalytics } from "@/components/study/LearningAnalytics";
import { SaveDeckDialog } from "@/components/study/SaveDeckDialog";
 import { StudyChat } from "@/components/study/StudyChat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StudyAction, parseFlashcards, Flashcard } from "@/lib/study-api";
import { useAuth } from "@/hooks/useAuth";
import { useStudySessions } from "@/hooks/useStudySessions";
import { useI18n } from "@/lib/i18n";
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Brain, 
  Target, 
  Repeat,
  LogOut,
  LogIn,
  Save,
   User,
    MessageCircle,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StudyResult {
  action: StudyAction;
  result: string;
}

const Index = () => {
  const [currentResult, setCurrentResult] = useState<StudyResult | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [flashcardsToSave, setFlashcardsToSave] = useState<Flashcard[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
   const [showChat, setShowChat] = useState(false);
   const [chatGradeLevel, setChatGradeLevel] = useState("8");
  
  const { user, signOut, loading } = useAuth();
  const { recordSession } = useStudySessions();
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

   const handleResultWithChat = (action: StudyAction, result: string, topic?: string, gradeLevel?: string) => {
     handleResult(action, result, topic);
     if (gradeLevel) {
       setChatGradeLevel(gradeLevel);
     }
   };
 
  const handleResult = (action: StudyAction, result: string, topic?: string) => {
    setCurrentResult({ action, result });
    if (topic) {
      setCurrentTopic(topic);
    }
    
    // Parse flashcards for potential saving (for all flashcard-based modes)
    if (["generate-flashcards", "leitner-system", "practice-test", "study-runner", "matching-game"].includes(action)) {
      const cards = parseFlashcards(result);
      setFlashcardsToSave(cards);
    } else if (action === "mind-map") {
      // Mind map uses concepts which can also be saved as flashcards
      const cards = parseFlashcards(result);
      setFlashcardsToSave(cards);
    }
  };

  const handleSaveFlashcards = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save flashcards.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("app.name")}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {t("app.tagline")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
              {loading ? null : user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-2">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("auth.signOut")}
                  </Button>
                </>
              ) : (
                <Button asChild className="transition-all duration-200 hover:scale-105">
                  <Link to="/auth">
                    <LogIn className="h-4 w-4 mr-2" />
                    {t("auth.signIn")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Features Banner */}
      <section className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FeatureCard 
              icon={Sparkles} 
              title={t("feature.activeRecall")} 
              description={t("feature.activeRecall.desc")}
              index={0}
            />
            <FeatureCard 
              icon={Repeat} 
              title={t("feature.spacedRepetition")} 
              description={t("feature.spacedRepetition.desc")}
              index={1}
            />
            <FeatureCard 
              icon={Brain} 
              title={t("feature.feynman")} 
              description={t("feature.feynman.desc")}
              index={2}
            />
            <FeatureCard 
              icon={Target} 
              title={t("feature.pomodoro")} 
              description={t("feature.pomodoro.desc")}
              index={3}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Study Input - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
             <StudyInput onResult={handleResultWithChat} />
            
            {currentResult && (
              <div className="relative">
                {["generate-flashcards", "leitner-system", "practice-test", "mind-map", "study-runner", "matching-game"].includes(currentResult.action) && flashcardsToSave.length > 0 && (
                  <div className="absolute top-4 left-4 z-10">
                    <Button size="sm" onClick={handleSaveFlashcards}>
                      <Save className="h-4 w-4 mr-2" />
                      {t("common.saveDeck")}
                    </Button>
                  </div>
                )}
                <ResultsViewer 
                  action={currentResult.action} 
                  result={currentResult.result}
                  topic={currentTopic}
                  onClose={() => setCurrentResult(null)}
                />
              </div>
            )}

            {/* Show saved decks for logged-in users */}
            {user && <MyDecks />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             {/* AI Chat Button */}
            {currentTopic && (
             <div className="space-y-3">
               {!showChat && (
               <Button
                 onClick={() => setShowChat(true)}
                 className="w-full gap-2 h-auto py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                 variant="outline"
               >
                 <div className="flex items-center gap-2 flex-1">
                   <div className="p-2 bg-primary/20 rounded-full">
                     <MessageCircle className="h-5 w-5 text-primary" />
                   </div>
                   <div className="text-left">
                     <p className="font-semibold">AI Study Chat</p>
                     <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                       Ask about: {currentTopic}
                     </p>
                   </div>
                   <Zap className="h-4 w-4 text-primary ml-auto" />
                 </div>
               </Button>
               )}
             </div>
           )}
 
             {/* AI Chat Panel */}
             {showChat && (
              <div className="h-[550px]">
                 <StudyChat
                   topic={currentTopic}
                   gradeLevel={chatGradeLevel}
                   onClose={() => setShowChat(false)}
                 />
               </div>
             )}
 
            <StudyTimer />
            
            {/* Show detailed analytics for logged-in users */}
            {user && <LearningAnalytics />}
            
            {/* Study Tips Card */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4" />
                {t("tips.title")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {t("tips.1")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {t("tips.2")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {t("tips.3")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {t("tips.4")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {t("tips.5")}
                </li>
              </ul>
            </div>

            {!user && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{t("auth.saveProgress")}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("auth.saveProgressDesc")}
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link to="/auth">{t("auth.createAccount")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>{t("footer.builtWith")}</p>
        </div>
      </footer>

      {/* Save Dialog */}
      <SaveDeckDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        flashcards={flashcardsToSave}
        topic={currentTopic}
      />
    </div>
  );
};

function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  index = 0
}: { 
  icon: typeof Sparkles; 
  title: string; 
  description: string;
  index?: number;
}) {
  return (
    <div 
      className="flex items-start gap-3 p-3 bg-background rounded-lg border transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-in fade-in-50 slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-2 bg-primary/10 rounded-md shrink-0 transition-colors duration-200 group-hover:bg-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default Index;
