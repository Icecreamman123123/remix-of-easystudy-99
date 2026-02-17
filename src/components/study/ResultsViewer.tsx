import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X, FileDown } from "lucide-react";
import { StudyAction, parseFlashcards, parsePracticeProblems, parseConcepts, parseWorksheet, parseStudyPlan, parseCornellNotes, Flashcard, Concept } from "@/lib/study-api";
import { exportToPdf, exportToTxt, exportToCsv } from "@/lib/file-utils";
import { FlashcardViewer } from "./FlashcardViewer";
import { PracticeTest } from "./PracticeTest";
import { MindMap } from "./MindMap";
import { SubwaySurferGame } from "./SubwaySurferGame";
import { WorksheetViewer } from "./WorksheetViewer";
import { MatchingGame } from "./MatchingGame";
import { SpeedChallenge } from "./SpeedChallenge";
import { ElaborativeInterrogation } from "./ElaborativeInterrogation";
import { CornellNotesViewer } from "./CornellNotesViewer";
import { VocabularyCardViewer, parseVocabularyCards } from "./VocabularyCardViewer";
import { CheatSheetViewer } from "./CheatSheetViewer";
import { SlidePresenter, parseSlides } from "./SlidePresenter";
import { StudyPlanCalendar } from "./StudyPlanCalendar";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/lib/i18n";

interface ResultsViewerProps {
  action: StudyAction;
  result: string;
  onClose: () => void;
  topic?: string;
  gradeLevel?: string;
  isManual?: boolean;
  onSavePlan?: (plan: any) => void;
}

// Convert Flashcard to SavedFlashcard-like format for study components
function toSavedFlashcardFormat(flashcards: Flashcard[]) {
  return flashcards.map((fc, index) => ({
    id: `temp-${index}`,
    deck_id: "temp",
    question: fc.question,
    answer: fc.answer,
    hint: fc.hint || null,
    created_at: new Date().toISOString(),
    last_reviewed_at: null,
    next_review_at: null,
    times_correct: 0,
    times_incorrect: 0,
  }));
}

// Convert Concept to SavedFlashcard-like format for mind map
function toMindMapFormat(concepts: Concept[]) {
  return concepts.map((c, index) => ({
    id: `concept-${index}`,
    deck_id: "temp",
    question: c.concept,
    answer: c.definition,
    hint: c.example || null,
    created_at: new Date().toISOString(),
    last_reviewed_at: null,
    next_review_at: null,
    times_correct: 0,
    times_incorrect: 0,
  }));
}

export function ResultsViewer({ action, result, onClose, topic, gradeLevel, isManual, onSavePlan }: ResultsViewerProps) {
  const [completed, setCompleted] = useState(false);
  const { t } = useI18n();
  const flashcards = ["generate-flashcards", "practice-test", "study-runner", "matching-game", "speed-challenge"].includes(action)
    ? parseFlashcards(result)
    : [];

  const handleComplete = (results?: { correct: number; total: number }) => {
    setCompleted(true);
  };

  const renderContent = () => {
    switch (action) {
      case "create-study-plan": {
        const plan = parseStudyPlan(result);
        if (plan.length > 0) {
          return (
            <StudyPlanCalendar
              plan={plan}
              onSavePlan={() => onSavePlan?.(plan)}
              topic={topic}
            />
          );
        }
        break;
      }
      case "generate-flashcards": {
        const flashcards = parseFlashcards(result);
        if (flashcards.length > 0) {
          return <FlashcardViewer flashcards={flashcards} />;
        }
        break;
      }
      case "practice-test": {
        const flashcards = parseFlashcards(result);
        if (flashcards.length > 0) {
          const savedFormat = toSavedFlashcardFormat(flashcards);
          return (
            <PracticeTest
              flashcards={savedFormat}
              onComplete={handleComplete}
              topic={topic}
              disableSmartLearning={isManual}
            />
          );
        }
        break;
      }
      case "mind-map": {
        const concepts = parseConcepts(result);
        if (concepts.length > 0) {
          const mindMapFormat = toMindMapFormat(concepts);
          return (
            <MindMap
              flashcards={mindMapFormat}
              deckTitle={topic || "Study Topic"}
              onComplete={onClose}
              useConcepts={true}
            />
          );
        }
        break;
      }
      case "study-runner": {
        const flashcards = parseFlashcards(result);
        if (flashcards.length > 0) {
          return (
            <SubwaySurferGame
              flashcards={flashcards}
              topic={topic}
              onClose={onClose}
              onComplete={(score, total) => handleComplete({ correct: score, total })}
            />
          );
        }
        break;
      }
      case "matching-game": {
        const flashcards = parseFlashcards(result);
        if (flashcards.length > 0) {
          return (
            <MatchingGame
              flashcards={flashcards}
              onComplete={(score, total) => handleComplete({ correct: score, total })}
            />
          );
        }
        break;
      }
      case "speed-challenge": {
        const flashcards = parseFlashcards(result);
        if (flashcards.length > 0) {
          return (
            <SpeedChallenge
              flashcards={flashcards}
              onComplete={(score, total) => handleComplete({ correct: score, total })}
              topic={topic}
              disableSmartLearning={isManual}
            />
          );
        }
        break;
      }
      case "elaborative-interrogation": {
        return (
          <ElaborativeInterrogation
            result={result}
            topic={topic || "Study Topic"}
            onClose={onClose}
          />
        );
      }
      case "worksheet": {
        const questions = parseWorksheet(result);
        if (questions.length > 0) {
          return (
            <WorksheetViewer
              questions={questions}
              title={topic || "Study Worksheet"}
              onComplete={(score, total) => handleComplete({ correct: score, total })}
            />
          );
        }
        break;
      }
      case "cheat-sheet": {
        return <CheatSheetViewer content={result} topic={topic} />;
      }
      case "presenter-slides": {
        const slides = parseSlides(result);
        if (slides.length > 0) {
          return <SlidePresenter slides={slides} topic={topic} />;
        }
        break;
      }
      case "create-cornell-notes": {
        const cornellData = parseCornellNotes(result);
        if (cornellData) {
          return (
            <CornellNotesViewer
              data={cornellData}
            />
          );
        }
        break;
      }
      case "vocabulary-cards": {
        const vocabCards = parseVocabularyCards(result);
        if (vocabCards.length > 0) {
          return (
            <VocabularyCardViewer cards={vocabCards} topic={topic} gradeLevel={gradeLevel} />
          );
        }
        break;
      }
      case "practice-problems": {
        const problems = parsePracticeProblems(result);
        if (problems.length > 0) {
          return (
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t("results.problem")} {index + 1}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${problem.difficulty === "easy"
                        ? "bg-primary/20 text-primary"
                        : problem.difficulty === "medium"
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-destructive/20 text-destructive"
                        }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{problem.problem}</ReactMarkdown>
                    </div>
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                        {t("results.showSolution")}
                      </summary>
                      <div className="mt-2 p-3 bg-muted rounded-lg prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{problem.solution}</ReactMarkdown>
                        {problem.tip && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            💡 {t("results.tip")}: {problem.tip}
                          </p>
                        )}
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }
        break;
      }
    }

    // Default: render as markdown
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
    );
  };

  const getTitle = () => {
    switch (action) {
      case "generate-flashcards": return t("action.flashcards");
      case "practice-test": return t("action.practiceTest");
      case "mind-map": return t("action.mindMap");
      case "study-runner": return t("action.studyRunner");
      case "worksheet": return t("action.worksheet");
      case "matching-game": return t("action.matchingGame");
      case "speed-challenge": return "Speed Challenge";
      case "elaborative-interrogation": return "Elaborative Interrogation";
      case "explain-concept": return t("results.title.explanation");
      case "create-study-plan": return t("results.title.schedule");
      case "cheat-sheet": return "Cheat Sheet";
      case "presenter-slides": return "Presenter Slides";
      case "create-cornell-notes": return "Cornell Notes";
      case "vocabulary-cards": return "Vocabulary Cards";
      case "practice-problems": return "Practice Problems";
      default: return t("results.title.results");
    }
  };

  // For interactive modes, use full height
  const isInteractiveMode = ["practice-test", "mind-map", "study-runner", "worksheet", "matching-game", "speed-challenge", "elaborative-interrogation", "create-cornell-notes", "vocabulary-cards", "create-study-plan", "cheat-sheet", "presenter-slides"].includes(action);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getTitle()}</CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                {t("results.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToPdf({ title: topic || getTitle(), content: result, items: flashcards.length > 0 ? flashcards : undefined })}>
                {t("results.exportPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToTxt({ title: topic || getTitle(), content: result, items: flashcards.length > 0 ? flashcards : undefined })}>
                {t("results.exportTxt")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCsv({ title: topic || getTitle(), content: result, items: flashcards.length > 0 ? flashcards : undefined })}>
                {t("results.exportCsv")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isManual && (
          <div className="mb-3">
            <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-800/50">
              <span>⚠️</span>
              <span>{t("results.aiWarning")}</span>
            </div>
          </div>
        )}

        {isInteractiveMode ? (
          <div className="min-h-[500px]">
            {renderContent()}
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {renderContent()}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
