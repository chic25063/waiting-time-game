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
  defaultDuration?: number;
  isBlindDefault?: boolean;
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
  const [result, setResult] = useState<{ actual: number; diff: number } | null>(
    null
  );

  const startTimeRef = useRef<number>(0);
  const timerFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (mode !== "countdown" || !isRunning) {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
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
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [mode, isRunning]);

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

  const getRating = (diff: number) => {
    const abs = Math.abs(diff);
    if (abs < 0.2)
      return { text: "神の体内時計！完全感覚！", badge: "大成功！" };
    if (abs < 0.5)
      return { text: "凄まじい精度！お見事！", badge: "すばらしい！" };
    if (abs < 1.0)
      return { text: "ナイス！ほぼピッタリ！", badge: "おしい！" };
    if (abs < 2.0) return { text: "あと一歩！", badge: "まずまず" };
    return { text: "体内時計がズレてるかも？！", badge: "ずれすぎ！" };
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#2B2D42] p-5 sm:p-6 shadow-[4px_5px_0_#2B2D42] text-[#2B2D42]">
      {/* 右上の斜め蛍光マーカー装飾 */}
      <div
        className="absolute top-0 right-0 w-36 h-16 pointer-events-none opacity-65"
        style={{
          backgroundColor: "#7CE8DC",
          clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 0)",
        }}
      />

      {/* ヘッダーエリア & モード切替タブ */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7CE8DC] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
          <Clock className="w-3.5 h-3.5" />
          <span>タイマー</span>
        </div>

        {/* モード選択 */}
        <div className="flex bg-[#FAF6EB] rounded-xl p-1 border-2 border-[#2B2D42] text-xs font-black">
          <button
            type="button"
            onClick={() => {
              handleReset();
              setMode("blind");
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mode === "blind"
                ? "bg-[#2B2D42] text-white"
                : "text-[#2B2D42]/70 hover:text-[#2B2D42]"
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
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mode === "countdown"
                ? "bg-[#2B2D42] text-white"
                : "text-[#2B2D42]/70 hover:text-[#2B2D42]"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>カウントダウン</span>
          </button>
        </div>
      </div>

      {/* 目標秒数プリセット */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-[#FAF6EB] p-2.5 rounded-2xl border-2 border-[#2B2D42]">
        <span className="text-xs text-[#2B2D42] font-black pl-1">
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
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border border-[#2B2D42] cursor-pointer ${
                targetSeconds === s
                  ? "bg-[#7CE8DC] text-[#2B2D42]"
                  : "bg-white hover:bg-slate-100 text-[#2B2D42]/70"
              }`}
            >
              {s}秒
            </button>
          ))}
        </div>
      </div>

      {/* メインタイマー表示エリア */}
      {mode === "blind" ? (
        <div className="flex flex-col items-center justify-center p-6 bg-[#FAF6EB] rounded-2xl border-2 border-[#2B2D42] mb-4 relative overflow-hidden min-h-[160px]">
          {isRunning ? (
            <div className="text-center animate-pulse">
              <div className="text-5xl sm:text-6xl font-black text-[#2B2D42] tracking-wider font-mono">
                ??.??
              </div>
              <div className="mt-2 text-xs sm:text-sm text-[#2B2D42] font-black flex items-center justify-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                <span>心の中で {targetSeconds}秒 をカウント中…！</span>
              </div>
              <p className="text-[11px] font-bold text-[#2B2D42]/65 mt-1">
                「今だ！」と思ったら下のストップをタップ！
              </p>
            </div>
          ) : result ? (
            <div className="text-center animate-in zoom-in-95 duration-200 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFE066] border border-[#2B2D42] text-[#2B2D42] text-[11px] font-black mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>{getRating(result.diff).badge}</span>
              </div>

              <div className="text-5xl sm:text-6xl font-black text-[#2B2D42] font-mono tracking-tight">
                {result.actual.toFixed(2)}
                <span className="text-xl font-bold text-[#2B2D42]/70 ml-1">
                  秒
                </span>
              </div>

              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-[#2B2D42]/80">
                  目標: {targetSeconds}秒
                </span>
                <span
                  className={`text-sm font-black px-2.5 py-0.5 rounded-full border border-[#2B2D42] ${
                    Math.abs(result.diff) <= 0.5
                      ? "bg-[#9AF0A8] text-[#2B2D42]"
                      : "bg-[#FFADAD] text-[#2B2D42]"
                  }`}
                >
                  誤差{" "}
                  {result.diff > 0
                    ? `+${result.diff.toFixed(2)}`
                    : result.diff.toFixed(2)}
                  秒
                </span>
              </div>

              <p className="text-sm font-black mt-2 text-[#2B2D42]">
                {getRating(result.diff).text}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-black text-[#2B2D42]/50 font-mono tracking-wider">
                {targetSeconds}.00
                <span className="text-xl font-bold text-[#2B2D42]/50 ml-1">
                  秒
                </span>
              </div>
              <p className="text-xs font-bold text-[#2B2D42]/65 mt-2">
                「スタート」を押すと数字が隠れます！
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 bg-[#FAF6EB] rounded-2xl border-2 border-[#2B2D42] mb-4 relative min-h-[160px]">
          <div
            className={`text-6xl sm:text-7xl font-black font-mono tracking-tight transition-colors ${
              remainingSec <= 3 && remainingSec > 0
                ? "text-rose-600 animate-ping"
                : remainingSec === 0
                ? "text-rose-600"
                : "text-[#2B2D42]"
            }`}
          >
            {remainingSec}
            <span className="text-2xl font-bold text-[#2B2D42]/70 ml-1">
              秒
            </span>
          </div>

          {remainingSec === 0 && (
            <div className="mt-2 text-rose-600 font-black text-base animate-bounce flex items-center gap-1">
              <Award className="w-5 h-5" />
              <span>時間切れ！終了！</span>
            </div>
          )}
          {isRunning && (
            <div className="mt-2 text-xs text-[#2B2D42]/75 animate-pulse font-bold">
              カウントダウン進行中…
            </div>
          )}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={
            mode === "blind" ? handleBlindToggle : handleCountdownToggle
          }
          className={`col-span-2 py-3.5 px-4 rounded-2xl border-2 border-[#2B2D42] font-black text-base flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer ${
            isRunning
              ? "bg-[#FFADAD] text-[#2B2D42]"
              : "bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42]"
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
          className="py-3.5 px-3 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 border-2 border-[#2B2D42] text-[#2B2D42] font-black text-xs flex items-center justify-center gap-1 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>リセット</span>
        </button>
      </div>
    </div>
  );
}
