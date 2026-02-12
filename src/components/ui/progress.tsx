import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
  color?: "default" | "success" | "warning" | "destructive";
}

const sizeMap = {
  sm: "h-1.5",
  default: "h-4",
  lg: "h-6",
};

const colorMap = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-destructive",
};

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, showLabel, size = "default", color = "default", ...props }, ref) => (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeMap[size],
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full w-full flex-1 transition-all", colorMap[color])}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground mix-blend-difference">
          {Math.round(value ?? 0)}%
        </span>
      )}
    </div>
  ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
