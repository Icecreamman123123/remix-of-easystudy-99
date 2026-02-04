import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "zh" | "fr" | "es" | "hi";

export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "app.name": "EasyStudy",
    "app.tagline": "AI-powered study tools",
    "auth.signIn": "Sign In",
    "auth.signOut": "Sign Out",
    
    // Features
    "feature.activeRecall": "Active Recall",
    "feature.activeRecall.desc": "Flashcards & quizzes that test, not just review",
    "feature.spacedRepetition": "Spaced Repetition",
    "feature.spacedRepetition.desc": "Optimal review timing for long-term memory",
    "feature.feynman": "Feynman Technique",
    "feature.feynman.desc": "Understand concepts by explaining simply",
    "feature.pomodoro": "Pomodoro Method",
    "feature.pomodoro.desc": "Focused study with strategic breaks",
    
    // Study Input
    "study.whatToStudy": "What would you like to study?",
    "study.enterTopicOrSources": "Enter a topic or add multiple sources, then choose a study method",
    "study.level": "Level:",
    "study.model": "Model:",
    "study.sources": "Sources",
    "study.topic": "Topic",
    "study.addNotes": "Add Notes",
    "study.uploadFile": "Upload File",
    "study.difficulty": "Difficulty:",
    "study.questions": "Questions:",
    "study.customInstructions": "Custom AI Instructions",
    "study.addAsSource": "Add as Source",
    
    // Actions
    "action.flashcards": "Flashcards",
    "action.leitner": "Leitner",
    "action.practiceTest": "Practice Test",
    "action.worksheet": "Worksheet",
    "action.studyRunner": "Study Runner",
    "action.mindMap": "Mind Map",
    "action.quiz": "Quiz",
    "action.explain": "Explain",
    "action.studyPlan": "Study Plan",
    "action.summarize": "Summarize",
    "action.matchingGame": "Matching",
    
    // Timer
    "timer.title": "Pomodoro Timer",
    "timer.focusTime": "Focus Time",
    "timer.shortBreak": "Short Break",
    "timer.longBreak": "Long Break",
    "timer.session": "Session",
    "timer.complete4Sessions": "Complete 4 focus sessions for a long break",
    "timer.breakLocked": "Complete focus session first",
    
    // Tips
    "tips.title": "Quick Study Tips",
    "tips.1": "Test yourself before you feel ready",
    "tips.2": "Explain concepts as if teaching someone",
    "tips.3": "Space out study sessions over days",
    "tips.4": "Mix different topics in one session",
    "tips.5": "Take breaks every 25-30 minutes",
    
    // Auth prompt
    "auth.saveProgress": "Save Your Progress",
    "auth.saveProgressDesc": "Sign in to save flashcard decks and track your study progress over time.",
    "auth.createAccount": "Create Free Account",
    
    // Footer
    "footer.builtWith": "Built with evidence-based learning methods: Active Recall, Spaced Repetition, Feynman Technique & Pomodoro",
    
    // Matching Game
    "matching.title": "Matching Game",
    "matching.instructions": "Match each question with its correct answer",
    "matching.matched": "matched",
    "matching.attempts": "attempts",
    "matching.playAgain": "Play Again",
    "matching.congratulations": "Congratulations!",
    "matching.allMatched": "You matched all the pairs!",
    
    // Common
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.saveDeck": "Save Deck",
  },
  zh: {
    // Header
    "app.name": "易学习",
    "app.tagline": "AI驱动的学习工具",
    "auth.signIn": "登录",
    "auth.signOut": "退出",
    
    // Features
    "feature.activeRecall": "主动回忆",
    "feature.activeRecall.desc": "闪卡和测验，测试而非仅复习",
    "feature.spacedRepetition": "间隔重复",
    "feature.spacedRepetition.desc": "最佳复习时间以实现长期记忆",
    "feature.feynman": "费曼技巧",
    "feature.feynman.desc": "通过简单解释来理解概念",
    "feature.pomodoro": "番茄工作法",
    "feature.pomodoro.desc": "专注学习配合战略性休息",
    
    // Study Input
    "study.whatToStudy": "你想学习什么？",
    "study.enterTopicOrSources": "输入主题或添加多个来源，然后选择学习方法",
    "study.level": "级别：",
    "study.model": "模型：",
    "study.sources": "来源",
    "study.topic": "主题",
    "study.addNotes": "添加笔记",
    "study.uploadFile": "上传文件",
    "study.difficulty": "难度：",
    "study.questions": "问题数：",
    "study.customInstructions": "自定义AI指令",
    "study.addAsSource": "添加为来源",
    
    // Actions
    "action.flashcards": "闪卡",
    "action.leitner": "莱特纳",
    "action.practiceTest": "模拟测试",
    "action.worksheet": "工作表",
    "action.studyRunner": "跑酷学习",
    "action.mindMap": "思维导图",
    "action.quiz": "测验",
    "action.explain": "解释",
    "action.studyPlan": "学习计划",
    "action.summarize": "总结",
    "action.matchingGame": "配对游戏",
    
    // Timer
    "timer.title": "番茄计时器",
    "timer.focusTime": "专注时间",
    "timer.shortBreak": "短休息",
    "timer.longBreak": "长休息",
    "timer.session": "第",
    "timer.complete4Sessions": "完成4个专注阶段可获得长休息",
    "timer.breakLocked": "请先完成专注阶段",
    
    // Tips
    "tips.title": "快速学习技巧",
    "tips.1": "在你觉得准备好之前就测试自己",
    "tips.2": "像教别人一样解释概念",
    "tips.3": "将学习分散在多天进行",
    "tips.4": "在一个学习段落中混合不同主题",
    "tips.5": "每25-30分钟休息一下",
    
    // Auth prompt
    "auth.saveProgress": "保存你的进度",
    "auth.saveProgressDesc": "登录以保存闪卡组并跟踪你的学习进度。",
    "auth.createAccount": "创建免费账户",
    
    // Footer
    "footer.builtWith": "基于科学学习方法构建：主动回忆、间隔重复、费曼技巧和番茄工作法",
    
    // Matching Game
    "matching.title": "配对游戏",
    "matching.instructions": "将每个问题与正确答案匹配",
    "matching.matched": "已匹配",
    "matching.attempts": "次尝试",
    "matching.playAgain": "再玩一次",
    "matching.congratulations": "恭喜！",
    "matching.allMatched": "你匹配了所有配对！",
    
    // Common
    "common.close": "关闭",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.saveDeck": "保存卡组",
  },
  fr: {
    // Header
    "app.name": "EasyStudy",
    "app.tagline": "Outils d'étude propulsés par l'IA",
    "auth.signIn": "Connexion",
    "auth.signOut": "Déconnexion",
    
    // Features
    "feature.activeRecall": "Rappel Actif",
    "feature.activeRecall.desc": "Cartes et quiz qui testent, pas seulement réviser",
    "feature.spacedRepetition": "Répétition Espacée",
    "feature.spacedRepetition.desc": "Timing optimal pour la mémoire à long terme",
    "feature.feynman": "Technique Feynman",
    "feature.feynman.desc": "Comprendre en expliquant simplement",
    "feature.pomodoro": "Méthode Pomodoro",
    "feature.pomodoro.desc": "Étude concentrée avec pauses stratégiques",
    
    // Study Input
    "study.whatToStudy": "Que voulez-vous étudier?",
    "study.enterTopicOrSources": "Entrez un sujet ou ajoutez des sources, puis choisissez une méthode",
    "study.level": "Niveau:",
    "study.model": "Modèle:",
    "study.sources": "Sources",
    "study.topic": "Sujet",
    "study.addNotes": "Ajouter Notes",
    "study.uploadFile": "Téléverser",
    "study.difficulty": "Difficulté:",
    "study.questions": "Questions:",
    "study.customInstructions": "Instructions IA personnalisées",
    "study.addAsSource": "Ajouter comme source",
    
    // Actions
    "action.flashcards": "Cartes",
    "action.leitner": "Leitner",
    "action.practiceTest": "Test",
    "action.worksheet": "Feuille",
    "action.studyRunner": "Runner",
    "action.mindMap": "Carte mentale",
    "action.quiz": "Quiz",
    "action.explain": "Expliquer",
    "action.studyPlan": "Plan d'étude",
    "action.summarize": "Résumer",
    "action.matchingGame": "Associer",
    
    // Timer
    "timer.title": "Minuteur Pomodoro",
    "timer.focusTime": "Temps de Focus",
    "timer.shortBreak": "Pause Courte",
    "timer.longBreak": "Pause Longue",
    "timer.session": "Session",
    "timer.complete4Sessions": "Complétez 4 sessions pour une pause longue",
    "timer.breakLocked": "Terminez d'abord la session de focus",
    
    // Tips
    "tips.title": "Conseils d'étude rapides",
    "tips.1": "Testez-vous avant de vous sentir prêt",
    "tips.2": "Expliquez les concepts comme si vous enseigniez",
    "tips.3": "Espacez vos sessions sur plusieurs jours",
    "tips.4": "Mélangez différents sujets en une session",
    "tips.5": "Faites des pauses toutes les 25-30 minutes",
    
    // Auth prompt
    "auth.saveProgress": "Sauvegardez votre progression",
    "auth.saveProgressDesc": "Connectez-vous pour sauvegarder vos cartes et suivre vos progrès.",
    "auth.createAccount": "Créer un compte gratuit",
    
    // Footer
    "footer.builtWith": "Construit avec des méthodes d'apprentissage éprouvées: Rappel Actif, Répétition Espacée, Technique Feynman et Pomodoro",
    
    // Matching Game
    "matching.title": "Jeu d'association",
    "matching.instructions": "Associez chaque question à sa réponse correcte",
    "matching.matched": "associées",
    "matching.attempts": "tentatives",
    "matching.playAgain": "Rejouer",
    "matching.congratulations": "Félicitations!",
    "matching.allMatched": "Vous avez associé toutes les paires!",
    
    // Common
    "common.close": "Fermer",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.saveDeck": "Enregistrer le paquet",
  },
  es: {
    // Header
    "app.name": "EasyStudy",
    "app.tagline": "Herramientas de estudio con IA",
    "auth.signIn": "Iniciar sesión",
    "auth.signOut": "Cerrar sesión",
    
    // Features
    "feature.activeRecall": "Recuerdo Activo",
    "feature.activeRecall.desc": "Tarjetas y cuestionarios que evalúan, no solo repasan",
    "feature.spacedRepetition": "Repetición Espaciada",
    "feature.spacedRepetition.desc": "Tiempo óptimo de revisión para memoria a largo plazo",
    "feature.feynman": "Técnica Feynman",
    "feature.feynman.desc": "Comprender conceptos explicándolos de forma simple",
    "feature.pomodoro": "Método Pomodoro",
    "feature.pomodoro.desc": "Estudio enfocado con descansos estratégicos",
    
    // Study Input
    "study.whatToStudy": "¿Qué te gustaría estudiar?",
    "study.enterTopicOrSources": "Ingresa un tema o añade fuentes, luego elige un método de estudio",
    "study.level": "Nivel:",
    "study.model": "Modelo:",
    "study.sources": "Fuentes",
    "study.topic": "Tema",
    "study.addNotes": "Añadir Notas",
    "study.uploadFile": "Subir Archivo",
    "study.difficulty": "Dificultad:",
    "study.questions": "Preguntas:",
    "study.customInstructions": "Instrucciones personalizadas para IA",
    "study.addAsSource": "Añadir como fuente",
    
    // Actions
    "action.flashcards": "Tarjetas",
    "action.leitner": "Leitner",
    "action.practiceTest": "Práctica",
    "action.worksheet": "Hoja",
    "action.studyRunner": "Runner",
    "action.mindMap": "Mapa Mental",
    "action.quiz": "Quiz",
    "action.explain": "Explicar",
    "action.studyPlan": "Plan de estudio",
    "action.summarize": "Resumir",
    "action.matchingGame": "Emparejar",
    
    // Timer
    "timer.title": "Temporizador Pomodoro",
    "timer.focusTime": "Tiempo de Enfoque",
    "timer.shortBreak": "Descanso Corto",
    "timer.longBreak": "Descanso Largo",
    "timer.session": "Sesión",
    "timer.complete4Sessions": "Completa 4 sesiones para un descanso largo",
    "timer.breakLocked": "Completa primero la sesión de enfoque",
    
    // Tips
    "tips.title": "Consejos rápidos de estudio",
    "tips.1": "Ponte a prueba antes de sentirte listo",
    "tips.2": "Explica conceptos como si enseñaras a alguien",
    "tips.3": "Distribuye las sesiones de estudio en varios días",
    "tips.4": "Mezcla diferentes temas en una sesión",
    "tips.5": "Toma descansos cada 25-30 minutos",
    
    // Auth prompt
    "auth.saveProgress": "Guarda tu progreso",
    "auth.saveProgressDesc": "Inicia sesión para guardar mazos de tarjetas y seguir tu progreso.",
    "auth.createAccount": "Crear cuenta gratis",
    
    // Footer
    "footer.builtWith": "Construido con métodos de aprendizaje basados en evidencia: Recuerdo Activo, Repetición Espaciada, Técnica Feynman y Pomodoro",
    
    // Matching Game
    "matching.title": "Juego de Emparejar",
    "matching.instructions": "Empareja cada pregunta con su respuesta correcta",
    "matching.matched": "emparejadas",
    "matching.attempts": "intentos",
    "matching.playAgain": "Jugar de nuevo",
    "matching.congratulations": "¡Felicidades!",
    "matching.allMatched": "¡Emparejaste todas las parejas!",
    
    // Common
    "common.close": "Cerrar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.saveDeck": "Guardar mazo",
  },
  hi: {
    // Header
    "app.name": "ईज़ी स्टडी",
    "app.tagline": "AI-संचालित अध्ययन उपकरण",
    "auth.signIn": "साइन इन",
    "auth.signOut": "साइन आउट",
    
    // Features
    "feature.activeRecall": "सक्रिय स्मरण",
    "feature.activeRecall.desc": "फ्लैशकार्ड और क्विज़ जो परीक्षा लेते हैं",
    "feature.spacedRepetition": "स्पेस्ड रिपीटिशन",
    "feature.spacedRepetition.desc": "दीर्घकालिक स्मृति के लिए इष्टतम समय",
    "feature.feynman": "फेनमैन तकनीक",
    "feature.feynman.desc": "सरल व्याख्या से अवधारणाएं समझें",
    "feature.pomodoro": "पोमोडोरो विधि",
    "feature.pomodoro.desc": "रणनीतिक ब्रेक के साथ केंद्रित अध्ययन",
    
    // Study Input
    "study.whatToStudy": "आप क्या पढ़ना चाहेंगे?",
    "study.enterTopicOrSources": "विषय दर्ज करें या स्रोत जोड़ें, फिर अध्ययन विधि चुनें",
    "study.level": "स्तर:",
    "study.model": "मॉडल:",
    "study.sources": "स्रोत",
    "study.topic": "विषय",
    "study.addNotes": "नोट्स जोड़ें",
    "study.uploadFile": "फ़ाइल अपलोड",
    "study.difficulty": "कठिनाई:",
    "study.questions": "प्रश्न:",
    "study.customInstructions": "कस्टम AI निर्देश",
    "study.addAsSource": "स्रोत के रूप में जोड़ें",
    
    // Actions
    "action.flashcards": "फ्लैशकार्ड",
    "action.leitner": "लाइटनर",
    "action.practiceTest": "अभ्यास परीक्षा",
    "action.worksheet": "वर्कशीट",
    "action.studyRunner": "स्टडी रनर",
    "action.mindMap": "माइंड मैप",
    "action.quiz": "क्विज़",
    "action.explain": "व्याख्या",
    "action.studyPlan": "अध्ययन योजना",
    "action.summarize": "सारांश",
    "action.matchingGame": "मिलान",
    
    // Timer
    "timer.title": "पोमोडोरो टाइमर",
    "timer.focusTime": "फोकस समय",
    "timer.shortBreak": "छोटा ब्रेक",
    "timer.longBreak": "लंबा ब्रेक",
    "timer.session": "सत्र",
    "timer.complete4Sessions": "लंबे ब्रेक के लिए 4 फोकस सत्र पूरे करें",
    "timer.breakLocked": "पहले फोकस सत्र पूरा करें",
    
    // Tips
    "tips.title": "त्वरित अध्ययन सुझाव",
    "tips.1": "तैयार महसूस करने से पहले खुद को परखें",
    "tips.2": "अवधारणाओं को सिखाते हुए समझाएं",
    "tips.3": "अध्ययन सत्रों को कई दिनों में बांटें",
    "tips.4": "एक सत्र में विभिन्न विषय मिलाएं",
    "tips.5": "हर 25-30 मिनट में ब्रेक लें",
    
    // Auth prompt
    "auth.saveProgress": "अपनी प्रगति सहेजें",
    "auth.saveProgressDesc": "फ्लैशकार्ड डेक सहेजने और प्रगति ट्रैक करने के लिए साइन इन करें।",
    "auth.createAccount": "मुफ्त खाता बनाएं",
    
    // Footer
    "footer.builtWith": "साक्ष्य-आधारित शिक्षण विधियों से निर्मित: सक्रिय स्मरण, स्पेस्ड रिपीटिशन, फेनमैन तकनीक और पोमोडोरो",
    
    // Matching Game
    "matching.title": "मिलान खेल",
    "matching.instructions": "प्रत्येक प्रश्न को उसके सही उत्तर से मिलाएं",
    "matching.matched": "मिलान",
    "matching.attempts": "प्रयास",
    "matching.playAgain": "फिर से खेलें",
    "matching.congratulations": "बधाई हो!",
    "matching.allMatched": "आपने सभी जोड़े मिला दिए!",
    
    // Common
    "common.close": "बंद करें",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.saveDeck": "डेक सहेजें",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("language");
    return (stored as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
