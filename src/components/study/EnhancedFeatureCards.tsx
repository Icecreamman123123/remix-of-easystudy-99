import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Repeat,
  Brain,
  Target,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const features = [
    {
      icon: Sparkles,
      title: t("feature.activeRecall"),
      description: t("feature.activeRecall.desc"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Repeat,
      title: t("feature.spacedRepetition"),
      description: t("feature.spacedRepetition.desc"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Brain,
      title: t("feature.feynman"),
      description: t("feature.feynman.desc"),
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Target,
      title: t("feature.pomodoro"),
      description: t("feature.pomodoro.desc"),
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
