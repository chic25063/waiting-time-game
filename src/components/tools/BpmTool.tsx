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
  const [currentBeat, setCurrentBeat] = useState<number>(0); // 0, 1, 2, 3

  // タップテンポ用タイムスタンプ配列
  const tapTimesRef = useRef<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1拍進める処理
  const tick = useCallback(() => {
    setCurrentBeat((prev) => {
      const nextBeat = (prev + 1) % 4;
      if (!isMuted) {
        sound.playClick(nextBeat === 0);
      }
      return nextBeat;
    });
  }, [isMuted]);

  // メトロノームのインターバル制御
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
      // 最初のクリック音を即座に鳴らす
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

  // タップテンポ
  const handleTap = () => {
    const now = Date.now();
    const taps = tapTimesRef.current;

    // 2秒以上間隔が空いたらリセット
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
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 50 && calculatedBpm <= 220) {
        setBpm(calculatedBpm);
      }
    }
    sound.playClick(false);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-purple-950/70 border border-white/20 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* 背景の光彩 */}
      <div
        className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-300 ${
          isPlaying ? "bg-amber-500/20 opacity-100" : "bg-purple-500/10 opacity-30"
        }`}
      />

      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
          <Activity className="w-3.5 h-3.5" />
          <span>BPMメトロノーム</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
            isMuted
              ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
              : "bg-white/10 hover:bg-white/20 border-white/15 text-slate-200"
          }`}
          title={isMuted ? "ミュート中（音なし）" : "音声あり"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="text-[11px] hidden sm:inline">{isMuted ? "消音中" : "消音"}</span>
        </button>
      </div>

      {/* ビートランプインジケーター (4拍) */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[0, 1, 2, 3].map((b) => {
          const isActive = isPlaying && currentBeat === b;
          return (
            <div
              key={b}
              className={`h-3 rounded-full transition-all duration-100 ${
                isActive
                  ? b === 0
                    ? "bg-amber-400 shadow-lg shadow-amber-400/60 scale-105"
                    : "bg-pink-400 shadow-lg shadow-pink-400/60 scale-105"
                  : "bg-white/15"
              }`}
            />
          );
        })}
      </div>

      {/* メインBPM表示＆コントロール */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/50 rounded-2xl p-4 border border-white/10 mb-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeBpm(-5)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold flex items-center justify-center transition-all border border-white/10"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => changeBpm(-1)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold flex items-center justify-center transition-all border border-white/10"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* BPM数値表示 */}
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight drop-shadow-md">
            {bpm}
          </div>
          <div className="text-[10px] text-purple-200/70 font-semibold uppercase tracking-wider">
            BPM（テンポ）
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeBpm(1)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold flex items-center justify-center transition-all border border-white/10"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => changeBpm(5)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-bold flex items-center justify-center transition-all border border-white/10"
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
          className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
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
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
              bpm === val
                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30"
                : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/10"
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* アクションボタン（再生・停止 & TAP） */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className={`col-span-2 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
            isPlaying
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/40"
              : "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-orange-500/30"
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
          className="py-3.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold text-xs flex flex-col items-center justify-center border border-white/15 shadow-sm transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300 mb-0.5" />
          <span>TAPテンポ</span>
        </button>
      </div>
    </div>
  );
}
