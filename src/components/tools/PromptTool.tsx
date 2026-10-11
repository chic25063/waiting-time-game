"use client";

import { useState, useMemo } from "react";
import { PromptItem, RiddlePrompt } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Sparkles,
  Shuffle,
  Eye,
  EyeOff,
  HelpCircle,
  History,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface PromptToolProps {
  prompts?: PromptItem[];
  gameTitle?: string;
}

export default function PromptTool({ prompts = [], gameTitle = "ゲーム" }: PromptToolProps) {
  // シャッフルされたインデックスリスト
  const [order, setOrder] = useState<number[]>(() => {
    return Array.from({ length: prompts.length }, (_, i) => i).sort(
      () => Math.random() - 0.5
    );
  });
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // 現在のお題
  const currentPromptIndex = order[currentIndex];
  const currentPrompt: PromptItem | undefined = prompts[currentPromptIndex];

  const isRiddle = useMemo(() => {
    return (
      currentPrompt !== undefined &&
      typeof currentPrompt === "object" &&
      "question" in currentPrompt &&
      "answer" in currentPrompt
    );
  }, [currentPrompt]);

  const riddleData = isRiddle ? (currentPrompt as RiddlePrompt) : null;
  const promptText = typeof currentPrompt === "string" ? currentPrompt : riddleData?.question;

  const handleNextPrompt = () => {
    if (prompts.length === 0) return;
    sound.playGacha();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 250);

    // 現在のインデックスを履歴に追加
    setHistory((prev) => [currentPromptIndex, ...prev.slice(0, 9)]);
    setShowAnswer(false);
    setShowHint(false);

    if (currentIndex + 1 >= order.length) {
      // 1周したら再シャッフル
      const newOrder = Array.from({ length: prompts.length }, (_, i) => i).sort(
        () => Math.random() - 0.5
      );
      setOrder(newOrder);
      setCurrentIndex(0);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    sound.playGacha();
    const newOrder = Array.from({ length: prompts.length }, (_, i) => i).sort(
      () => Math.random() - 0.5
    );
    setOrder(newOrder);
    setCurrentIndex(0);
    setHistory([]);
    setShowAnswer(false);
    setShowHint(false);
  };

  if (prompts.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 bg-white/5 rounded-3xl border border-white/10">
        お題データがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* お題カード */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-slate-900/80 border border-white/20 p-6 shadow-2xl backdrop-blur-xl">
        {/* 背景の光彩 */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "4s" }} />
            <span>お題ガチャ</span>
          </div>
          <div className="text-xs text-purple-200 font-medium">
            残り {order.length - currentIndex} / 全 {prompts.length} 問
          </div>
        </div>

        {/* お題本文エリア */}
        <div
          onClick={handleNextPrompt}
          className={`min-h-[140px] sm:min-h-[160px] flex flex-col justify-center items-center text-center p-4 rounded-2xl bg-slate-950/40 border border-white/10 cursor-pointer select-none transition-all duration-200 active:scale-[0.98] ${
            isAnimating ? "scale-95 opacity-60" : "scale-100 opacity-100"
          }`}
        >
          <span className="text-[11px] text-purple-300/80 mb-2 font-semibold">
            タップで次のお題へ！
          </span>
          <p className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-wide drop-shadow-md">
            {promptText}
          </p>
        </div>

        {/* ウミガメ等の真相・ヒント表示エリア */}
        {isRiddle && riddleData && (
          <div className="mt-4 flex flex-col gap-2.5">
            {riddleData.hint && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-200 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>出題ヒント（困った時用）</span>
                  </span>
                  <span>{showHint ? "閉じる" : "表示する"}</span>
                </button>
                {showHint && (
                  <div className="mt-1.5 p-3 rounded-xl bg-amber-950/40 border border-amber-400/20 text-xs text-amber-100 leading-relaxed animate-in fade-in">
                    💡 {riddleData.hint}
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  showAnswer
                    ? "bg-rose-500/25 border border-rose-400/40 text-rose-200"
                    : "bg-white/10 hover:bg-white/20 border border-white/15 text-purple-200"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswer ? "GM用の真相を隠す" : "GM用の真相を見る（回答者注意）"}</span>
                </span>
                <span>{showAnswer ? "非表示" : "確認する"}</span>
              </button>
              {showAnswer && (
                <div className="mt-2 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-100 leading-relaxed space-y-1 animate-in fade-in zoom-in-95">
                  <div className="font-bold text-rose-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>真相・解説</span>
                  </div>
                  <p className="whitespace-pre-wrap">{riddleData.answer}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* コントロールボタン群 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleNextPrompt}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span>次のお題を引く</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>シャッフル初期化</span>
          </button>
        </div>
      </div>

      {/* 過去のお題履歴 */}
      {history.length > 0 && (
        <details className="group bg-white/5 rounded-2xl border border-white/10 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-slate-300 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-300" />
              <span>直前のお題履歴 ({history.length}件)</span>
            </span>
            <span className="text-[10px] text-purple-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-white/10">
            {history.map((histIdx, i) => {
              const item = prompts[histIdx];
              const text = typeof item === "string" ? item : item?.question;
              return (
                <div
                  key={`${histIdx}-${i}`}
                  className="p-2 rounded-lg bg-white/5 text-slate-300 text-[11px] flex items-center gap-2"
                >
                  <span className="text-slate-500 font-mono text-[10px]">#{i + 1}</span>
                  <span className="truncate">{text}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
