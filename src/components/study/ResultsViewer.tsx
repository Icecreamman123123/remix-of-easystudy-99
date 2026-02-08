import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { StudyAction, parseFlashcards, parseQuiz, parsePracticeProblems, parseConcepts, parseWorksheet, Flashcard, Concept } from "@/lib/study-api";
import { FlashcardViewer } from "./FlashcardViewer";
import { QuizViewer } from "./QuizViewer";
import { PracticeTest } from "./PracticeTest";
import { MindMap } from "./MindMap";
import { SubwaySurferGame } from "./SubwaySurferGame";
import { WorksheetViewer } from "./WorksheetViewer";
import { MatchingGame } from "./MatchingGame";
 import { SpeedChallenge } from "./SpeedChallenge";
 import { ElaborativeInterrogation } from "./ElaborativeInterrogation";
import { ExportPdfButton } from "./ExportPdfButton";
import ReactMarkdown from "react-markdown";

interface ResultsViewerProps {
  action: StudyAction;
  result: string;
  onClose: () => void;
  topic?: string;
  isManual?: boolean;
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

export function ResultsViewer({ action, result, onClose, topic, isManual }: ResultsViewerProps) {
  const [completed, setCompleted] = useState(false);
  const flashcards = ["generate-flashcards", "practice-test", "study-runner", "matching-game", "speed-challenge"].includes(action) 
    ? parseFlashcards(result) 
    : [];

  const handleComplete = (results?: { correct: number; total: number }) => {
    setCompleted(true);
  };

  const renderContent = () => {
    switch (action) {
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
        // Mind map now uses concepts instead of flashcards
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
      case "generate-quiz": {
        const questions = parseQuiz(result);
        if (questions.length > 0) {
          return <QuizViewer questions={questions} topic={topic} disableSmartLearning={isManual} />;
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
                      <CardTitle className="text-base">Problem {index + 1}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        problem.difficulty === "easy" 
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
                        Show Solution
                      </summary>
                      <div className="mt-2 p-3 bg-muted rounded-lg prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{problem.solution}</ReactMarkdown>
                        {problem.tip && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            💡 Tip: {problem.tip}
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
      case "generate-flashcards": return "Flashcards";
      case "practice-test": return "Practice Test";
      case "mind-map": return "Mind Map";
      case "generate-quiz": return "Quiz";
      case "study-runner": return "Study Runner";
      case "worksheet": return "Worksheet";
      case "matching-game": return "Matching Game";
       case "speed-challenge": return "Speed Challenge";
       case "elaborative-interrogation": return "Elaborative Interrogation";
      case "explain-concept": return "Concept Explanation";
      case "create-study-plan": return "Study Schedule";
      case "summarize": return "Summary";
      case "practice-problems": return "Practice Problems";
      default: return "Results";
    }
  };

  // For interactive modes, use full height
   const isInteractiveMode = ["practice-test", "mind-map", "study-runner", "worksheet", "matching-game", "speed-challenge", "elaborative-interrogation"].includes(action);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getTitle()}</CardTitle>
        <div className="flex items-center gap-2">
          {flashcards.length > 0 && (
            <ExportPdfButton flashcards={flashcards} title={topic || getTitle()} />
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isManual && (
          <div className="mb-3">
            <div className="inline-block rounded px-2 py-1 bg-yellow-50 text-yellow-800 text-xs">⚠️ AI may be inaccurate — please double-check sources before studying.</div>
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
