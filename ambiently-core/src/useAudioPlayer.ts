import { useEffect, useRef, useState } from "react";

interface AudioPlayerOptions {
    src: string;
    loop?: boolean;
    defaultVolume?: number;
    fadeDuration?: number; // ms
}

export function useAudioPlayer({
    src,
    loop = true,
    defaultVolume = 0.5,
    fadeDuration = 1000,
}: AudioPlayerOptions) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Setup audio element
    useEffect(() => {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.volume = 0;
        audioRef.current = audio;
        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, [src, loop]);

    // Smooth volume fade
    const fadeVolume = (target: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        const steps = 20;
        const stepTime = fadeDuration / steps;
        const diff = target - audio.volume;
        let currentStep = 0;

        const fade = setInterval(() => {
            if (!audio) return;
            currentStep++;
            audio.volume = audio.volume + diff / steps;
            if (currentStep >= steps) {
                clearInterval(fade);
                audio.volume = target;
            }
        }, stepTime);
    };

    const play = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.play().then(() => {
            setIsPlaying(true);
            fadeVolume(defaultVolume);
        });
    };

    const pause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        fadeVolume(0);
        setTimeout(() => audio.pause(), fadeDuration);
        setIsPlaying(false);
    };

    return { play, pause, isPlaying };
}
