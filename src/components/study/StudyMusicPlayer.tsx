import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Music, Waves, Coffee, Sparkles, Wind, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Track = {
    id: string;
    name: string;
    icon: any;
    type: "noise" | "youtube" | "tone";
    color: string;
    youtubeId?: string;
    frequency?: number;
};

const TRACKS: Track[] = [
    { id: "white", name: "Soft White", icon: Wind, type: "noise", color: "text-blue-300" },
    { id: "brown", name: "Deep Brown", icon: Waves, type: "noise", color: "text-amber-700" },
    { id: "gamma", name: "87Hz Waves", icon: Zap, type: "tone", color: "text-indigo-400", frequency: 87 },
    { id: "lofi", name: "Lofi Vibes", icon: Coffee, type: "youtube", color: "text-purple-400", youtubeId: "jfKfPfyJRdk" },
    { id: "rain", name: "Rainy Night", icon: Sparkles, type: "youtube", color: "text-blue-500", youtubeId: "mPZkdNF637E" },
];

export function StudyMusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);
    const [isApiReady, setIsApiReady] = useState(false);

    const audioCtx = useRef<AudioContext | null>(null);
    const soundNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const ytPlayer = useRef<any>(null);

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

    const createWhiteNoise = () => {
        if (!audioCtx.current) return;
        const bufferSize = 2 * audioCtx.current.sampleRate;
        const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.5; // Softer white noise
        }
        const source = audioCtx.current.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        return source;
    };

    const createBrownNoise = () => {
        if (!audioCtx.current) return;
        const bufferSize = 2 * audioCtx.current.sampleRate;
        const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Stronger integration for "actually deep" brown noise
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 2.5; // Gain adjustment
        }
        const source = audioCtx.current.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        return source;
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

        if (track.type === "noise") {
            initAudio();
            const node = track.id === "white" ? createWhiteNoise() : createBrownNoise();
            if (node && gainNode.current) {
                gainNode.current.gain.value = volume;
                node.connect(gainNode.current);
                node.start();
                soundNode.current = node;
            }
        } else if (track.type === "tone" && track.frequency) {
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
            if (audioCtx.current) {
                audioCtx.current.close();
            }
        };
    }, []);

    return (
        <Card className="glass-card border-primary/10 shadow-lg">
            <CardContent className="p-5 space-y-4 relative overflow-hidden">
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
                        <h3 className="font-bold text-sm tracking-tight uppercase">Study Sounds</h3>
                    </div>
                    <Button
                        variant={isPlaying ? "destructive" : "default"}
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>
                </div>

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
            </CardContent>
        </Card>
    );
}
