"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, LayoutGrid, Award } from "lucide-react";
import { useGameSession } from "@/hooks/useGameSession";

interface MatchWinnerModalProps {
  winnerId: string;
  winnerName: string;
  isOpen: boolean;
  onRematch: () => void;
  onClose?: () => void;
}

/** ボールペン手書き風トロフィー＆王冠スタンプSVG */
function WinnerTrophyDoodle({ className = "w-14 h-14" }: { className?: string }) {
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
      <path d="M32 21 L34 26 L39 26 L35 29 L36.5 34 L32 31 L27.5 34 L29 29 L25 26 L30 26 Z" fill="#FFE066" />
      <path d="M10 9 L13 12 M54 9 L51 12 M32 5 V9" />
    </svg>
  );
}

export default function MatchWinnerModal({
  winnerId,
  winnerName,
  isOpen,
  onRematch,
}: MatchWinnerModalProps) {
  const { players: sessionPlayers, recordWin, resetSessionWins } = useGameSession();
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (isOpen && winnerId && !recorded) {
      recordWin(winnerId, winnerName);
      setRecorded(true);
    }
    if (!isOpen) {
      setRecorded(false);
    }
  }, [isOpen, winnerId, winnerName, recorded, recordWin]);

  if (!isOpen) return null;

  const sortedPlayers = [...sessionPlayers].sort((a, b) => {
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins;
    }
    return a.name.localeCompare(b.name);
  });

  const handleResetStars = () => {
    if (confirm("全員の通算★数を 0 にリセットしますか？")) {
      resetSessionWins();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2D42]/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* ノート切れ端風・紙吹雪エフェクト */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-xs border border-[#2B2D42] animate-bounce"
            style={{
              left: `${(i * 17) % 95}%`,
              top: `${(i * 23) % 80}%`,
              width: `${(i % 3) * 5 + 8}px`,
              height: `${(i % 3) * 5 + 8}px`,
              backgroundColor: ["#FFE066", "#FFADAD", "#7CE8DC", "#9AF0A8", "#F9B8E0", "#CBC8FA"][
                i % 6
              ],
              animationDuration: `${1.5 + (i % 5) * 0.4}s`,
              animationDelay: `${(i % 4) * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* メインの大学ノートカード */}
      <div
        className="relative w-full max-w-md bg-[#FAF6EB] border-[3px] border-[#2B2D42] rounded-3xl p-5 sm:p-7 shadow-[6px_8px_0_#2B2D42] text-[#2B2D42] overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, #C5D6E8 27px, #C5D6E8 28px)",
          backgroundPosition: "0 12px",
        }}
      >
        {/* 勝者メインカード */}
        <div className="relative bg-white border-[2.5px] border-[#2B2D42] rounded-2xl p-5 mb-5 shadow-[3px_4px_0_#2B2D42] overflow-hidden text-left">
          <div
            className="absolute inset-y-0 right-0 w-[38%] pointer-events-none"
            style={{
              backgroundColor: "#FFE066",
              clipPath: "polygon(32% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          />

          <div className="relative z-10 pr-16">
            <span className="inline-block text-xs font-black text-[#2B2D42] bg-[#FFF275] px-2.5 py-0.5 rounded-md border-2 border-[#2B2D42] mb-2">
              勝者決定！
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42] leading-tight break-words">
              {winnerName}
            </h2>
            <p className="text-xs font-black text-[#2B2D42]/80 mt-1.5">
              通算 ★ +1 獲得！
            </p>
          </div>

          <div className="absolute right-3 bottom-2 z-10 pointer-events-none">
            <WinnerTrophyDoodle className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>
        </div>

        {/* 本日の通算ランキング（右上に★リセットボタン付き） */}
        <div className="mb-5 bg-white border-[2.5px] border-[#2B2D42] rounded-2xl p-4 shadow-[3px_4px_0_#2B2D42]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-[#2B2D42] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#2B2D42]" />
              <span>本日の通算ランキング</span>
            </h3>
            <button
              type="button"
              onClick={handleResetStars}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF6EB] hover:bg-[#FFADAD] border-2 border-[#2B2D42] text-[11px] font-black text-[#2B2D42] transition-colors cursor-pointer"
              title="通算★数を0にリセット"
            >
              <RotateCcw className="w-3 h-3" />
              <span>★リセット</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((player, index) => {
              const isWinner =
                player.id === winnerId || player.name === winnerName;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border-2 border-[#2B2D42] transition-all ${
                    isWinner
                      ? "bg-[#FFE066] text-[#2B2D42] font-black shadow-[2px_2px_0_#2B2D42]"
                      : "bg-[#FAF6EB] text-[#2B2D42] font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="w-8 text-left text-xs font-black text-[#2B2D42] shrink-0">
                      {index + 1}位
                    </span>
                    <span className="break-words leading-snug">{player.name}</span>
                    {isWinner && (
                      <span className="text-[10px] bg-white text-[#2B2D42] border border-[#2B2D42] px-2 py-0.5 rounded-full font-black shrink-0">
                        +1勝
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-black text-[#2B2D42] shrink-0">
                    <span>★</span>
                    <span className="text-base">{player.totalWins}</span>
                    <span className="text-xs text-[#2B2D42]/75 font-bold">勝</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="space-y-2.5">
          <button
            onClick={onRematch}
            className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] font-black text-base sm:text-lg rounded-2xl border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>もう1戦！（リベンジ）</span>
          </button>

          <Link
            href="/?catalog=1"
            className="w-full py-3.5 px-6 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] font-black text-sm rounded-2xl border-[2.5px] border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4 stroke-[2.5] text-[#2B2D42]" />
            <span>次の対戦ゲームを選ぶ（通算★引継）</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
