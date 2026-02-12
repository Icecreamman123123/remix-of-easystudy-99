import * as React from "react";
import { Eye, EyeOff, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  clearable?: boolean;
  onClear?: () => void;
  showCount?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, clearable, onClear, maxLength, showCount, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value ?? "");

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const charCount = String(currentValue ?? "").length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) setInternalValue("");
      onClear?.();
    };

    const resolvedType = type === "password" ? (showPassword ? "text" : "password") : type;
    const hasRightAddon =
      type === "password" || (clearable && String(currentValue ?? "").length > 0);

    return (
      <div className="relative flex items-center w-full">
        <input
          type={resolvedType}
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-primary/50 focus:bg-background",
            hasRightAddon && "pr-9",
            className,
          )}
          ref={ref}
          {...props}
        />

        {type === "password" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {clearable && type !== "password" && String(currentValue ?? "").length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {showCount && maxLength && (
          <span
            className={cn(
              "absolute -bottom-5 right-0 text-xs text-muted-foreground",
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
Input.displayName = "Input";

export { Input };
