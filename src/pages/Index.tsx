import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { StudyInput, ManualEditorMode } from "@/components/study/StudyInput";
import { ResultsViewer } from "@/components/study/ResultsViewer";
import { StudyTimer } from "@/components/study/StudyTimer";
import { MyDecks } from "@/components/study/MyDecks";
import { LearningAnalytics } from "@/components/study/LearningAnalytics";
import { SaveDeckDialog } from "@/components/study/SaveDeckDialog";
import { TemplatesManager } from "@/components/study/TemplatesManager";
import { StudyChat } from "@/components/study/StudyChat";
import { ManualFlashcardEditor } from "@/components/study/ManualFlashcardEditor";
import { ManualQuizEditor } from "@/components/study/ManualQuizEditor";
import { ManualWorksheetEditor } from "@/components/study/ManualWorksheetEditor";
import { StreakDisplay, AchievementsDisplay } from "@/components/study/StreakAndAchievements";
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
  isManual?: boolean;
}


const Index = () => {
  const [currentResult, setCurrentResult] = useState<StudyResult | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [flashcardsToSave, setFlashcardsToSave] = useState<Flashcard[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [showChat, setShowChat] = useState(false);
  const [chatGradeLevel, setChatGradeLevel] = useState("8");
  const [manualEditor, setManualEditor] = useState<ManualEditorMode>(null);
  const [pendingTemplateData, setPendingTemplateData] = useState<any>(null);

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

  const handleResult = (action: StudyAction, result: string, topic?: string, isManual?: boolean) => {
    setCurrentResult({ action, result, isManual });
    if (topic) {
      setCurrentTopic(topic);
    }

    // Parse flashcards for potential saving (for all flashcard-based modes)
    if (["generate-flashcards", "leitner-system", "practice-test", "study-runner", "matching-game"].includes(action)) {
      const cards = parseFlashcards(result);
      setFlashcardsToSave(cards);
    } else if (action === "mind-map") {
      const cards = parseFlashcards(result);
      setFlashcardsToSave(cards);
    }
  };

  const handleManualResult = (action: StudyAction, result: string, topic: string) => {
    setManualEditor(null);
    handleResult(action, result, topic, true);
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

  const handleSaveStudyPlan = (plan: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save templates.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setPendingTemplateData({
      name: `Study Plan: ${currentTopic}`,
      description: `Structured study plan for ${currentTopic}`,
      action: "create-study-plan",
      payload: {
        plan,
        topic: currentTopic,
        difficulty: "medium", // Default, could be extracted
        defaultCount: plan.length
      }
    });
    setTemplatesManagerOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="border-b gradient-border">
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
            <FeatureCard icon={Sparkles} title={t("feature.activeRecall")} description={t("feature.activeRecall.desc")} index={0} />
            <FeatureCard icon={Repeat} title={t("feature.spacedRepetition")} description={t("feature.spacedRepetition.desc")} index={1} />
            <FeatureCard icon={Brain} title={t("feature.feynman")} description={t("feature.feynman.desc")} index={2} />
            <FeatureCard icon={Target} title={t("feature.pomodoro")} description={t("feature.pomodoro.desc")} index={3} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Study Input - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <StudyInput
              onResult={handleResultWithChat}
              onManualCreate={(mode) => setManualEditor(mode)}
            />

            {/* Manual Editors */}
            {manualEditor && !currentResult && (
              <div>
                {manualEditor.type === "flashcard" && (
                  <ManualFlashcardEditor
                    targetAction={manualEditor.action}
                    actionLabel={manualEditor.label}
                    onSubmit={handleManualResult}
                    onCancel={() => setManualEditor(null)}
                  />
                )}
                {manualEditor.type === "quiz" && (
                  <ManualQuizEditor
                    onSubmit={handleManualResult}
                    onCancel={() => setManualEditor(null)}
                  />
                )}
                {manualEditor.type === "worksheet" && (
                  <ManualWorksheetEditor
                    onSubmit={handleManualResult}
                    onCancel={() => setManualEditor(null)}
                  />
                )}
              </div>
            )}

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
                  isManual={currentResult.isManual}
                  onSavePlan={handleSaveStudyPlan}
                />
              </div>
            )}

            {/* Show saved decks for logged-in users */}
            {user && <MyDecks />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Streak Display - Top of Sidebar */}
            {user && <StreakDisplay />}

            {/* AI Chat - Always visible */}
            {!showChat ? (
              <Button
                onClick={() => setShowChat(true)}
                className="w-full gap-2 h-auto py-4 glass-card hover-glow border-2 border-primary/30 hover:border-primary/50"
                variant="outline"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 icon-gradient rounded-full animate-pulse-glow">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">AI Study Chat</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {currentTopic ? `Ask about: ${currentTopic}` : "Ask anything!"}
                    </p>
                  </div>
                  <Zap className="h-4 w-4 text-primary ml-auto" />
                </div>
              </Button>
            ) : (
              <div className="h-[550px]">
                <StudyChat
                  topic={currentTopic || "General Study Help"}
                  gradeLevel={chatGradeLevel}
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}

            <StudyTimer />

            {/* Show detailed analytics for logged-in users */}
            {user && (
              <>
                <LearningAnalytics />
                <AchievementsDisplay />
              </>
            )}

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
      <footer className="border-t gradient-border mt-auto bg-muted/30">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>{t("footer.builtWith")}</p>
          <p className="mt-2 text-xs opacity-70">Made by Daniel Yu</p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => { setPendingTemplateData(null); setTemplatesManagerOpen(true); }} className="hover-glow">
              Manage templates
            </Button>
            <Button size="sm" variant="outline" asChild className="hover-glow">
              <a href="/explore">Explore Sets</a>
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">© Daniel Yu. All rights reserved.</div>
        </div>
      </footer>

      {/* Save Dialog */}
      <SaveDeckDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        flashcards={flashcardsToSave}
        topic={currentTopic}
      />

      {/* Templates Manager (accessible from footer) */}
      <TemplatesManager
        open={templatesManagerOpen}
        onOpenChange={(open) => {
          setTemplatesManagerOpen(open);
          if (!open) setPendingTemplateData(null);
        }}
        prefillData={pendingTemplateData}
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
      className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border/50 apple-card hover-scale animate-in fade-in-50 slide-in-from-bottom-4 group cursor-default"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-3 bg-secondary rounded-lg shrink-0 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default Index;
