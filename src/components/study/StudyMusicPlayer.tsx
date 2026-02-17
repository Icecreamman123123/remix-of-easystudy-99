import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Music, Waves, Coffee, Sparkles, Wind } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Track = {
    id: string;
    name: string;
    icon: any;
    type: "noise" | "youtube";
    color: string;
    youtubeId?: string;
};

const TRACKS: Track[] = [
    { id: "white", name: "White Noise", icon: Wind, type: "noise", color: "text-blue-400" },
    { id: "brown", name: "Brown Noise", icon: Waves, type: "noise", color: "text-amber-600" },
    { id: "pink", name: "Deep Focus", icon: Waves, type: "noise", color: "text-rose-400" },
    { id: "lofi", name: "Lofi Vibes", icon: Coffee, type: "youtube", color: "text-purple-400", youtubeId: "jfKfPfyJRdk" },
    { id: "ambient", name: "Ambient Study", icon: Sparkles, type: "youtube", color: "text-emerald-400", youtubeId: "DWcJYn7qpg8" },
];

export function StudyMusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);
    const [isApiReady, setIsApiReady] = useState(false);

    const audioCtx = useRef<AudioContext | null>(null);
    const noiseNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const ytPlayer = useRef<any>(null);

    // Initialize YouTube API
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
        if (!audioCtx.current || !gainNode.current) return;
        const bufferSize = 2 * audioCtx.current.sampleRate;
        const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = audioCtx.current.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        return whiteNoise;
    };

    const createBrownNoise = () => {
        if (!audioCtx.current || !gainNode.current) return;
        const bufferSize = 2 * audioCtx.current.sampleRate;
        const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
        const brownNoise = audioCtx.current.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;
        return brownNoise;
    };

    const createPinkNoise = () => {
        if (!audioCtx.current || !gainNode.current) return;
        const bufferSize = 4 * audioCtx.current.sampleRate;
        const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }
        const pinkNoise = audioCtx.current.createBufferSource();
        pinkNoise.buffer = noiseBuffer;
        pinkNoise.loop = true;
        return pinkNoise;
    };

    const stopAll = () => {
        if (ytPlayer.current && typeof ytPlayer.current.stopVideo === "function") {
            try { ytPlayer.current.stopVideo(); } catch (e) { }
        }
        if (noiseNode.current) {
            try { (noiseNode.current as AudioBufferSourceNode).stop(); } catch (e) { }
            noiseNode.current.disconnect();
            noiseNode.current = null;
        }
        setIsPlaying(false);
    };

    const playTrack = (trackId: string) => {
        const track = TRACKS.find(t => t.id === trackId);
        if (!track) return;
        stopAll();

        if (track.type === "noise") {
            initAudio();
            let node;
            if (track.id === "white") node = createWhiteNoise();
            else if (track.id === "brown") node = createBrownNoise();
            else node = createPinkNoise();

            if (node && gainNode.current) {
                gainNode.current.gain.value = volume;
                node.connect(gainNode.current);
                node.start();
                noiseNode.current = node;
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
            gainNode.current.gain.value = volume;
        }
        if (ytPlayer.current && typeof ytPlayer.current.setVolume === "function") {
            try { ytPlayer.current.setVolume(volume * 100); } catch (e) { }
        }
    }, [volume]);

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
                                <span className="text-[9px] font-bold uppercase tracking-tighter text-center leading-none">{track.name}</span>
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
