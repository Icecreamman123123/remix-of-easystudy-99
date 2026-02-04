import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type SavedFlashcard } from "@/hooks/useFlashcardDecks";
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye,
  EyeOff,
  Search,
  Move,
  Lightbulb,
  CheckCircle
} from "lucide-react";

interface MindMapProps {
  flashcards: SavedFlashcard[];
  deckTitle: string;
  onComplete?: () => void;
  useConcepts?: boolean;
}

interface Node {
  id: string;
  label: string;
  fullText: string;
  hint?: string;
  x: number;
  y: number;
  type: 'center' | 'concept' | 'definition';
  parentId?: string;
  expanded: boolean;
  color: string;
  ring: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(340, 65%, 55%)',
  'hsl(160, 55%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(200, 70%, 50%)',
  'hsl(100, 50%, 45%)',
  'hsl(45, 75%, 50%)',
  'hsl(180, 60%, 45%)',
  'hsl(300, 50%, 55%)',
  'hsl(15, 85%, 55%)',
];

export function MindMap({ flashcards, deckTitle, onComplete, useConcepts = false }: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAnswers, setShowAnswers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [revealedNodes, setRevealedNodes] = useState<Set<string>>(new Set());
  

  // Initialize nodes with proper binary tree branching layout (16 concepts max)
  useEffect(() => {
    const centerX = 150;
    const centerY = 450;
    const cardCount = Math.min(flashcards.length, 16);
    
    // Tree layout parameters
    const horizontalSpacing = 200;
    const totalHeight = 800;
    
    const newNodes: Node[] = [
      {
        id: 'center',
        label: deckTitle.length > 25 ? deckTitle.slice(0, 25) + '...' : deckTitle,
        fullText: deckTitle,
        x: centerX,
        y: centerY,
        type: 'center',
        expanded: true,
        color: 'hsl(var(--primary))',
        ring: 0,
      }
    ];

    // Store concept node positions for parent lookups
    const conceptPositions: Map<number, { x: number; y: number }> = new Map();
    
    flashcards.slice(0, 16).forEach((card, index) => {
      // Calculate tree level (0-indexed from first card)
      const level = Math.floor(Math.log2(index + 1));
      const nodesInLevel = Math.pow(2, level);
      const positionInLevel = index - (nodesInLevel - 1);
      
      // Calculate spacing for this level
      const levelHeight = totalHeight / nodesInLevel;
      const startY = centerY - (totalHeight / 2) + (levelHeight / 2);
      
      const qx = centerX + (level + 1) * horizontalSpacing;
      const qy = startY + positionInLevel * levelHeight;
      
      // Store position for child lookups
      conceptPositions.set(index, { x: qx, y: qy });
      
      const color = COLORS[index % COLORS.length];
      
      // Determine parent
      let parentId = 'center';
      if (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        const parentCard = flashcards[parentIndex];
        if (parentCard) {
          parentId = `q-${parentCard.id}`;
        }
      }
      
      // Concept node
      newNodes.push({
        id: `q-${card.id}`,
        label: card.question.length > 18 ? card.question.slice(0, 18) + '...' : card.question,
        fullText: card.question,
        hint: card.hint || undefined,
        x: qx,
        y: qy,
        type: 'concept',
        parentId,
        expanded: false,
        color,
        ring: level + 1,
      });

      // Definition node (positioned to the right)
      newNodes.push({
        id: `a-${card.id}`,
        label: card.answer.length > 20 ? card.answer.slice(0, 20) + '...' : card.answer,
        fullText: card.answer,
        x: qx + 120,
        y: qy,
        type: 'definition',
        parentId: `q-${card.id}`,
        expanded: false,
        color,
        ring: level + 1,
      });
    });

    setNodes(newNodes);
    setZoom(cardCount > 8 ? 0.5 : 0.65);
    setPan({ x: 50, y: 0 });
  }, [flashcards, deckTitle]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    const term = searchTerm.toLowerCase();
    const matchingIds = new Set<string>();
    
    nodes.forEach(node => {
      if (node.fullText.toLowerCase().includes(term)) {
        matchingIds.add(node.id);
        if (node.parentId) matchingIds.add(node.parentId);
        nodes.forEach(child => {
          if (child.parentId === node.id) matchingIds.add(child.id);
        });
      }
    });
    
    return nodes.filter(node => 
      node.type === 'center' || matchingIds.has(node.id)
    );
  }, [nodes, searchTerm]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('mind-map-bg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    const cardCount = flashcards.length;
    setZoom(cardCount > 20 ? 0.4 : cardCount > 10 ? 0.5 : 0.7);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setRevealedNodes(new Set());
  };

  const toggleAllAnswers = () => {
    if (showAnswers) {
      setRevealedNodes(new Set());
    } else {
      const allDefinitionIds = new Set(
        nodes.filter(n => n.type === 'definition').map(n => n.id)
      );
      setRevealedNodes(allDefinitionIds);
    }
    setShowAnswers(!showAnswers);
  };

  const revealedCount = revealedNodes.size;
  const totalDefinitions = nodes.filter(n => n.type === 'definition').length;

  // Calculate canvas size based on content
  const canvasWidth = 1200 + Math.ceil(flashcards.length / 8) * 400;
  const canvasHeight = 1200 + Math.ceil(flashcards.length / 8) * 400;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={resetView}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant={showAnswers ? "default" : "outline"}
                  onClick={toggleAllAnswers}
                >
                  {showAnswers ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showAnswers ? 'Hide All' : 'Show All'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showAnswers ? 'Hide all definitions' : 'Show all definitions'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4" />
        <span>{revealedCount} / {totalDefinitions} definitions revealed</span>
        <Badge variant="secondary" className="ml-2">
          {flashcards.length} concepts
        </Badge>
        <Badge variant="secondary" className="ml-auto">
          <Move className="h-3 w-3 mr-1" />
          Drag to pan • Click to expand
        </Badge>
      </div>

      {/* Mind Map Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] bg-muted/30 rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing mind-map-bg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="absolute pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            left: 0,
            top: 0,
          }}
        >
          {/* Draw connections */}
          {filteredNodes.map(node => {
            if (!node.parentId) return null;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return null;
            
            if (node.type === 'definition' && !revealedNodes.has(node.id)) return null;
            
            return (
              <path
                key={`line-${node.id}`}
                d={`M ${parent.x} ${parent.y} C ${parent.x + 50} ${parent.y}, ${node.x - 50} ${node.y}, ${node.x} ${node.y}`}
                stroke={node.color}
                strokeWidth={node.type === 'definition' ? 1.5 : 2}
                strokeOpacity={node.type === 'definition' ? 0.5 : 0.6}
                strokeDasharray={node.type === 'definition' ? '4,3' : 'none'}
                fill="none"
              />
            );
          })}
        </svg>

        {/* Draw nodes */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {filteredNodes.map(node => {
            if (node.type === 'definition' && !revealedNodes.has(node.id)) {
              return null;
            }
            
            const isExpanded = selectedNode === node.id;
            
            return (
              <div
                key={node.id}
                className={`
                  absolute transform -translate-x-1/2 -translate-y-1/2 
                  cursor-pointer transition-all duration-300 ease-out
                  ${isExpanded ? 'z-30' : 'z-10 hover:z-20'}
                `}
                style={{
                  left: node.x,
                  top: node.y,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.type === 'definition') {
                    setRevealedNodes(prev => {
                      const next = new Set(prev);
                      if (next.has(node.id)) {
                        next.delete(node.id);
                      } else {
                        next.add(node.id);
                      }
                      return next;
                    });
                  }
                  setSelectedNode(isExpanded ? null : node.id);
                }}
              >
                {node.type === 'center' ? (
                  <div 
                    className={`
                      px-5 py-3 rounded-full font-bold text-primary-foreground shadow-lg
                      transition-all duration-300 ease-out
                      ${isExpanded ? 'scale-110 shadow-xl' : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: node.color }}
                  >
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      <span className="text-sm">{isExpanded ? node.fullText : node.label}</span>
                    </div>
                  </div>
                ) : node.type === 'concept' ? (
                  <div 
                    className={`
                      rounded-lg shadow-md border-2 bg-card text-card-foreground
                      transition-all duration-300 ease-out origin-center
                      ${isExpanded 
                        ? 'px-4 py-3 max-w-[280px] shadow-xl scale-105' 
                        : 'px-3 py-2 max-w-[160px] hover:shadow-lg hover:scale-105'
                      }
                    `}
                    style={{ borderColor: node.color }}
                  >
                    <p className={`
                      font-medium leading-tight transition-all duration-300
                      ${isExpanded ? 'text-sm' : 'text-xs line-clamp-2'}
                    `}>
                      {isExpanded ? node.fullText : node.label}
                    </p>
                    {node.hint && isExpanded && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/50 animate-fade-in">
                        <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{node.hint}</p>
                      </div>
                    )}
                    {node.hint && !isExpanded && (
                      <div className="flex items-center gap-1 mt-1">
                        <Lightbulb className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    )}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-border/50 animate-fade-in">
                        {(() => {
                          const definitionId = `a-${node.id.slice(2)}`;
                          const definitionNode = nodes.find(n => n.id === definitionId);
                          const isRevealed = revealedNodes.has(definitionId);
                          
                          if (!definitionNode) return null;
                          
                          return (
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRevealedNodes(prev => {
                                    const next = new Set(prev);
                                    if (next.has(definitionId)) {
                                      next.delete(definitionId);
                                    } else {
                                      next.add(definitionId);
                                    }
                                    return next;
                                  });
                                }}
                              >
                                {isRevealed ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {isRevealed ? 'Hide' : 'Show'} Definition
                              </Button>
                              {isRevealed && (
                                <div className="p-2 bg-primary/10 rounded border border-primary/20 animate-fade-in">
                                  <p className="text-xs">{definitionNode.fullText}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className={`
                      rounded-lg shadow-sm border bg-muted/80 text-muted-foreground
                      transition-all duration-300 ease-out origin-center
                      ${isExpanded 
                        ? 'px-4 py-3 max-w-[260px] shadow-lg scale-105 bg-muted' 
                        : 'px-3 py-2 max-w-[140px] hover:shadow-md hover:scale-105'
                      }
                    `}
                    style={{ borderColor: node.color }}
                  >
                    <p className={`
                      leading-tight transition-all duration-300
                      ${isExpanded ? 'text-sm text-foreground' : 'text-xs line-clamp-2'}
                    `}>
                      {isExpanded ? node.fullText : node.label}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Definition hint nodes (clickable to reveal) */}
          {filteredNodes.filter(n => n.type === 'definition' && !revealedNodes.has(n.id)).map(node => (
            <div
              key={`hint-${node.id}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all duration-300"
              style={{
                left: node.x,
                top: node.y,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setRevealedNodes(prev => {
                  const next = new Set(prev);
                  next.add(node.id);
                  return next;
                });
              }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center bg-background/80 hover:bg-background hover:scale-110 transition-all duration-200"
                      style={{ borderColor: node.color }}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Click to reveal definition</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>

      {onComplete && (
        <div className="flex justify-center">
          <Button onClick={onComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Mind Map Study
          </Button>
        </div>
      )}
    </div>
  );
}
