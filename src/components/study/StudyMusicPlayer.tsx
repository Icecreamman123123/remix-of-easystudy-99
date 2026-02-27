import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Music, Coffee, Sparkles, Zap, Clock, Heart, Shuffle, SkipForward, SkipBack, Headphones, BarChart3, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Track = {
    id: string;
    name: string;
    icon: any;
    type: "youtube" | "tone";
    color: string;
    youtubeId?: string;
    frequency?: number;
    duration?: number;
    category?: "focus" | "relax" | "energy";
};

const TRACKS: Track[] = [
    { id: "gamma", name: "87Hz Waves", icon: Zap, type: "tone", color: "text-indigo-400", frequency: 87, category: "focus" },
    { id: "lofi", name: "Lofi Vibes", icon: Coffee, type: "youtube", color: "text-purple-400", youtubeId: "jfKfPfyJRdk", category: "relax" },
    { id: "rain", name: "Rainy Night", icon: Sparkles, type: "youtube", color: "text-blue-500", youtubeId: "mPZkdNF637E", category: "relax" },
    { id: "focus", name: "Deep Focus", icon: Coffee, type: "youtube", color: "text-green-500", youtubeId: "5qap5aO4i9A", category: "focus" },
    { id: "nature", name: "Forest Sounds", icon: Sparkles, type: "youtube", color: "text-emerald-500", youtubeId: "hHW1oY26kxQ", category: "relax" },
];

export function StudyMusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);
    const [isApiReady, setIsApiReady] = useState(false);
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
    const [currentCategory, setCurrentCategory] = useState<"all" | "focus" | "relax" | "energy">("all");
    const [isMiniPlayer, setIsMiniPlayer] = useState(false);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
    const [queue, setQueue] = useState<string[]>([]);
    const { toast } = useToast();

    const audioCtx = useRef<AudioContext | null>(null);
    const soundNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const ytPlayer = useRef<any>(null);
    const sleepTimerRef = useRef<number | null>(null);
    const playbackStartTime = useRef<number | null>(null);
    const sessionHistory = useRef<Array<{track: string, startTime: number, duration: number}>>([]);
    const visualizerCanvas = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioAnalyser = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        const win = window as any;
        if (win.YT && win.YT.Player) {
            setIsApiReady(true);
            return;
        }

        if (!document.getElementById("youtube-api-script")) {
            const tag = document.createElement("script");
            tag.id = "youtube-api-script";
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const oldOnReady = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
            if (oldOnReady) oldOnReady();
            setIsApiReady(true);
        };

        const checkInterval = setInterval(() => {
            if (win.YT && win.YT.Player) {
                setIsApiReady(true);
                clearInterval(checkInterval);
            }
        }, 1000);

        return () => clearInterval(checkInterval);
    }, []);

    const toggleFavorite = (trackId: string) => {
        setFavorites(prev => 
            prev.includes(trackId) 
                ? prev.filter(id => id !== trackId)
                : [...prev, trackId]
        );
        toast({
            title: favorites.includes(trackId) ? "Removed from favorites" : "Added to favorites",
            duration: 1500
        });
    };

    const setSleepTimer = (minutes: number) => {
        if (sleepTimerRef.current) {
            clearTimeout(sleepTimerRef.current);
        }
        
        setSleepTimerMinutes(minutes);
        sleepTimerRef.current = window.setTimeout(() => {
            stopAll();
            setSleepTimerMinutes(null);
            toast({
                title: "Sleep timer finished",
                description: "Music stopped automatically",
                duration: 3000
            });
        }, minutes * 60 * 1000);
        
        toast({
            title: `Sleep timer set for ${minutes} minutes`,
            duration: 2000
        });
    };

    const playNextTrack = () => {
        const filteredTracks = currentCategory === "all" 
            ? TRACKS 
            : TRACKS.filter(t => t.category === currentCategory);
        
        const currentIndex = filteredTracks.findIndex(t => t.id === activeTrack);
        let nextIndex;
        
        if (isShuffleOn) {
            nextIndex = Math.floor(Math.random() * filteredTracks.length);
        } else {
            nextIndex = (currentIndex + 1) % filteredTracks.length;
        }
        
        playTrack(filteredTracks[nextIndex].id);
    };

    const playPreviousTrack = () => {
        const filteredTracks = currentCategory === "all" 
            ? TRACKS 
            : TRACKS.filter(t => t.category === currentCategory);
        
        const currentIndex = filteredTracks.findIndex(t => t.id === activeTrack);
        const prevIndex = currentIndex === 0 ? filteredTracks.length - 1 : currentIndex - 1;
        
        playTrack(filteredTracks[prevIndex].id);
    };

    const clearSleepTimer = () => {
        if (sleepTimerRef.current) {
            clearTimeout(sleepTimerRef.current);
            sleepTimerRef.current = null;
        }
        setSleepTimerMinutes(null);
    };

    const initVisualizer = () => {
        if (!audioCtx.current || !visualizerCanvas.current) return;
        
        audioAnalyser.current = audioCtx.current.createAnalyser();
        audioAnalyser.current.fftSize = 256;
        
        if (gainNode.current) {
            gainNode.current.connect(audioAnalyser.current);
            audioAnalyser.current.connect(audioCtx.current.destination);
        }
    };

    const drawVisualizer = () => {
        if (!visualizerCanvas.current || !audioAnalyser.current) return;
        
        const canvas = visualizerCanvas.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const bufferLength = audioAnalyser.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        audioAnalyser.current.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
            
            const r = barHeight + 25 * (i / bufferLength);
            const g = 250 * (i / bufferLength);
            const b = 50;
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    };

    const toggleVisualizer = () => {
        if (showVisualizer) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            setShowVisualizer(false);
        } else {
            initVisualizer();
            setShowVisualizer(true);
            drawVisualizer();
        }
    };

    const toggleMiniPlayer = () => {
        setIsMiniPlayer(!isMiniPlayer);
    };

    const addToQueue = (trackId: string) => {
        setQueue(prev => [...prev, trackId]);
        toast({
            title: "Added to queue",
            duration: 1500
        });
    };

    const removeFromQueue = (index: number) => {
        setQueue(prev => prev.filter((_, i) => i !== index));
    };

    const clearQueue = () => {
        setQueue([]);
        toast({
            title: "Queue cleared",
            duration: 1500
        });
    };

    const changePlaybackSpeed = (speed: number) => {
        setPlaybackSpeed(speed);
        if (ytPlayer.current && typeof ytPlayer.current.setPlaybackRate === 'function') {
            ytPlayer.current.setPlaybackRate(speed);
        }
        toast({
            title: `Playback speed: ${speed}x`,
            duration: 1500
        });
    };

    const initAudio = () => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            gainNode.current = audioCtx.current.createGain();
            gainNode.current.connect(audioCtx.current.destination);
        }
        if (audioCtx.current.state === "suspended") {
            audioCtx.current.resume();
        }
    };

    const createBrainWave = (freq: number) => {
        if (!audioCtx.current) return;
        // Create an oscillator for the 87Hz base frequency
        const osc = audioCtx.current.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);

        // Add a bit of texture/harmonics so it's not a boring beep
        const shaper = audioCtx.current.createWaveShaper();
        shaper.curve = new Float32Array([0.1, 0.4, 0.6, 0.9]); // Subtle distortion for texture

        osc.connect(shaper);
        return { osc, lastNode: shaper };
    };

    const stopAll = () => {
        if (ytPlayer.current && typeof ytPlayer.current.stopVideo === "function") {
            try { ytPlayer.current.stopVideo(); } catch (e) { }
        }
        if (soundNode.current) {
            try {
                if ((soundNode.current as any).stop) (soundNode.current as any).stop();
            } catch (e) { }
            soundNode.current.disconnect();
            soundNode.current = null;
        }
        setIsPlaying(false);
    };

    const playTrack = (trackId: string) => {
        const track = TRACKS.find(t => t.id === trackId);
        if (!track) return;
        stopAll();

        if (track.type === "tone" && track.frequency) {
            initAudio();
            const res = createBrainWave(track.frequency);
            if (res && gainNode.current) {
                gainNode.current.gain.value = volume * 0.4; // Tones are louder, scale down
                res.lastNode.connect(gainNode.current);
                res.osc.start();
                soundNode.current = res.osc as any;
            }
        } else if (track.type === "youtube" && track.youtubeId) {
            const win = window as any;
            if (!isApiReady || !win.YT || !win.YT.Player) {
                setTimeout(() => playTrack(trackId), 500);
                return;
            }

            if (!ytPlayer.current) {
                try {
                    ytPlayer.current = new win.YT.Player("youtube-player-container", {
                        height: "0",
                        width: "0",
                        videoId: track.youtubeId,
                        playerVars: {
                            autoplay: 1,
                            loop: 1,
                            playlist: track.youtubeId,
                            controls: 0,
                            origin: window.location.origin
                        },
                        events: {
                            onReady: (event: any) => {
                                event.target.setVolume(volume * 100);
                                event.target.playVideo();
                            }
                        }
                    });
                } catch (err) {
                    console.error("Failed to init YT player:", err);
                }
            } else {
                try {
                    ytPlayer.current.loadVideoById(track.youtubeId);
                    ytPlayer.current.setVolume(volume * 100);
                    ytPlayer.current.playVideo();
                } catch (err) {
                    ytPlayer.current = null;
                    playTrack(trackId);
                }
            }
        }

        setActiveTrack(trackId);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopAll();
        } else if (activeTrack) {
            playTrack(activeTrack);
        } else {
            playTrack(TRACKS[0].id);
        }
    };

    useEffect(() => {
        if (gainNode.current) {
            const track = TRACKS.find(t => t.id === activeTrack);
            gainNode.current.gain.value = track?.type === "tone" ? volume * 0.4 : volume;
        }
        if (ytPlayer.current && typeof ytPlayer.current.setVolume === "function") {
            try { ytPlayer.current.setVolume(volume * 100); } catch (e) { }
        }
    }, [volume, activeTrack]);

    useEffect(() => {
        return () => {
            stopAll();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (sleepTimerRef.current) {
                clearTimeout(sleepTimerRef.current);
            }
            if (audioCtx.current) {
                audioCtx.current.close();
            }
        };
    }, []);

    return (
        <Card className={cn("glass-card border-primary/10 shadow-lg", isMiniPlayer && "p-2")}>
            <CardContent className={cn("space-y-4 relative overflow-hidden", isMiniPlayer ? "p-2" : "p-5")}>
                {showVisualizer && !isMiniPlayer && (
                    <canvas
                        ref={visualizerCanvas}
                        width={300}
                        height={100}
                        className="w-full h-20 bg-black/20 rounded-lg mb-4"
                    />
                )}
                
                <div
                    id="youtube-player-container"
                    className="absolute -top-10 -left-10 w-0 h-0 opacity-0 pointer-events-none"
                    aria-hidden="true"
                ></div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-secondary/20 rounded-lg text-secondary-foreground">
                            <Music className="h-4 w-4" />
                        </div>
                        <h3 className={cn("font-bold tracking-tight uppercase", isMiniPlayer ? "text-xs" : "text-sm")}>
                            {isMiniPlayer ? "Study Music" : "Study Sounds"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isMiniPlayer && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-full p-0"
                                    onClick={toggleVisualizer}
                                >
                                    <BarChart3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-full p-0"
                                    onClick={toggleMiniPlayer}
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant={isPlaying ? "destructive" : "default"}
                            size="sm"
                            className={cn("rounded-full p-0", isMiniPlayer ? "h-6 w-6" : "h-8 w-8")}
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className={cn("ml-0", isMiniPlayer ? "h-3 w-3" : "h-4 w-4")} /> : <Play className={cn("ml-0.5", isMiniPlayer ? "h-3 w-3" : "h-4 w-4")} />}
                        </Button>
                    </div>
                </div>

                {!isMiniPlayer && (
                <div className="grid grid-cols-2 gap-1.5">
                    {TRACKS.map((track) => {
                        const Icon = track.icon;
                        const isActive = activeTrack === track.id;
                        return (
                            <Button
                                key={track.id}
                                variant="outline"
                                className={cn(
                                    "h-auto py-2.5 px-2 flex flex-col gap-1.5 items-center justify-center border-dashed transition-all duration-300",
                                    isActive ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "hover:bg-muted/50",
                                    isActive && isPlaying && "animate-pulse"
                                )}
                                onClick={() => playTrack(track.id)}
                            >
                                <Icon className={cn("h-4 w-4", isActive ? track.color : "text-muted-foreground")} />
                                <span className="text-[9px] font-bold uppercase tracking-tighter text-center">{track.name}</span>
                            </Button>
                        );
                    })}
                </div>
            )}

                {!isMiniPlayer && (
                <div className="pt-1 flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Slider
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={(vals) => setVolume(vals[0])}
                        className="flex-1"
                    />
                </div>
            )}
            </CardContent>
        </Card>
    );
}
