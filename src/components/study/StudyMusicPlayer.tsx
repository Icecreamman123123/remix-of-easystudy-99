import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Music, Wind, Waves, Coffee, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Track = {
    id: string;
    name: string;
    icon: any;
    type: "noise" | "url";
    color: string;
    url?: string;
};

const TRACKS: Track[] = [
    { id: "white", name: "White Noise", icon: Wind, type: "noise", color: "text-blue-400" },
    { id: "brown", name: "Brown Noise", icon: Waves, type: "noise", color: "text-amber-600" },
    { id: "lofi", name: "Lofi Vibes", icon: Coffee, type: "url", color: "text-purple-400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, // Placeholder for lofi
    { id: "ambient", name: "Ambient Study", icon: Sparkles, type: "url", color: "text-emerald-400", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }, // Placeholder for ambient
];

export function StudyMusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);

    const audioCtx = useRef<AudioContext | null>(null);
    const noiseNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
            output[i] *= 3.5; // (roughly) compensate for gain
        }
        const brownNoise = audioCtx.current.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;
        return brownNoise;
    };

    const stopAll = () => {
        if (noiseNode.current) {
            try { (noiseNode.current as AudioBufferSourceNode).stop(); } catch (e) { }
            noiseNode.current.disconnect();
            noiseNode.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const playTrack = (trackId: string) => {
        initAudio();
        stopAll();

        const track = TRACKS.find(t => t.id === trackId);
        if (!track) return;

        if (track.type === "noise") {
            const node = track.id === "white" ? createWhiteNoise() : createBrownNoise();
            if (node && gainNode.current) {
                node.connect(gainNode.current);
                node.start();
                noiseNode.current = node;
            }
        } else if (track.url) {
            const audio = new Audio(track.url);
            audio.loop = true;
            audio.volume = volume;
            audio.play();
            audioRef.current = audio;
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
        if (audioRef.current) {
            audioRef.current.volume = volume;
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
            <CardContent className="p-5 space-y-4">
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

                <div className="grid grid-cols-2 gap-2">
                    {TRACKS.map((track) => {
                        const Icon = track.icon;
                        const isActive = activeTrack === track.id;
                        return (
                            <Button
                                key={track.id}
                                variant="outline"
                                className={cn(
                                    "h-auto py-3 px-2 flex flex-col gap-2 items-center justify-center border-dashed transition-all duration-300",
                                    isActive ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "hover:bg-muted/50",
                                    isActive && isPlaying && "animate-pulse"
                                )}
                                onClick={() => playTrack(track.id)}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? track.color : "text-muted-foreground")} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">{track.name}</span>
                            </Button>
                        );
                    })}
                </div>

                <div className="pt-2 flex items-center gap-3">
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
