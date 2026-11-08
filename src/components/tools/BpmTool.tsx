"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { sound } from "@/lib/sound";
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Zap,
  Activity,
} from "lucide-react";

interface BpmToolProps {
  defaultBpm?: number;
}

const PRESETS = [80, 100, 120, 140, 160];

export default function BpmTool({ defaultBpm = 110 }: BpmToolProps) {
  const [bpm, setBpm] = useState<number>(defaultBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const tapTimesRef = useRef<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tick = useCallback(() => {
    setCurrentBeat((prev) => {
      const nextBeat = (prev + 1) % 4;
      if (!isMuted) {
        sound.playClick(nextBeat === 0);
      }
      return nextBeat;
    });
  }, [isMuted]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentBeat(0);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    timerRef.current = setInterval(tick, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, tick]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!isMuted) sound.playClick(true);
      setCurrentBeat(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const changeBpm = (delta: number) => {
    setBpm((prev) => Math.min(220, Math.max(50, prev + delta)));
  };

  const handleTap = () => {
    const now = Date.now();
    const taps = tapTimesRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = [now];
      return;
    }

    taps.push(now);
    if (taps.length > 4) taps.shift();

    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 50 && calculatedBpm <= 220) {
        setBpm(calculatedBpm);
      }
    }
    sound.playClick(false);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#2B2D42] p-5 sm:p-6 shadow-[4px_5px_0_#2B2D42] text-[#2B2D42]">
      {/* 右上の斜め蛍光マーカー装飾 */}
      <div
        className="absolute top-0 right-0 w-36 h-16 pointer-events-none opacity-65"
        style={{
          backgroundColor: "#CBC8FA",
          clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 0)",
        }}
      />

      {/* ヘッダーエリア */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CBC8FA] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
          <Activity className="w-3.5 h-3.5" />
          <span>BPMメトロノーム</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className={`p-2 rounded-xl border-2 border-[#2B2D42] text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
            isMuted
              ? "bg-[#FFADAD] text-[#2B2D42]"
              : "bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42]"
          }`}
          title={isMuted ? "ミュート中（音なし）" : "音声あり"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
          <span className="text-[11px] hidden sm:inline">
            {isMuted ? "消音中" : "消音"}
          </span>
        </button>
      </div>

      {/* ビートランプインジケーター (4拍) */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[0, 1, 2, 3].map((b) => {
          const isActive = isPlaying && currentBeat === b;
          return (
            <div
              key={b}
              className={`h-3.5 rounded-full border-2 border-[#2B2D42] transition-all duration-75 ${
                isActive
                  ? b === 0
                    ? "bg-[#FFE066] scale-105"
                    : "bg-[#7CE8DC] scale-105"
                  : "bg-[#FAF6EB]"
              }`}
            />
          );
        })}
      </div>

      {/* メインBPM表示＆コントロール */}
      <div className="flex items-center justify-between gap-3 bg-[#FAF6EB] rounded-2xl p-4 border-2 border-[#2B2D42] mb-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeBpm(-5)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 active:scale-90 text-[#2B2D42] font-black text-xs flex items-center justify-center transition-all border-2 border-[#2B2D42] cursor-pointer"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => changeBpm(-1)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 active:scale-90 text-[#2B2D42] font-black flex items-center justify-center transition-all border-2 border-[#2B2D42] cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* BPM数値表示 */}
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-black text-[#2B2D42] font-mono tracking-tight">
            {bpm}
          </div>
          <div className="text-[10px] text-[#2B2D42]/70 font-black">
            テンポ (BPM)
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeBpm(1)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 active:scale-90 text-[#2B2D42] font-black flex items-center justify-center transition-all border-2 border-[#2B2D42] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => changeBpm(5)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 active:scale-90 text-[#2B2D42] font-black text-xs flex items-center justify-center transition-all border-2 border-[#2B2D42] cursor-pointer"
          >
            +5
          </button>
        </div>
      </div>

      {/* BPMスライダー */}
      <div className="mb-4 px-1">
        <input
          type="range"
          min={50}
          max={200}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full accent-[#2B2D42] h-2 bg-[#FAF6EB] rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold text-[#2B2D42]/65 mt-1">
          <span>50 (ゆっくり)</span>
          <span>120 (標準)</span>
          <span>200 (超速)</span>
        </div>
      </div>

      {/* プリセットボタン */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {PRESETS.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setBpm(val)}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all border-2 border-[#2B2D42] cursor-pointer ${
              bpm === val
                ? "bg-[#CBC8FA] text-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
                : "bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42]/75"
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* アクションボタン（再生・停止 & TAP） */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className={`col-span-2 py-3.5 px-4 rounded-2xl border-2 border-[#2B2D42] font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer ${
            isPlaying
              ? "bg-[#FFADAD] text-[#2B2D42]"
              : "bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42]"
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>リズム停止</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>リズム開始</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleTap}
          className="py-3.5 px-3 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 border-2 border-[#2B2D42] text-[#2B2D42] font-black text-xs flex flex-col items-center justify-center shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4 text-[#2B2D42] mb-0.5" />
          <span>タップ計測</span>
        </button>
      </div>
    </div>
  );
}
