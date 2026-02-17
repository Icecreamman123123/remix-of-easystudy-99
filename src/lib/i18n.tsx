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
    "feature.activeRecall.desc": "Test yourself, not just review",
    "feature.spacedRepetition": "Spaced Repetition",
    "feature.spacedRepetition.desc": "Optimal review timing",
    "feature.feynman": "Feynman Technique",
    "feature.feynman.desc": "Explain to understand",
    "feature.pomodoro": "Pomodoro Method",
    "feature.pomodoro.desc": "Focused study sessions",

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

    "action.flashcards": "Flashcards",
    "action.flashcards.desc": "Create active recall cards",
    "action.leitner": "Leitner",
    "action.practiceTest": "Practice Test",
    "action.practiceTest.desc": "Mixed question types",
    "action.worksheet": "Worksheet",
    "action.worksheet.desc": "Printable worksheet",
    "action.studyRunner": "Study Runner",
    "action.studyRunner.desc": "Endless runner game",
    "action.mindMap": "Mind Map",
    "action.mindMap.desc": "Visual concept mapping",
    "action.quiz": "Quiz",
    "action.explain": "Explain",
    "action.explain.desc": "Simple explanations",
    "action.studyPlan": "Study Plan",
    "action.studyPlan.desc": "Weekly schedule",
    "action.summarize": "Summarize",
    "action.matchingGame": "Matching",
    "action.matchingGame.desc": "Match Q&A pairs",
    "action.vocabCards": "Vocab Cards",
    "action.vocabCards.desc": "Word cards with drawings",
    "action.speedChallenge": "Speed Challenge",
    "action.speedChallenge.desc": "Timed blitz mode",
    "action.elaborative": "Why/How",
    "action.elaborative.desc": "Deep understanding",
    "action.cheatSheet": "Cheat Sheet",
    "action.cheatSheet.desc": "Formulas & key concepts",
    "action.slides": "Slides",
    "action.slides.desc": "Presenter slide deck",
    "action.cornell": "Cornell Notes",
    "action.cornell.desc": "Structured notes & cues",

    // Study Labels
    "study.placeholder.topic": "e.g., Photosynthesis, World War II, Calculus derivatives...",
    "study.placeholder.notes": "Paste your notes, textbook excerpts, or lecture content here...",
    "study.placeholder.custom": "Tell the AI exactly what you want!",
    "study.saveCombo": "Save Combo",
    "study.favorites": "Favorite Presets",
    "study.wiki": "Include Wikipedia",
    "study.wikiDisabled": "AI search disabled — using uploaded file context only",
    "study.aiWarning": "AI may be inaccurate — please double-check sources and verify facts.",
    "study.diffLength": "Difficulty & Length",
    "study.aiCustom": "AI Customization",
    "study.adaptive": "Adaptive Difficulty",
    "study.useOnlyFile": "Use only this file as context (no AI search)",
    "study.generateCard": "Generate Card",

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

    // Explore Sets
    "explore.title": "Explore Study Sets",
    "explore.upload": "Upload Set",
    "explore.official": "Official",
    "explore.community": "Community",
    "explore.standardTemplates": "Standard Templates",
    "explore.communityCreators": "Community Creators",
    "explore.noCommunitySets": "No community sets have been shared yet. Be the first!",
    "explore.items": "items",
    "explore.use": "Use",
    "explore.by": "by",
    "explore.loading": "Loading community sets...",

    // Template Dialog
    "template.use": "Use Template:",
    "template.ready": "Study Materials Ready",
    "template.topic": "Topic or Subject",
    "template.grade": "Learning Level",
    "template.generating": "Generating...",
    "template.generate": "Generate",

    // Results Viewer
    "results.export": "Export",
    "results.exportPdf": "Export as PDF",
    "results.exportTxt": "Export as TXT",
    "results.exportCsv": "Export as CSV",
    "results.aiWarning": "AI may be inaccurate — please double-check sources before studying.",
    "results.showSolution": "Show Solution",
    "results.problem": "Problem",
    "results.tip": "Tip",
    "results.title.schedule": "Study Schedule",
    "results.title.explanation": "Concept Explanation",
    "results.title.results": "Results",

    // Templates Manager
    "manager.title": "Study Templates",
    "manager.desc": "Create, manage and share your custom study workflows.",
    "manager.myLibrary": "My Library",
    "manager.newTemplate": "+ New Template",
    "manager.signInRequired": "Sign In Required",
    "manager.signInDesc": "You must be signed in to create and save study templates to the cloud.",
    "manager.noTemplates": "No templates found",
    "manager.createFirst": "Create one to get started",
    "manager.signInToView": "Sign in to view your templates",
    "manager.public": "Public",
    "manager.communityExamples": "Community Examples",
    "manager.editTemplate": "Edit Template",
    "manager.newTemplateHeader": "New Template",
    "manager.configureDesc": "Configure how your content is generated.",
    "manager.name": "Template Name",
    "manager.actionType": "Action Type",
    "manager.description": "Description",
    "manager.payload": "Configuration (JSON Payload)",
    "manager.format": "Format",
    "manager.invalidJson": "Invalid JSON",
    "manager.estCards": "Est. Cards/Items",
    "manager.publicTemplate": "Public Template",
    "manager.shareCommunity": "Share with the community",
    "manager.deleteTemplate": "Delete Template",
    "manager.saveChanges": "Save Changes",
    "manager.createTemplate": "Create Template",

    // Index
    "index.manageTemplates": "Manage Templates",
    "index.exploreSets": "Explore Sets",
    "index.exitFocus": "Exit Focus",
    "index.focusMode": "Focus Mode",
    "index.premium": "Premium Student",
    "index.linkCopied": "Link Copied",
    "index.shareFriends": "Share this link with your friends!",
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

    "action.flashcards": "闪卡",
    "action.flashcards.desc": "创建主动回忆卡片",
    "action.leitner": "莱特纳",
    "action.practiceTest": "模拟测试",
    "action.practiceTest.desc": "混合题型测试",
    "action.worksheet": "工作表",
    "action.worksheet.desc": "可打印的工作表",
    "action.studyRunner": "跑酷学习",
    "action.studyRunner.desc": "无尽跑酷游戏",
    "action.mindMap": "思维导图",
    "action.mindMap.desc": "视觉化概念映射",
    "action.quiz": "测验",
    "action.explain": "解释",
    "action.explain.desc": "简单的概念解释",
    "action.studyPlan": "学习计划",
    "action.studyPlan.desc": "每周学习安排",
    "action.summarize": "总结",
    "action.matchingGame": "配对",
    "action.matchingGame.desc": "匹配问答对",
    "action.vocabCards": "词汇卡",
    "action.vocabCards.desc": "带有插图的单词卡",
    "action.speedChallenge": "速度挑战",
    "action.speedChallenge.desc": "限时闪击模式",
    "action.elaborative": "为什么/如何",
    "action.elaborative.desc": "深度理解",
    "action.cheatSheet": "备忘单",
    "action.cheatSheet.desc": "公式和核心概念",
    "action.slides": "幻灯片",
    "action.slides.desc": "演示文稿",
    "action.cornell": "费曼笔记",
    "action.cornell.desc": "结构化笔记和线索",

    // Study Labels
    "study.placeholder.topic": "例如：光合作用、第二次世界大战、微积分导数...",
    "study.placeholder.notes": "在此粘贴您的笔记、教科书摘录或课程内容...",
    "study.placeholder.custom": "准确告诉 AI 您想要什么！",
    "study.saveCombo": "保存组合",
    "study.favorites": "收藏预设",
    "study.wiki": "包含维基百科",
    "study.wikiDisabled": "AI 搜索已禁用 — 仅使用上传的文件上下文",
    "study.aiWarning": "AI 可能不准确 — 请仔细核实来源和事实。",
    "study.diffLength": "难度与长度",
    "study.aiCustom": "AI 自定义",
    "study.adaptive": "自适应难度",
    "study.useOnlyFile": "仅将此文件用作上下文（无 AI 搜索）",
    "study.generateCard": "生成卡片",

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

    // Explore Sets
    "explore.title": "探索学习集",
    "explore.upload": "上传集合",
    "explore.official": "官方",
    "explore.community": "社区",
    "explore.standardTemplates": "标准模板",
    "explore.communityCreators": "社区创作者",
    "explore.noCommunitySets": "尚未分享任何社区集合。成为第一个分享的人吧！",
    "explore.items": "项目",
    "explore.use": "使用",
    "explore.by": "作者",
    "explore.loading": "正在加载社区集合...",

    // Template Dialog
    "template.use": "使用模板：",
    "template.ready": "学习材料已就绪",
    "template.topic": "主题或内容",
    "template.grade": "学习阶段",
    "template.generating": "正在生成...",
    "template.generate": "生成",

    // Results Viewer
    "results.export": "导出",
    "results.exportPdf": "导出为 PDF",
    "results.exportTxt": "导出为 TXT",
    "results.exportCsv": "导出为 CSV",
    "results.aiWarning": "AI 可能不准确 — 请在学习前核实来源。",
    "results.showSolution": "显示答案",
    "results.problem": "问题",
    "results.tip": "提示",
    "results.title.schedule": "学习计划",
    "results.title.explanation": "概念解释",
    "results.title.results": "结果",

    // Templates Manager
    "manager.title": "学习模板",
    "manager.desc": "创建、管理和分享您的自定义学习流程。",
    "manager.myLibrary": "我的库",
    "manager.newTemplate": "+ 新模板",
    "manager.signInRequired": "需要登录",
    "manager.signInDesc": "您必须登录才能创建并保存学习模板到云端。",
    "manager.noTemplates": "未找到模板",
    "manager.createFirst": "创建一个以开始",
    "manager.signInToView": "登录以查看您的模板",
    "manager.public": "公开",
    "manager.communityExamples": "社区示例",
    "manager.editTemplate": "编辑模板",
    "manager.newTemplateHeader": "新模板",
    "manager.configureDesc": "配置内容的生成方式。",
    "manager.name": "模板名称",
    "manager.actionType": "操作类型",
    "manager.description": "描述",
    "manager.payload": "配置 (JSON 数据)",
    "manager.format": "格式化",
    "manager.invalidJson": "无效的 JSON",
    "manager.estCards": "预计卡片/项目数",
    "manager.publicTemplate": "公开模板",
    "manager.shareCommunity": "与社区分享",
    "manager.deleteTemplate": "删除模板",
    "manager.saveChanges": "保存更改",
    "manager.createTemplate": "创建模板",

    // Index
    "index.manageTemplates": "管理模板",
    "index.exploreSets": "探索集合",
    "index.exitFocus": "退出专注",
    "index.focusMode": "专注模式",
    "index.premium": "高级学生",
    "index.linkCopied": "链接已复制",
    "index.shareFriends": "与朋友分享此链接！",
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

    // Explore Sets
    "explore.title": "Explorer les Ensembles d'Étude",
    "explore.upload": "Téléverser",
    "explore.official": "Officiel",
    "explore.community": "Communauté",
    "explore.standardTemplates": "Modèles Standards",
    "explore.communityCreators": "Créateurs de la Communauté",
    "explore.noCommunitySets": "Aucun ensemble n'a encore été partagé. Soyez le premier !",
    "explore.items": "articles",
    "explore.use": "Utiliser",
    "explore.by": "par",
    "explore.loading": "Chargement des ensembles...",

    // Template Dialog
    "template.use": "Utiliser le Modèle :",
    "template.ready": "Matériel d'Étude Prêt",
    "template.topic": "Sujet ou Thème",
    "template.grade": "Niveau d'Apprentissage",
    "template.generating": "Génération...",
    "template.generate": "Générer",

    // Results Viewer
    "results.export": "Exporter",
    "results.exportPdf": "Exporter en PDF",
    "results.exportTxt": "Exporter en TXT",
    "results.exportCsv": "Exporter en CSV",
    "results.aiWarning": "L'IA peut être inexacte — veuillez vérifier les sources avant d'étudier.",
    "results.showSolution": "Afficher la solution",
    "results.problem": "Problème",
    "results.tip": "Conseil",
    "results.title.schedule": "Programme d'Étude",
    "results.title.explanation": "Explication du Concept",
    "results.title.results": "Résultats",

    // Templates Manager
    "manager.title": "Modèles d'Étude",
    "manager.desc": "Créez, gérez et partagez vos flux d'étude personnalisés.",
    "manager.myLibrary": "Ma Bibliothèque",
    "manager.newTemplate": "+ Nouveau Modèle",
    "manager.signInRequired": "Connexion Requise",
    "manager.signInDesc": "Vous devez être connecté pour créer et sauvegarder des modèles d'étude sur le cloud.",
    "manager.noTemplates": "Aucun modèle trouvé",
    "manager.createFirst": "Créez-en un pour commencer",
    "manager.signInToView": "Connectez-vous pour voir vos modèles",
    "manager.public": "Public",
    "manager.communityExamples": "Exemples de la Communauté",
    "manager.editTemplate": "Modifier le Modèle",
    "manager.newTemplateHeader": "Nouveau Modèle",
    "manager.configureDesc": "Configurez la manière dont votre contenu est généré.",
    "manager.name": "Nom du Modèle",
    "manager.actionType": "Type d'Action",
    "manager.description": "Description",
    "manager.payload": "Configuration (Charge utile JSON)",
    "manager.format": "Formater",
    "manager.invalidJson": "JSON Invalide",
    "manager.estCards": "Est. Cartes/Articles",
    "manager.publicTemplate": "Modèle Public",
    "manager.shareCommunity": "Partager avec la communauté",
    "manager.deleteTemplate": "Supprimer le Modèle",
    "manager.saveChanges": "Sauvegarder les modifications",
    "manager.createTemplate": "Créer le Modèle",
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

    // Explore Sets
    "explore.title": "Explorar Conjuntos de Estudio",
    "explore.upload": "Subir Conjunto",
    "explore.official": "Oficial",
    "explore.community": "Comunidad",
    "explore.standardTemplates": "Plantillas Estándar",
    "explore.communityCreators": "Creadores de la Comunidad",
    "explore.noCommunitySets": "Aún no se han compartido conjuntos comunitarios. ¡Sé el primero!",
    "explore.items": "artículos",
    "explore.use": "Usar",
    "explore.by": "por",
    "explore.loading": "Cargando conjuntos...",

    // Template Dialog
    "template.use": "Usar Plantilla:",
    "template.ready": "Materiales de Estudio Listos",
    "template.topic": "Tema o Asunto",
    "template.grade": "Nivel de Aprendizaje",
    "template.generating": "Generando...",
    "template.generate": "Generar",

    // Results Viewer
    "results.export": "Exportar",
    "results.exportPdf": "Exportar como PDF",
    "results.exportTxt": "Exportar como TXT",
    "results.exportCsv": "Exportar como CSV",
    "results.aiWarning": "La IA puede ser inexacta — por favor verifica las fuentes antes de estudiar.",
    "results.showSolution": "Mostrar Solución",
    "results.problem": "Problema",
    "results.tip": "Consejo",
    "results.title.schedule": "Horario de Estudio",
    "results.title.explanation": "Explicación del Concepto",
    "results.title.results": "Resultados",

    // Templates Manager
    "manager.title": "Plantillas de Estudio",
    "manager.desc": "Crea, gestiona y comparte tus flujos de estudio personalizados.",
    "manager.myLibrary": "Mi Biblioteca",
    "manager.newTemplate": "+ Nueva Plantilla",
    "manager.signInRequired": "Inicio de Sesión Requerido",
    "manager.signInDesc": "Debes iniciar sesión para crear y guardar plantillas de estudio en la nube.",
    "manager.noTemplates": "No se encontraron plantillas",
    "manager.createFirst": "Crea una para comenzar",
    "manager.signInToView": "Inicia sesión para ver tus plantillas",
    "manager.public": "Público",
    "manager.communityExamples": "Ejemplos de la Comunidad",
    "manager.editTemplate": "Editar Plantilla",
    "manager.newTemplateHeader": "Nueva Plantilla",
    "manager.configureDesc": "Configura cómo se genera tu contenido.",
    "manager.name": "Nombre de la Plantilla",
    "manager.actionType": "Tipo de Acción",
    "manager.description": "Descripción",
    "manager.payload": "Configuración (Carga útil JSON)",
    "manager.format": "Formatear",
    "manager.invalidJson": "JSON Inválido",
    "manager.estCards": "Est. Tarjetas/Artículos",
    "manager.publicTemplate": "Plantilla Pública",
    "manager.shareCommunity": "Compartir con la comunidad",
    "manager.deleteTemplate": "Eliminar Plantilla",
    "manager.saveChanges": "Guardar Cambios",
    "manager.createTemplate": "Crear Plantilla",
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

    // Explore Sets
    "explore.title": "अध्ययन सेट खोजें",
    "explore.upload": "सेट अपलोड करें",
    "explore.official": "आधिकारिक",
    "explore.community": "समुदाय",
    "explore.standardTemplates": "मानक टेम्पलेट",
    "explore.communityCreators": "सामुदायिक निर्माता",
    "explore.noCommunitySets": "अभी तक कोई सामुदायिक सेट साझा नहीं किया गया है। पहले बनें!",
    "explore.items": "आइटम",
    "explore.use": "उपयोग करें",
    "explore.by": "द्वारा",
    "explore.loading": "सामुदायिक सेट लोड हो रहे हैं...",

    // Template Dialog
    "template.use": "टेम्पलेट का उपयोग करें:",
    "template.ready": "अध्ययन सामग्री तैयार है",
    "template.topic": "विषय या प्रसंग",
    "template.grade": "शिक्षण स्तर",
    "template.generating": "उत्पन्न हो रहा है...",
    "template.generate": "उत्पन्न करें",

    // Results Viewer
    "results.export": "निर्यात करें",
    "results.exportPdf": "PDF के रूप में निर्यात करें",
    "results.exportTxt": "TXT के रूप में निर्यात करें",
    "results.exportCsv": "CSV के रूप में निर्यात करें",
    "results.aiWarning": "AI गलत हो सकता है — कृपया अध्ययन से पहले स्रोतों की जांच करें।",
    "results.showSolution": "समाधान दिखाएं",
    "results.problem": "समस्या",
    "results.tip": "सुझाव",
    "results.title.schedule": "अध्ययन अनुसूची",
    "results.title.explanation": "अवधारणा स्पष्टीकरण",
    "results.title.results": "परिणाम",

    // Templates Manager
    "manager.title": "अध्ययन टेम्पलेट",
    "manager.desc": "अपने कस्टम अध्ययन वर्कफ़्लो बनाएं, प्रबंधित करें और साझा करें।",
    "manager.myLibrary": "मेरी लाइब्रेरी",
    "manager.newTemplate": "+ नया टेम्पलेट",
    "manager.signInRequired": "साइन इन आवश्यक",
    "manager.signInDesc": "क्लाउड पर अध्ययन टेम्पलेट बनाने और सहेजने के लिए आपको साइन इन होना चाहिए।",
    "manager.noTemplates": "कोई टेम्पलेट नहीं मिला",
    "manager.createFirst": "शुरू करने के लिए एक बनाएं",
    "manager.signInToView": "अपने टेम्पलेट देखने के लिए साइन इन करें",
    "manager.public": "सार्वजनिक",
    "manager.communityExamples": "सामुदायिक उदाहरण",
    "manager.editTemplate": "टेम्पलेट संपादित करें",
    "manager.newTemplateHeader": "नया टेम्पलेट",
    "manager.configureDesc": "कॉन्फ़िगर करें कि आपकी सामग्री कैसे उत्पन्न होती है।",
    "manager.name": "टेम्पलेट का नाम",
    "manager.actionType": "क्रिया प्रकार",
    "manager.description": "विवरण",
    "manager.payload": "कॉन्फ़िगरेशन (JSON पेलोड)",
    "manager.format": "प्रारूप",
    "manager.invalidJson": "अवैध JSON",
    "manager.estCards": "अनुमानित कार्ड/आइटम",
    "manager.publicTemplate": "सार्वजनिक टेम्पलेट",
    "manager.shareCommunity": "समुदाय के साथ साझा करें",
    "manager.deleteTemplate": "टेम्पलेट हटाएं",
    "manager.saveChanges": "परिवर्तन सहेजें",
    "manager.createTemplate": "टेम्पलेट बनाएं",
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
