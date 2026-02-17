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
    { id: "rain", name: "Gentle Rain", icon: Waves, type: "url", color: "text-blue-400", url: "https://www.orangefreesounds.com/wp-content/uploads/2018/04/Gentle-rain-loop.mp3" },
    { id: "pink", name: "Deep Focus", icon: Waves, type: "noise", color: "text-rose-400" },
    { id: "lofi", name: "Lofi Vibes", icon: Coffee, type: "url", color: "text-purple-400", url: "https://www.chosic.com/wp-content/uploads/2021/04/Purrple-Cat-Warm-Sun.mp3" },
    { id: "ambient", name: "Ambient Study", icon: Sparkles, type: "url", color: "text-emerald-400", url: "https://www.chosic.com/wp-content/uploads/2020/06/Kai-Engel-Satin.mp3" },
];

export function StudyMusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTrack, setActiveTrack] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);

    const audioCtx = useRef<AudioContext | null>(null);
    const noiseNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeOutInterval = useRef<NodeJS.Timeout | null>(null);

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
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }

        const pinkNoise = audioCtx.current.createBufferSource();
        pinkNoise.buffer = noiseBuffer;
        pinkNoise.loop = true;
        return pinkNoise;
    };

    const stopAll = (callback?: () => void) => {
        if (fadeOutInterval.current) clearInterval(fadeOutInterval.current);

        const currentAudio = audioRef.current;
        const currentNoiseGain = gainNode.current;

        if (isPlaying && (currentAudio || noiseNode.current)) {
            // Fade out
            let v = volume;
            fadeOutInterval.current = setInterval(() => {
                v -= 0.05;
                if (v <= 0) {
                    if (fadeOutInterval.current) clearInterval(fadeOutInterval.current);
                    if (currentAudio) {
                        currentAudio.pause();
                    }
                    if (noiseNode.current) {
                        try { (noiseNode.current as AudioBufferSourceNode).stop(); } catch (e) { }
                        noiseNode.current.disconnect();
                        noiseNode.current = null;
                    }
                    if (callback) callback();
                } else {
                    if (currentAudio) currentAudio.volume = v;
                    if (currentNoiseGain) currentNoiseGain.gain.value = v;
                }
            }, 50);
        } else {
            if (currentAudio) currentAudio.pause();
            if (noiseNode.current) {
                try { (noiseNode.current as AudioBufferSourceNode).stop(); } catch (e) { }
                noiseNode.current.disconnect();
                noiseNode.current = null;
            }
            if (callback) callback();
        }
        setIsPlaying(false);
    };

    const playTrack = (trackId: string) => {
        initAudio();

        const doPlay = () => {
            const track = TRACKS.find(t => t.id === trackId);
            if (!track) return;

            if (track.type === "noise") {
                const node = createPinkNoise();
                if (node && gainNode.current) {
                    gainNode.current.gain.value = 0; // Start silent for fade in
                    node.connect(gainNode.current);
                    node.start();
                    noiseNode.current = node;

                    // Fade in
                    let v = 0;
                    const fadeIn = setInterval(() => {
                        v += 0.05;
                        if (v >= volume) {
                            clearInterval(fadeIn);
                            if (gainNode.current) gainNode.current.gain.value = volume;
                        } else {
                            if (gainNode.current) gainNode.current.gain.value = v;
                        }
                    }, 50);
                }
            } else if (track.url) {
                const audio = new Audio(track.url);
                audio.crossOrigin = "anonymous";
                audio.loop = true;
                audio.volume = 0; // Start silent for fade in
                audio.play().catch(e => console.error("Audio play failed:", e));
                audioRef.current = audio;

                // Fade in
                let v = 0;
                const fadeIn = setInterval(() => {
                    v += 0.05;
                    if (v >= volume) {
                        clearInterval(fadeIn);
                        if (audioRef.current) audioRef.current.volume = volume;
                    } else {
                        if (audioRef.current) audioRef.current.volume = v;
                    }
                }, 50);
            }

            setActiveTrack(trackId);
            setIsPlaying(true);
        };

        if (isPlaying) {
            stopAll(doPlay);
        } else {
            doPlay();
        }
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
