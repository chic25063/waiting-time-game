"use client";

import { useState, useEffect, useRef } from "react";
import { sound } from "@/lib/sound";
import {
  Clock,
  Eye,
  EyeOff,
  Play,
  Square,
  RotateCcw,
  Trophy,
  Flame,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

interface TimerToolProps {
  defaultDuration?: number; // 秒数
  isBlindDefault?: boolean; // ブラインドモードがデフォルトか
}

type Mode = "blind" | "countdown";

export default function TimerTool({
  defaultDuration = 10,
  isBlindDefault = false,
}: TimerToolProps) {
  const [mode, setMode] = useState<Mode>(isBlindDefault ? "blind" : "countdown");
  const [targetSeconds, setTargetSeconds] = useState<number>(defaultDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [remainingSec, setRemainingSec] = useState<number>(defaultDuration);
  const [result, setResult] = useState<{ actual: number; diff: number } | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ブラインドタイマーのループ
  useEffect(() => {
    if (mode !== "blind" || !isRunning) {
      if (timerFrameRef.current) cancelAnimationFrame(timerFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const loop = () => {
      const now = performance.now();
      setElapsedMs(now - startTimeRef.current);
      timerFrameRef.current = requestAnimationFrame(loop);
    };

    timerFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (timerFrameRef.current) cancelAnimationFrame(timerFrameRef.current);
    };
  }, [mode, isRunning]);

  // カウントダウンタイマーのループ
  useEffect(() => {
    if (mode !== "countdown" || !isRunning) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setIsRunning(false);
          sound.playTimeUp();
          return 0;
        }
        if (prev <= 4) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [mode, isRunning]);

  // ブラインドスタート・ストップ
  const handleBlindToggle = () => {
    if (!isRunning) {
      setResult(null);
      setElapsedMs(0);
      setIsRunning(true);
      sound.playTick();
    } else {
      setIsRunning(false);
      const actualSec = elapsedMs / 1000;
      const diffSec = actualSec - targetSeconds;
      setResult({ actual: actualSec, diff: diffSec });

      if (Math.abs(diffSec) <= 0.5) {
        sound.playWin();
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch {
          // fallback
        }
      } else {
        sound.playTick();
      }
    }
  };

  // カウントダウントグル
  const handleCountdownToggle = () => {
    if (!isRunning) {
      if (remainingSec === 0) setRemainingSec(targetSeconds);
      setIsRunning(true);
      sound.playTick();
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    setRemainingSec(targetSeconds);
    setResult(null);
  };

  // 評価コメント取得
  const getRating = (diff: number) => {
    const abs = Math.abs(diff);
    if (abs < 0.2) return { text: "神の体内時計！完全感覚！", color: "text-amber-300", badge: "GOD" };
    if (abs < 0.5) return { text: "凄まじい精度！お見事！", color: "text-emerald-300", badge: "EXCELLENT" };
    if (abs < 1.0) return { text: "ナイス！ほぼピッタリ！", color: "text-cyan-300", badge: "GOOD" };
    if (abs < 2.0) return { text: "惜しい！あと一歩！", color: "text-purple-300", badge: "NICE TRY" };
    return { text: "体内時計がズレてるかも？！", color: "text-rose-300", badge: "OOPS" };
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-purple-950/70 border border-white/20 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* 背景の光彩 */}
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ヘッダーエリア & モード切替タブ */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>タイマーツール</span>
        </div>

        {/* モード選択 */}
        <div className="flex bg-white/10 rounded-xl p-1 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              handleReset();
              setMode("blind");
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mode === "blind"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <EyeOff className="w-3 h-3" />
            <span>ブラインド秒数当て</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleReset();
              setMode("countdown");
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mode === "countdown"
                ? "bg-pink-500 text-white shadow-md font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>カウントダウン</span>
          </button>
        </div>
      </div>

      {/* 目標秒数プリセット */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-slate-950/40 p-2.5 rounded-2xl border border-white/10">
        <span className="text-xs text-purple-200/80 font-medium pl-1">
          {mode === "blind" ? "目標秒数:" : "制限時間:"}
        </span>
        <div className="flex gap-1">
          {[5, 10, 15, 20, 30].map((s) => (
            <button
              key={s}
              type="button"
              disabled={isRunning}
              onClick={() => {
                setTargetSeconds(s);
                setRemainingSec(s);
                setResult(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                targetSeconds === s
                  ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm"
                  : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/10"
              }`}
            >
              {s}秒
            </button>
          ))}
        </div>
      </div>

      {/* メインタイマー表示エリア */}
      {mode === "blind" ? (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-3xl border border-white/15 mb-4 relative overflow-hidden min-h-[170px]">
          {isRunning ? (
            /* 計測中（数字を隠すブラインド演出） */
            <div className="text-center animate-pulse">
              <div className="text-5xl sm:text-6xl font-black text-cyan-300 tracking-wider font-mono">
                ??.??
              </div>
              <div className="mt-2 text-xs sm:text-sm text-cyan-200/80 font-bold flex items-center justify-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
                <span>心の中で {targetSeconds}秒 をカウント中…！</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                「今だ！」と思ったら下のストップをタップ！
              </p>
            </div>
          ) : result ? (
            /* 結果発表 */
            <div className="text-center animate-in zoom-in-95 duration-200 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>{getRating(result.diff).badge}</span>
              </div>

              <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {result.actual.toFixed(2)}
                <span className="text-xl font-normal text-slate-400 ml-1">秒</span>
              </div>

              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-300">目標: {targetSeconds}秒</span>
                <span
                  className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                    Math.abs(result.diff) <= 0.5
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                  }`}
                >
                  誤差 {result.diff > 0 ? `+${result.diff.toFixed(2)}` : result.diff.toFixed(2)}秒
                </span>
              </div>

              <p className={`text-sm font-bold mt-2 ${getRating(result.diff).color}`}>
                {getRating(result.diff).text}
              </p>
            </div>
          ) : (
            /* 待機状態 */
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-black text-slate-500 font-mono tracking-wider">
                {targetSeconds}.00
                <span className="text-xl font-normal text-slate-600 ml-1">秒</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                「スタート」を押すと数字が隠れます！
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 通常カウントダウン表示 */
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-3xl border border-white/15 mb-4 relative min-h-[170px]">
          <div
            className={`text-6xl sm:text-7xl font-black font-mono tracking-tight transition-colors ${
              remainingSec <= 3 && remainingSec > 0
                ? "text-rose-400 animate-ping"
                : remainingSec === 0
                ? "text-rose-500"
                : "text-pink-300"
            }`}
          >
            {remainingSec}
            <span className="text-2xl font-normal text-slate-400 ml-1">秒</span>
          </div>

          {remainingSec === 0 && (
            <div className="mt-2 text-rose-400 font-black text-base animate-bounce flex items-center gap-1">
              <Award className="w-5 h-5" />
              <span>TIME UP!! 終了！</span>
            </div>
          )}
          {isRunning && (
            <div className="mt-2 text-xs text-purple-200 animate-pulse font-medium">
              カウントダウン進行中…
            </div>
          )}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={mode === "blind" ? handleBlindToggle : handleCountdownToggle}
          className={`col-span-2 py-3.5 px-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
            isRunning
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/40"
              : mode === "blind"
              ? "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/30"
              : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-pink-500/30"
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>{mode === "blind" ? "ストップ！（判定）" : "ストップ"}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>スタート！</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="py-3.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1 border border-white/15 shadow-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>リセット</span>
        </button>
      </div>
    </div>
  );
}
