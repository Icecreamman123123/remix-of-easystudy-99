import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Lightbulb, BookOpen, RefreshCw, Loader2 } from "lucide-react";
import { SmartLearningInsight, WrongAnswer } from "@/hooks/useSmartLearning";

interface SmartLearningInsightsProps {
  insights: SmartLearningInsight | null;
  wrongAnswers: WrongAnswer[];
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onGenerateFocusedTest?: () => void;
  isGeneratingTest?: boolean;
}

export function SmartLearningInsights({
  insights,
  wrongAnswers,
  isAnalyzing,
  onAnalyze,
  onGenerateFocusedTest,
  isGeneratingTest,
}: SmartLearningInsightsProps) {
  if (wrongAnswers.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Smart Learning
          <Badge variant="secondary" className="ml-auto">
            {wrongAnswers.length} to review
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              You missed {wrongAnswers.length} question{wrongAnswers.length > 1 ? "s" : ""}. 
              Get AI-powered insights on what to focus on.
            </p>
            <Button onClick={onAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Weak Areas
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in-50">
            {/* Weak Areas */}
            {insights.weakAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-destructive" />
                  Areas to Focus On
                </h4>
                <ul className="space-y-1">
                  {insights.weakAreas.map((area, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                      <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {insights.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                      <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Study Tips */}
            {insights.studyTips.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-accent-foreground" />
                  Study Tips
                </h4>
                <ul className="space-y-1">
                  {insights.studyTips.slice(0, 3).map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                      <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generate Focused Test Button */}
            {onGenerateFocusedTest && (
              <Button 
                onClick={onGenerateFocusedTest} 
                className="w-full"
                disabled={isGeneratingTest}
              >
                {isGeneratingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Focused Test...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Focused Test
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
