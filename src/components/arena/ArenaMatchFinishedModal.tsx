"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { MatchSessionConfig, MatchProgressState } from "@/types/matchMode";
import {
  RotateCcw,
  SlidersHorizontal,
  Home,
  Share2,
  Check,
  Flame,
} from "lucide-react";

interface ArenaMatchFinishedModalProps {
  isOpen: boolean;
  config: MatchSessionConfig;
  state: MatchProgressState;
  onRematch: () => void;
  onChangeSettings: () => void;
  onGoHome: () => void;
}

/** ボールペン手書き風トロフィー＆ドクロスタンプSVG */
function ResultStampDoodle({
  isLoserKing,
  className = "w-14 h-14",
}: {
  isLoserKing: boolean;
  className?: string;
}) {
  if (isLoserKing) {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        stroke="#2B2D42"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M16 28 C16 15 48 15 48 28 C48 36 43 40 42 46 H22 C21 40 16 36 16 28 Z"
          fill="#FFFFFF"
        />
        <circle cx="25" cy="29" r="3.5" fill="#2B2D42" />
        <circle cx="39" cy="29" r="3.5" fill="#2B2D42" />
        <path d="M30 36 L32 33 L34 36" />
        <path d="M26 42 V46 M32 42 V46 M38 42 V46" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      stroke="#2B2D42"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 14 H46 V28 C46 37 39 43 32 43 C25 43 18 37 18 28 Z" fill="#FFFFFF" />
      <path d="M18 18 H11 C11 26 14 30 18 30" />
      <path d="M46 18 H53 C53 26 50 30 46 30" />
      <path d="M32 43 V51" />
      <path d="M22 51 H42 V56 H22 Z" fill="#FFFFFF" />
      <path
        d="M32 21 L34 26 L39 26 L35 29 L36.5 34 L32 31 L27.5 34 L29 29 L25 26 L30 26 Z"
        fill="#FFE066"
      />
    </svg>
  );
}

export default function ArenaMatchFinishedModal({
  isOpen,
  config,
  state,
  onRematch,
  onChangeSettings,
  onGoHome,
}: ArenaMatchFinishedModalProps) {
  const [copied, setCopied] = useState(false);

  const isLoserKingMode = config.multiRuleType === "loser_king";
  const winner = state.winnerPlayer;
  const loser = state.loserPlayer;

  useEffect(() => {
    if (!isOpen) return;

    if (!isLoserKingMode) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, isLoserKingMode]);

  if (!isOpen) return null;

  const handleCopyResult = () => {
    let text = "";
    if (isLoserKingMode) {
      const penaltyLine = config.loserPenaltyText
        ? `\n罰ゲーム: ${config.loserPenaltyText}`
        : "";
      text = `【マチジカン！負け残り王決定戦】\n本日の負け残り: ${
        loser?.name || "???"
      }${penaltyLine}\n#マチジカン`;
    } else {
      text = `【マチジカン！対戦結果】\n優勝: ${
        winner?.name || "???"
      }\n総ラウンド数: ${state.currentRound}回戦\n#マチジカン`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-md p-5 sm:p-7 rounded-3xl bg-[#FAF6EB] border-[3px] border-[#2B2D42] text-[#2B2D42] shadow-[6px_8px_0_#2B2D42] space-y-5 overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, #C5D6E8 27px, #C5D6E8 28px)",
          backgroundPosition: "0 12px",
        }}
      >
        {/* 勝者 / 負け残りメインカード（白カード＋斜め蛍光マーカー帯＋手書きイラスト） */}
        <div className="relative bg-white border-[2.5px] border-[#2B2D42] rounded-2xl p-5 shadow-[3px_4px_0_#2B2D42] overflow-hidden text-left">
          <div
            className="absolute inset-y-0 right-0 w-[38%] pointer-events-none"
            style={{
              backgroundColor: isLoserKingMode ? "#FFADAD" : "#FFE066",
              clipPath: "polygon(32% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          />

          <div className="relative z-10 pr-16">
            <span
              className={`inline-block text-xs font-black text-[#2B2D42] px-2.5 py-0.5 rounded-md border-2 border-[#2B2D42] mb-2 ${
                isLoserKingMode ? "bg-[#FFADAD]" : "bg-[#FFF275]"
              }`}
            >
              {isLoserKingMode ? "本日の負け残り決定" : "優勝決定！"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42] leading-tight break-words">
              {isLoserKingMode ? loser?.name || "???" : winner?.name || "???"}
            </h2>
            <p className="text-xs font-black text-[#2B2D42]/75 mt-1.5">
              {isLoserKingMode
                ? "最後まで勝ち抜けならず…！"
                : config.mode === "duel_1v1"
                ? `${config.duelRule === "first_to_5" ? 5 : 3}本先取で見事勝利！`
                : `全${state.currentRound}戦を制して優勝！`}
            </p>
          </div>

          <div className="absolute right-3 bottom-2 z-10 pointer-events-none">
            <ResultStampDoodle
              isLoserKing={isLoserKingMode}
              className="w-14 h-14 sm:w-16 sm:h-16"
            />
          </div>
        </div>

        {/* 罰ゲームがある場合のカード */}
        {isLoserKingMode && Boolean(config.loserPenaltyText) && (
          <div className="p-4 rounded-2xl bg-white border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] space-y-1 text-center">
            <div className="text-[11px] font-black text-[#2B2D42] flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>執行される罰ゲーム</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-[#2B2D42]">
              {config.loserPenaltyText}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onRematch}
            className="w-full py-4 px-4 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-[2.5px] border-[#2B2D42] font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>もう1戦プレイ（同じ設定で再戦）</span>
          </button>

          <button
            type="button"
            onClick={onChangeSettings}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] text-[#2B2D42] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            <span>設定やルールを変えて遊ぶ</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyResult}
              className="py-3 px-3 rounded-xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>コピー完了！</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>結果をコピー</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="py-3 px-3 rounded-xl bg-white hover:bg-[#FAF6EB] border-[2.5px] border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>トップへ戻る</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
