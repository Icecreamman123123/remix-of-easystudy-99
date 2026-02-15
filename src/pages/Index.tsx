import { useState, useEffect } from "react";
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
import { StreakDisplay, AchievementsDisplay } from "@/components/study/StreakAndAchievements";
import { CompactFeatureBanner } from "@/components/study/EnhancedFeatureCards";
import { OnboardingGuide } from "@/components/study/OnboardingTooltips";
import { GamificationHub } from "@/components/study/GamificationHub";
import { ActivityHeatmap, VelocityGauge, PerformanceHeatmap } from "@/components/study/VisualAnalytics";

import { FloatingQuickActions } from "@/components/study/QuickActions";
import { UIProvider, useUI } from "@/context/UIContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StudyAction, parseFlashcards, Flashcard } from "@/lib/study-api";
import { useAuth } from "@/hooks/useAuth-simple";
import { useStudySessions } from "@/hooks/useStudySessions-simple";
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
  Zap,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StudyResult {
  action: StudyAction;
  result: string;
  isManual?: boolean;
}


const Index = () => {
  return (
    <UIProvider>
      <IndexContent />
    </UIProvider>
  );
};

const IndexContent = () => {
  const [currentResult, setCurrentResult] = useState<StudyResult | null>(null);
  
  const { isFocusMode, toggleFocusMode } = useUI();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [flashcardsToSave, setFlashcardsToSave] = useState<Flashcard[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [showChat, setShowChat] = useState(false);
  const [chatGradeLevel, setChatGradeLevel] = useState("8");
  const [manualEditor, setManualEditor] = useState<ManualEditorMode>(null);
  const [pendingTemplateData] = useState<any>(null);

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

  const handleSaveFlashcards = () => {
    if (flashcardsToSave.length > 0) {
      setSaveDialogOpen(true);
    } else {
      toast({
        title: "No flashcards",
        description: "Generate some flashcards first to save them.",
        variant: "destructive",
      });
    }
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background text-foreground transition-all duration-500 ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* Header - Hidden in Focus Mode */}
      {!isFocusMode && (
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">EasyStudy</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">AI-powered study tools</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold">{user.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Premium Student</span>
                </div>
                <Button variant="outline" size="icon" onClick={() => signOut()} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="default" size="sm" className="gap-2 shadow-lg shadow-primary/20">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  {t("auth.signIn")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Feature Banner - Hidden in Focus Mode */}
      {!isFocusMode && <CompactFeatureBanner />}

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Main Study Area */}
          <div className={`lg:col-span-3 space-y-10 transition-all duration-500 ${isFocusMode ? 'lg:col-span-4 max-w-4xl mx-auto' : ''}`}>
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter">
                    {t("hero.title")}
                  </h2>
                  <p className="text-muted-foreground">
                    {t("hero.subtitle")}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleFocusMode}
                  className="gap-2 border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {isFocusMode ? "Exit Focus" : "Focus Mode"}
                </Button>
              </div>

              <div className="apple-card rounded-2xl overflow-hidden">
                <StudyInput 
                  onResult={handleResultWithChat} 
                  onManualCreate={setManualEditor}
                />
              </div>
            </section>

            {manualEditor && manualEditor.type === "flashcard" && (
              <ManualFlashcardEditor 
                targetAction={manualEditor.action}
                actionLabel={manualEditor.label}
                onCancel={() => setManualEditor(null)}
                onSubmit={(action, result, topic) => {
                  handleResult(action, result, topic, true);
                  setManualEditor(null);
                }}
              />
            )}

            {currentResult && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ResultsViewer 
                  action={currentResult.action} 
                  result={currentResult.result} 
                  isManual={currentResult.isManual}
                  topic={currentTopic}
                  onClose={() => setCurrentResult(null)}
                />
              </div>
            )}
          </div>

          {/* Sidebar Area - Hidden in Focus Mode */}
          <div className={`space-y-10 transition-all duration-500 ${isFocusMode ? 'hidden' : 'block'}`}>
            <StreakDisplay />
            
            {showChat && (
              <div className="animate-in fade-in zoom-in-95">
                <StudyChat 
                  topic={currentTopic || "General Studies"}
                  gradeLevel={chatGradeLevel} 
                  onClose={() => setShowChat(false)}
                  sourceContext={currentResult?.result}
                  language={undefined}
                />
              </div>
            )}

            <StudyTimer />

            {/* Show detailed analytics for logged-in users */}
            {user && (
              <>
                <GamificationHub />
                <div className="grid grid-cols-1 gap-6">
                  <ActivityHeatmap />
                  <PerformanceHeatmap />
                  <VelocityGauge />
                </div>
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

      {/* Onboarding Guide */}
      <OnboardingGuide />
      
      {/* Floating Actions */}
      <FloatingQuickActions 
        onSave={handleSaveFlashcards}
        onAskAI={() => setShowChat(true)}
        onShare={() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link Copied", description: "Share this link with your friends!" });
          }
        }}
      />

      {/* Footer */}
      {!isFocusMode && (
      <footer className="border-t gradient-border mt-auto bg-muted/30">
        <div className="max-w-[1600px] mx-auto px-6 py-10 text-center text-sm text-muted-foreground">
          <p>{t("footer.builtWith")}</p>
          <p className="mt-2 text-xs opacity-70">Made by Daniel Yu</p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setTemplatesManagerOpen(true)} className="hover-glow">
              Manage templates
            </Button>
            <Button size="sm" variant="outline" asChild className="hover-glow">
              <a href="/explore">Explore Sets</a>
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">© Daniel Yu. All rights reserved.</div>
        </div>
      </footer>
      )}

      <SaveDeckDialog 
        open={saveDialogOpen} 
        onOpenChange={setSaveDialogOpen}
        flashcards={flashcardsToSave}
        topic={currentTopic}
      />

      <TemplatesManager 
        open={templatesManagerOpen}
        onOpenChange={setTemplatesManagerOpen}
      />
    </div>
  );
};

export default Index;
