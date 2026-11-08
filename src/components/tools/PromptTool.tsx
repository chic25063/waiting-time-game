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

export default function PromptTool({
  prompts = [],
}: PromptToolProps) {
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
  const promptText =
    typeof currentPrompt === "string" ? currentPrompt : riddleData?.question;

  const handleNextPrompt = () => {
    if (prompts.length === 0) return;
    sound.playGacha();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);

    setHistory((prev) => [currentPromptIndex, ...prev.slice(0, 9)]);
    setShowAnswer(false);
    setShowHint(false);

    if (currentIndex + 1 >= order.length) {
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
      <div className="p-6 text-center text-[#2B2D42]/60 font-bold bg-white rounded-3xl border-2 border-[#2B2D42] shadow-[4px_5px_0_#2B2D42]">
        お題データがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* お題カード */}
      <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#2B2D42] p-5 sm:p-6 shadow-[4px_5px_0_#2B2D42] text-[#2B2D42]">
        {/* 右上の斜め蛍光マーカー装飾 */}
        <div
          className="absolute top-0 right-0 w-36 h-16 pointer-events-none opacity-65"
          style={{
            backgroundColor: "#F9B8E0",
            clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 0)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9B8E0] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>お題ガチャ</span>
          </div>
          <div className="text-xs text-[#2B2D42]/75 font-extrabold">
            残り {order.length - currentIndex} / 全 {prompts.length} 問
          </div>
        </div>

        {/* お題本文エリア */}
        <div
          onClick={handleNextPrompt}
          className={`relative z-10 min-h-[130px] sm:min-h-[150px] flex flex-col justify-center items-center text-center p-4 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] cursor-pointer select-none transition-all duration-150 active:scale-[0.98] ${
            isAnimating ? "scale-95 opacity-60" : "scale-100 opacity-100"
          }`}
        >
          <span className="text-[11px] text-[#2B2D42]/65 mb-2 font-extrabold">
            タップで次のお題へ！
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#2B2D42] leading-relaxed tracking-wide">
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
                  className="w-full py-2 px-3 rounded-xl bg-[#FFF275] hover:brightness-95 border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>出題ヒント（困った時用）</span>
                  </span>
                  <span>{showHint ? "閉じる" : "表示する"}</span>
                </button>
                {showHint && (
                  <div className="mt-1.5 p-3 rounded-xl bg-[#FAF6EB] border-2 border-[#2B2D42] text-xs font-bold text-[#2B2D42] leading-relaxed">
                    💡 {riddleData.hint}
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-between border-2 border-[#2B2D42] transition-all cursor-pointer ${
                  showAnswer
                    ? "bg-[#FFADAD] text-[#2B2D42]"
                    : "bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {showAnswer ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showAnswer
                      ? "GM用の真相を隠す"
                      : "GM用の真相を見る（回答者注意）"}
                  </span>
                </span>
                <span>{showAnswer ? "非表示" : "確認する"}</span>
              </button>
              {showAnswer && (
                <div className="mt-2 p-3.5 rounded-2xl bg-[#FFADAD]/35 border-2 border-[#2B2D42] text-xs font-bold text-[#2B2D42] leading-relaxed space-y-1">
                  <div className="font-black flex items-center gap-1">
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
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleNextPrompt}
            className="py-3 px-4 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-sm flex items-center justify-center gap-2 shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>次のお題を引く</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-4 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>シャッフル初期化</span>
          </button>
        </div>
      </div>

      {/* 過去のお題履歴 */}
      {history.length > 0 && (
        <details className="group bg-white rounded-2xl border-2 border-[#2B2D42] p-3 text-xs shadow-[2px_3px_0_#2B2D42]">
          <summary className="cursor-pointer font-black text-[#2B2D42] flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>直前のお題履歴 ({history.length}件)</span>
            </span>
            <span className="text-[10px] group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-2.5 space-y-1.5 pt-2 border-t-2 border-dashed border-[#2B2D42]/20">
            {history.map((histIdx, i) => {
              const item = prompts[histIdx];
              const text = typeof item === "string" ? item : item?.question;
              return (
                <div
                  key={`${histIdx}-${i}`}
                  className="p-2 rounded-lg bg-[#FAF6EB] border border-[#2B2D42]/25 text-[#2B2D42] font-bold text-[11px] flex items-center gap-2"
                >
                  <span className="text-[#2B2D42]/60 font-mono text-[10px]">
                    #{i + 1}
                  </span>
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
