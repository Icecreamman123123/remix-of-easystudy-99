 import { useState, useRef, useCallback, useEffect } from "react";
 
 // Type declarations for Web Speech API
 interface SpeechRecognitionEvent extends Event {
   resultIndex: number;
   results: SpeechRecognitionResultList;
 }
 
 interface SpeechRecognitionResultList {
   length: number;
   item(index: number): SpeechRecognitionResult;
   [index: number]: SpeechRecognitionResult;
 }
 
 interface SpeechRecognitionResult {
   isFinal: boolean;
   length: number;
   item(index: number): SpeechRecognitionAlternative;
   [index: number]: SpeechRecognitionAlternative;
 }
 
 interface SpeechRecognitionAlternative {
   transcript: string;
   confidence: number;
 }
 
 interface SpeechRecognitionErrorEvent extends Event {
   error: string;
   message?: string;
 }
 
 interface SpeechRecognitionInstance extends EventTarget {
   continuous: boolean;
   interimResults: boolean;
   lang: string;
   onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
   onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
   onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
   onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
   start(): void;
   stop(): void;
   abort(): void;
 }
 
 interface SpeechRecognitionConstructor {
   new (): SpeechRecognitionInstance;
 }
 
 interface UseVoiceInputOptions {
   onResult?: (transcript: string) => void;
   onError?: (error: string) => void;
   language?: string;
 }
 
 export function useVoiceInput(options: UseVoiceInputOptions = {}) {
   const [isListening, setIsListening] = useState(false);
   const [transcript, setTranscript] = useState("");
   const [isSupported, setIsSupported] = useState(true);
   const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
 
   // Check support on mount
   useEffect(() => {
     const hasSupport = !!(
       (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
       (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
     );
     setIsSupported(hasSupport);
   }, []);
 
   const startListening = useCallback(() => {
     const SpeechRecognitionClass = (
       (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
       (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
     );
 
     if (!SpeechRecognitionClass) {
       setIsSupported(false);
       options.onError?.("Speech recognition is not supported in this browser");
       return;
     }
 
     try {
       const recognition = new SpeechRecognitionClass();
       recognitionRef.current = recognition;
 
       recognition.continuous = false;
       recognition.interimResults = true;
       recognition.lang = options.language || "en-US";
 
       recognition.onstart = () => {
         setIsListening(true);
         setTranscript("");
       };
 
       recognition.onresult = (event: SpeechRecognitionEvent) => {
         let finalTranscript = "";
         let interimTranscript = "";
 
         for (let i = event.resultIndex; i < event.results.length; i++) {
           const result = event.results[i];
           const text = result[0].transcript;
           if (result.isFinal) {
             finalTranscript += text;
           } else {
             interimTranscript += text;
           }
         }
 
         const currentTranscript = finalTranscript || interimTranscript;
         setTranscript(currentTranscript);
 
         if (finalTranscript) {
           options.onResult?.(finalTranscript);
         }
       };
 
       recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
         console.error("Speech recognition error:", event.error);
         setIsListening(false);
         
         if (event.error === "not-allowed") {
           options.onError?.("Microphone access was denied. Please allow microphone access.");
         } else if (event.error === "no-speech") {
           options.onError?.("No speech detected. Please try again.");
         } else {
           options.onError?.(`Speech recognition error: ${event.error}`);
         }
       };
 
       recognition.onend = () => {
         setIsListening(false);
       };
 
       recognition.start();
     } catch (error) {
       console.error("Failed to start speech recognition:", error);
       options.onError?.("Failed to start speech recognition");
       setIsListening(false);
     }
   }, [options]);
 
   const stopListening = useCallback(() => {
     if (recognitionRef.current) {
       recognitionRef.current.stop();
       setIsListening(false);
     }
   }, []);
 
   const toggleListening = useCallback(() => {
     if (isListening) {
       stopListening();
     } else {
       startListening();
     }
   }, [isListening, startListening, stopListening]);
 
   return {
     isListening,
     transcript,
     isSupported,
     startListening,
     stopListening,
     toggleListening,
   };
 }