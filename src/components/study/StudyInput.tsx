import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  ClipboardList, 
  FileText, 
  Lightbulb, 
  Loader2,
  Network,
  Target,
  Gamepad2,
  GraduationCap,
  ChevronDown,
  Settings2,
  Gauge,
  Hash,
  Cpu,
  X,
  Plus,
  FileEdit,
  Puzzle,
  Star,
  Trash2
} from "lucide-react";
import { callStudyAI, StudyAction, AIModel, AIExpertise } from "@/lib/study-api";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "./FileDropzone";

interface StudyInputProps {
  onResult: (action: StudyAction, result: string, topic?: string) => void;
}

interface Source {
  id: string;
  name: string;
  content: string;
  type: "text" | "file";
}

interface FavoritePreset {
  id: string;
  name: string;
  model: AIModel;
  expertise: AIExpertise;
}

interface StudyInputProps {
  onResult: (action: StudyAction, result: string, topic?: string) => void;
}

interface Source {
  id: string;
  name: string;
  content: string;
  type: "text" | "file";
}

const GRADE_LEVELS = [
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
  { value: "university", label: "University" },
  { value: "phd", label: "PhD Level" },
];

const AI_MODELS: { value: AIModel; label: string; description: string }[] = [
  { value: "gemini-flash", label: "Gemini Flash", description: "Fast & efficient" },
  { value: "gemini-pro", label: "Gemini Pro", description: "Advanced reasoning" },
  { value: "gemini-3-pro", label: "Gemini 3 Pro", description: "Next-gen flagship" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Balanced speed" },
  { value: "gemini-flash-lite", label: "Gemini Flash Lite", description: "Ultra fast" },
  { value: "gpt-5-nano", label: "GPT-5 Nano", description: "Lightweight & quick" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Balanced performance" },
  { value: "gpt-5", label: "GPT-5", description: "Most capable" },
  { value: "gpt-5.2", label: "GPT-5.2", description: "Latest & greatest" },
  { value: "gpt-4", label: "GPT-4", description: "Classic reliable" },
  { value: "claude-3", label: "Claude 3", description: "Creative writing" },
];

const AI_EXPERTISE: { value: AIExpertise; label: string; icon: string }[] = [
  { value: "general", label: "General", icon: "🎯" },
  { value: "math", label: "Math", icon: "🔢" },
  { value: "science", label: "Science", icon: "🔬" },
  { value: "language", label: "Language Arts", icon: "📝" },
  { value: "history", label: "History", icon: "🏛️" },
  { value: "code", label: "Programming", icon: "💻" },
  { value: "medicine", label: "Medicine", icon: "🏥" },
  { value: "business", label: "Business", icon: "📊" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "psychology", label: "Psychology", icon: "🧠" },
  { value: "law", label: "Law", icon: "⚖️" },
];

const DIFFICULTY_LABELS = ["Easy", "Medium", "Hard", "Expert"];
const LENGTH_OPTIONS = [
  { value: 8, label: "Short (8)" },
  { value: 16, label: "Normal (16)" },
  { value: 24, label: "Long (24)" },
];

const ACTIONS: { action: StudyAction; icon: typeof BookOpen; label: string; description: string }[] = [
  { action: "generate-flashcards", icon: BookOpen, label: "Flashcards", description: "Create active recall cards" },
  { action: "matching-game", icon: Puzzle, label: "Matching", description: "Match Q&A pairs" },
  { action: "practice-test", icon: Target, label: "Practice Test", description: "Mixed question types" },
  { action: "worksheet", icon: FileEdit, label: "Worksheet", description: "Printable worksheet" },
  { action: "study-runner", icon: Gamepad2, label: "Study Runner", description: "Endless runner game" },
  { action: "mind-map", icon: Network, label: "Mind Map", description: "Visual concept mapping" },
  { action: "generate-quiz", icon: ClipboardList, label: "Quiz", description: "Test your knowledge" },
  { action: "explain-concept", icon: Lightbulb, label: "Explain", description: "Simple explanations" },
  { action: "create-study-plan", icon: Brain, label: "Study Plan", description: "Weekly schedule" },
  { action: "summarize", icon: FileText, label: "Summarize", description: "Key points summary" },
];

// Draggable Slider Component with smooth mouse following
function DraggableSlider({ 
  value, 
  onChange, 
  max, 
  labels 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  max: number;
  labels: string[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValue = (clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(percentage * max);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newValue = calculateValue(e.clientX);
    onChange(newValue);

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = calculateValue(e.clientX);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const newValue = calculateValue(touch.clientX);
    onChange(newValue);

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newValue = calculateValue(touch.clientX);
      onChange(newValue);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  const percentage = (value / max) * 100;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="relative h-6 w-full cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 h-2 w-full rounded-full bg-secondary" />
        
        {/* Filled track */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-primary transition-all duration-75 ease-out"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-primary bg-background shadow-lg transition-transform duration-75 ease-out ${
            isDragging ? "scale-110 ring-2 ring-primary/50" : ""
          }`}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
      
      {/* Labels below */}
      <div className="flex justify-between mt-1 px-0.5">
        {labels.map((label, i) => (
          <div 
            key={label}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              i <= value ? "bg-primary scale-100" : "bg-muted-foreground/30 scale-75"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

// Load favorites from localStorage
const FAVORITES_KEY = "easystudy-favorites";

function loadFavorites(): FavoritePreset[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoritePreset[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function StudyInput({ onResult }: StudyInputProps) {
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [currentTextContent, setCurrentTextContent] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [gradeLevel, setGradeLevel] = useState("8");
  const [aiModel, setAiModel] = useState<AIModel>("gemini-flash");
  const [aiExpertise, setAiExpertise] = useState<AIExpertise>("general");
  const [difficulty, setDifficulty] = useState(1); // 0-3 (Easy to Expert)
  const [questionCount, setQuestionCount] = useState(16); // 8, 16, or 24
  const [loading, setLoading] = useState<StudyAction | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [favorites, setFavorites] = useState<FavoritePreset[]>([]);
  const { toast } = useToast();

  // Load favorites on mount
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const addToFavorites = () => {
    const expertiseLabel = AI_EXPERTISE.find(e => e.value === aiExpertise)?.label || aiExpertise;
    const modelLabel = AI_MODELS.find(m => m.value === aiModel)?.label || aiModel;
    
    const newFavorite: FavoritePreset = {
      id: `fav-${Date.now()}`,
      name: `${modelLabel} + ${expertiseLabel}`,
      model: aiModel,
      expertise: aiExpertise,
    };
    
    // Check if already exists
    const exists = favorites.some(f => f.model === aiModel && f.expertise === aiExpertise);
    if (exists) {
      toast({
        title: "Already saved",
        description: "This combination is already in your favorites.",
      });
      return;
    }
    
    const updated = [...favorites, newFavorite];
    setFavorites(updated);
    saveFavorites(updated);
    toast({
      title: "Favorite saved!",
      description: `${newFavorite.name} added to favorites.`,
    });
  };

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
    toast({
      title: "Removed",
      description: "Favorite preset removed.",
    });
  };

  const applyFavorite = (favorite: FavoritePreset) => {
    setAiModel(favorite.model);
    setAiExpertise(favorite.expertise);
    toast({
      title: "Preset applied",
      description: `Using ${favorite.name}`,
    });
  };

  const addTextSource = () => {
    if (!currentTextContent.trim()) return;
    const newSource: Source = {
      id: `text-${Date.now()}`,
      name: `Notes ${sources.length + 1}`,
      content: currentTextContent,
      type: "text"
    };
    setSources(prev => [...prev, newSource]);
    setCurrentTextContent("");
    toast({
      title: "Source added",
      description: "Text content has been added as a source.",
    });
  };

  const addFileSource = (text: string, fileName: string) => {
    const newSource: Source = {
      id: `file-${Date.now()}`,
      name: fileName,
      content: text,
      type: "file"
    };
    setSources(prev => [...prev, newSource]);
    if (!topic) {
      setTopic(fileName.replace(/\.[^/.]+$/, ""));
    }
    toast({
      title: "File added",
      description: `${fileName} has been added as a source.`,
    });
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const getCombinedContent = () => {
    const allContent = sources.map(s => `--- ${s.name} ---\n${s.content}`).join("\n\n");
    return allContent;
  };

  const handleAction = async (action: StudyAction) => {
    const combinedContent = getCombinedContent();
    
    if (!topic.trim() && !combinedContent.trim()) {
      toast({
        title: "Enter content",
        description: "Please enter a topic or add study sources.",
        variant: "destructive",
      });
      return;
    }

    setLoading(action);
    try {
      // For Practice Test, Study Runner, and Matching Game - we generate flashcards first
      // For Mind Map, we generate concepts
      let effectiveAction: StudyAction = action;
      if (["practice-test", "study-runner", "matching-game"].includes(action)) {
        effectiveAction = "generate-flashcards";
      } else if (action === "mind-map") {
        effectiveAction = "generate-concepts";
      }
      
      // Build instructions with difficulty and count
      const difficultyText = DIFFICULTY_LABELS[difficulty].toLowerCase();
      const countInstruction = `Generate exactly ${questionCount} items.`;
      const difficultyInstruction = `Difficulty level: ${difficultyText}. ${
        difficulty === 0 ? "Use simple vocabulary and basic concepts." :
        difficulty === 1 ? "Use standard complexity appropriate for the grade level." :
        difficulty === 2 ? "Include challenging questions that require deeper understanding." :
        "Include highly complex questions requiring expert-level analysis and synthesis."
      }`;
      
      // Combine content with custom instructions if provided
      const allInstructions = [
        countInstruction,
        difficultyInstruction,
        customInstructions.trim()
      ].filter(Boolean).join("\n");
      
      const contentWithInstructions = `${combinedContent}\n\n[Instructions: ${allInstructions}]`;
      
      const result = await callStudyAI(effectiveAction, contentWithInstructions, topic, difficultyText, gradeLevel, aiModel, aiExpertise);
      onResult(action, result, topic);
      toast({
        title: "Success!",
        description: `Generated ${action.replace(/-/g, " ")} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>What would you like to study?</CardTitle>
        <CardDescription>
          Enter a topic or add multiple sources, then choose a study method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grade Level and AI Model Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="grade-level" className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <GraduationCap className="h-4 w-4" />
              Level:
            </Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger id="grade-level" className="w-[140px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="ai-model" className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <Cpu className="h-4 w-4" />
              Model:
            </Label>
            <Select value={aiModel} onValueChange={(v) => setAiModel(v as AIModel)}>
              <SelectTrigger id="ai-model" className="w-[140px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map(({ value, label, description }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col">
                      <span>{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expertise Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Expertise: <span className="text-primary">{AI_EXPERTISE.find(e => e.value === aiExpertise)?.label}</span>
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={addToFavorites}
              className="h-7 text-xs gap-1 hover:text-primary"
            >
              <Star className="h-3.5 w-3.5" />
              Save Combo
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AI_EXPERTISE.map(({ value, label, icon }) => (
              <Button
                key={value}
                size="sm"
                variant={aiExpertise === value ? "default" : "outline"}
                onClick={() => setAiExpertise(value)}
                className="text-xs h-8 transition-all duration-200"
              >
                <span className="mr-1">{icon}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Favorite Presets
            </Label>
            <div className="flex flex-wrap gap-2">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="flex items-center">
                  <Button
                    size="sm"
                    variant={aiModel === favorite.model && aiExpertise === favorite.expertise ? "default" : "secondary"}
                    onClick={() => applyFavorite(favorite)}
                    className="text-xs h-7 pr-1 rounded-r-none"
                  >
                    {favorite.name}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => removeFavorite(favorite.id)}
                    className="h-7 w-7 p-0 rounded-l-none border-l border-border hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources Display */}
        {sources.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <Label className="text-sm font-medium">Sources ({sources.length})</Label>
            <div className="flex flex-wrap gap-2">
              {sources.map(source => (
                <Badge 
                  key={source.id} 
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {source.type === "file" ? <FileText className="h-3 w-3" /> : <FileEdit className="h-3 w-3" />}
                  <span className="max-w-[150px] truncate">{source.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({(source.content.length / 1000).toFixed(1)}k)
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/20"
                    onClick={() => removeSource(source.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="topic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="topic">Topic</TabsTrigger>
            <TabsTrigger value="content">Add Notes</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="topic" className="space-y-2">
            <Input
              placeholder="e.g., Photosynthesis, World War II, Calculus derivatives..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </TabsContent>
          <TabsContent value="content" className="space-y-2">
            <Textarea
              placeholder="Paste your notes, textbook excerpts, or lecture content here..."
              value={currentTextContent}
              onChange={(e) => setCurrentTextContent(e.target.value)}
              className="min-h-[120px]"
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={addTextSource}
              disabled={!currentTextContent.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add as Source
            </Button>
          </TabsContent>
          <TabsContent value="upload" className="space-y-2">
            <FileDropzone onTextExtracted={addFileSource} />
          </TabsContent>
        </Tabs>

        {/* Difficulty and Length Controls with Smooth Slider */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4" />
              Difficulty: <span className="font-bold text-primary transition-all duration-300">{DIFFICULTY_LABELS[difficulty]}</span>
            </Label>
            <DraggableSlider 
              value={difficulty} 
              onChange={setDifficulty} 
              max={3} 
              labels={DIFFICULTY_LABELS} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4" />
              Questions: <span className="font-bold text-primary">{questionCount}</span>
            </Label>
            <div className="flex gap-1">
              {LENGTH_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={questionCount === value ? "default" : "outline"}
                  onClick={() => setQuestionCount(value)}
                  className="flex-1 text-xs transition-all duration-200"
                >
                  {label.split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Instructions Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                Custom AI Instructions
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              placeholder="Add custom instructions for the AI (e.g., 'Focus on practical examples', 'Include mnemonics', 'Make questions more challenging')..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[80px]"
            />
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ACTIONS.map(({ action, icon: Icon, label, description }) => (
            <Button
              key={action}
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1"
              onClick={() => handleAction(action)}
              disabled={loading !== null}
            >
              {loading === action ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="font-medium text-xs">{label}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
