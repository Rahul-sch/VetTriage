import { useRef, useEffect, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  currentTime: number;
  /** External seek request (from clicking a transcript segment) */
  seekTime?: number | null;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  /** Called after an external seek has been processed */
  onSeeked?: () => void;
}

export function AudioPlayer({
  audioUrl,
  currentTime,
  seekTime,
  onTimeUpdate,
  onSeek,
  onSeeked,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localTime, setLocalTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setLocalTime(time);
      onTimeUpdate(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate]);

  // Handle external seek requests (from clicking transcript segments)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && seekTime !== null && seekTime !== undefined) {
      audio.currentTime = seekTime;
      setLocalTime(seekTime);
      // Auto-play when seeking to a segment
      if (audio.paused) {
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      onSeeked?.();
    }
  }, [seekTime, onSeeked]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setLocalTime(time);
    }
    onSeek(time);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-100 rounded-xl p-4 shadow-sm border border-slate-200">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Timeline */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={localTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-300 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:bg-teal-600
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatTime(localTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-2 text-center">
        💡 Click any transcript segment to jump to that moment
      </p>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
