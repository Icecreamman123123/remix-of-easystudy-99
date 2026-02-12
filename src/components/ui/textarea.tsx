import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize, showCount, maxLength, onChange, value, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

    const [internalValue, setInternalValue] = React.useState(value ?? "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const charCount = String(currentValue ?? "").length;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
      if (autoResize && resolvedRef.current) {
        resolvedRef.current.style.height = "auto";
        resolvedRef.current.style.height = `${resolvedRef.current.scrollHeight}px`;
      }
    };

    React.useEffect(() => {
      if (autoResize && resolvedRef.current) {
        resolvedRef.current.style.height = "auto";
        resolvedRef.current.style.height = `${resolvedRef.current.scrollHeight}px`;
      }
    }, [autoResize, currentValue]);

    return (
      <div className="relative w-full">
        <textarea
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-primary/50 focus:bg-background",
            autoResize && "resize-none overflow-hidden",
            showCount && maxLength && "pb-6",
            className,
          )}
          ref={resolvedRef}
          {...props}
        />
        {showCount && maxLength && (
          <span
            className={cn(
              "absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none",
              charCount >= maxLength && "text-destructive",
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
