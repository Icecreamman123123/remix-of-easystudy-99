import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "default" | "forest" | "ocean" | "sunset";

interface UIContextType {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  studyTheme: Theme;
  setStudyTheme: (theme: Theme) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [studyTheme, setStudyTheme] = useState<Theme>("default");

  const toggleFocusMode = () => setIsFocusMode((prev) => !prev);

  // Apply theme-specific CSS classes to body
  useEffect(() => {
    const body = document.body;
    body.classList.remove("theme-forest", "theme-ocean", "theme-sunset");
    if (studyTheme !== "default") {
      body.classList.add(`theme-${studyTheme}`);
    }
  }, [studyTheme]);

  return (
    <UIContext.Provider value={{ isFocusMode, toggleFocusMode, studyTheme, setStudyTheme }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
};
