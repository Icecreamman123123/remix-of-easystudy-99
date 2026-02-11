import { useCallback, useEffect, useMemo, useState } from "react";

export type StudySourceType = "text" | "file";

export interface StudySource {
  id: string;
  name: string;
  content: string;
  type: StudySourceType;
  active: boolean;
  createdAt: string;
}

const SOURCES_KEY = "easystudy-sources";
const MAX_SOURCES = 5;

function loadSources(): StudySource[] {
  try {
    const raw = localStorage.getItem(SOURCES_KEY);
    const parsed = raw ? (JSON.parse(raw) as StudySource[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSources(sources: StudySource[]) {
  localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useSources() {
  const [sources, setSources] = useState<StudySource[]>([]);

  useEffect(() => {
    setSources(loadSources());
  }, []);

  const activeSources = useMemo(() => sources.filter((s) => s.active), [sources]);

  const addSource = useCallback(
    (input: { name: string; content: string; type: StudySourceType }) => {
      if (!input.content.trim()) {
        return { ok: false as const, reason: "empty" as const };
      }

      if (sources.length >= MAX_SOURCES) {
        return { ok: false as const, reason: "limit" as const };
      }

      const next: StudySource = {
        id: makeId(input.type),
        name: input.name.trim() || `Source ${sources.length + 1}`,
        content: input.content,
        type: input.type,
        active: true,
        createdAt: new Date().toISOString(),
      };

      const updated = [...sources, next];
      setSources(updated);
      persistSources(updated);
      return { ok: true as const, source: next };
    },
    [sources]
  );

  const removeSource = useCallback(
    (id: string) => {
      const updated = sources.filter((s) => s.id !== id);
      setSources(updated);
      persistSources(updated);
    },
    [sources]
  );

  const renameSource = useCallback(
    (id: string, name: string) => {
      const updated = sources.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s));
      setSources(updated);
      persistSources(updated);
    },
    [sources]
  );

  const setActive = useCallback(
    (id: string, active: boolean) => {
      const updated = sources.map((s) => (s.id === id ? { ...s, active } : s));
      setSources(updated);
      persistSources(updated);
    },
    [sources]
  );

  const moveSource = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = sources.findIndex((s) => s.id === id);
      if (idx === -1) return;

      const nextIdx = direction === "up" ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= sources.length) return;

      const updated = [...sources];
      const [item] = updated.splice(idx, 1);
      updated.splice(nextIdx, 0, item);
      setSources(updated);
      persistSources(updated);
    },
    [sources]
  );

  const clearSources = useCallback(() => {
    setSources([]);
    persistSources([]);
  }, []);

  return {
    sources,
    activeSources,
    maxSources: MAX_SOURCES,
    addSource,
    removeSource,
    renameSource,
    setActive,
    moveSource,
    clearSources,
  };
}
