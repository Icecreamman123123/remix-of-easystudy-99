import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Repeat,
  Brain,
  Target,
} from "lucide-react";

interface EnhancedFeatureCardProps {
  icon: typeof Sparkles;
  title: string;
  description: string;
  index?: number;
  accentColor?: string;
}

export function EnhancedFeatureCard({
  icon: Icon,
  title,
  description,
  index = 0,
  accentColor = "from-blue-500 to-cyan-500",
}: EnhancedFeatureCardProps) {
  return (
    <Card
      className="relative overflow-hidden p-4 hover:shadow-lg transition-all duration-300 border-l-4 hover:scale-105 cursor-default group"
      style={{
        borderLeftColor: `hsl(${index * 90}, 70%, 50%)`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg bg-gradient-to-br ${accentColor} text-white shrink-0 group-hover:shadow-lg transition-shadow`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function CompactFeatureBanner() {
  const features = [
    {
      icon: Sparkles,
      title: "Active Recall",
      description: "Test yourself, not just review",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Repeat,
      title: "Spaced Repetition",
      description: "Optimal review timing",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Brain,
      title: "Feynman Technique",
      description: "Explain to understand",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Target,
      title: "Pomodoro Method",
      description: "Focused study sessions",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-background via-primary/5 to-background border-b">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <EnhancedFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
              accentColor={feature.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
