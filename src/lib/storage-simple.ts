// Local storage-based data management for pure Lovable setup

export interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  flashcards: Flashcard[];
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  timesCorrect: number;
  timesIncorrect: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export interface StudySession {
  id: string;
  deckId?: string;
  sessionType: string;
  cardsStudied: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds?: number;
  completedAt: string;
}

export interface StudyTemplate {
  id: string;
  name: string;
  description?: string;
  action: string;
  payload?: any;
  estimatedCount?: number;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Local storage keys
const STORAGE_KEYS = {
  DECKS: 'lovable_decks',
  SESSIONS: 'lovable_sessions',
  TEMPLATES: 'lovable_templates',
  USER_PROFILE: 'lovable_user_profile',
  STREAKS: 'lovable_streaks',
  ACHIEVEMENTS: 'lovable_achievements'
};

// Flashcard Decks
export const saveDeck = (deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'updatedAt'>): FlashcardDeck => {
  const decks = getDecks();
  const newDeck: FlashcardDeck = {
    ...deck,
    id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  decks.push(newDeck);
  localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  return newDeck;
};

export const getDecks = (): FlashcardDeck[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DECKS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const updateDeck = (id: string, updates: Partial<FlashcardDeck>): FlashcardDeck | null => {
  const decks = getDecks();
  const index = decks.findIndex(deck => deck.id === id);
  if (index === -1) return null;
  
  decks[index] = { ...decks[index], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  return decks[index];
};

export const deleteDeck = (id: string): boolean => {
  const decks = getDecks();
  const filtered = decks.filter(deck => deck.id !== id);
  if (filtered.length === decks.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(filtered));
  return true;
};

// Study Sessions
export const saveSession = (session: Omit<StudySession, 'id' | 'completedAt'>): StudySession => {
  const sessions = getSessions();
  const newSession: StudySession = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    completedAt: new Date().toISOString()
  };
  
  sessions.push(newSession);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  return newSession;
};

export const getSessions = (): StudySession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Study Templates
export const saveTemplate = (template: Omit<StudyTemplate, 'id' | 'createdAt' | 'updatedAt'>): StudyTemplate => {
  const templates = getTemplates();
  const newTemplate: StudyTemplate = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  return newTemplate;
};

export const getTemplates = (): StudyTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const updateTemplate = (id: string, updates: Partial<StudyTemplate>): StudyTemplate | null => {
  const templates = getTemplates();
  const index = templates.findIndex(template => template.id === id);
  if (index === -1) return null;
  
  templates[index] = { ...templates[index], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  return templates[index];
};

export const deleteTemplate = (id: string): boolean => {
  const templates = getTemplates();
  const filtered = templates.filter(template => template.id !== id);
  if (filtered.length === templates.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(filtered));
  return true;
};

// Utility functions
export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

export const exportData = (): string => {
  const data = {
    decks: getDecks(),
    sessions: getSessions(),
    templates: getTemplates(),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.decks) localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(data.decks));
    if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    if (data.templates) localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(data.templates));
    
    return true;
  } catch {
    return false;
  }
};
