"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, RotateCcw, LayoutGrid, Sparkles } from "lucide-react";
import { useGameSession } from "@/hooks/useGameSession";

interface MatchWinnerModalProps {
  winnerId: string;
  winnerName: string;
  isOpen: boolean;
  onRematch: () => void;
  onClose?: () => void;
}

export default function MatchWinnerModal({
  winnerId,
  winnerName,
  isOpen,
  onRematch,
}: MatchWinnerModalProps) {
  const { players: sessionPlayers, recordWin } = useGameSession();
  const [recorded, setRecorded] = useState(false);

  // モーダルが開いた時に通算成績に+1を記録
  useEffect(() => {
    if (isOpen && winnerId && !recorded) {
      recordWin(winnerId);
      setRecorded(true);
    }
    if (!isOpen) {
      setRecorded(false);
    }
  }, [isOpen, winnerId, recorded, recordWin]);

  if (!isOpen) return null;

  // 最新の通算ランキング（勝利数順にソート）
  const sortedPlayers = [...sessionPlayers].sort((a, b) => {
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* 紙吹雪エフェクト（CSSベース） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-bounce"
            style={{
              left: `${(i * 17) % 95}%`,
              top: `${(i * 23) % 80}%`,
              width: `${(i % 3) * 6 + 8}px`,
              height: `${(i % 3) * 6 + 8}px`,
              backgroundColor: ["#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#EC4899", "#8B5CF6"][
                i % 6
              ],
              opacity: 0.7,
              animationDuration: `${1.5 + (i % 5) * 0.4}s`,
              animationDelay: `${(i % 4) * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-center text-white overflow-hidden">
        {/* 背景の光彩 */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* トロフィーアイコン */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full shadow-lg shadow-amber-500/30 animate-pulse">
          <Trophy className="w-10 h-10 text-gray-950" />
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-200 animate-spin" style={{ animationDuration: "6s" }} />
        </div>

        {/* 勝者タイトル */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-black text-amber-400 mb-1">
            🎉 WINNER !! 🎉
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
            {winnerName}
          </h2>
          <p className="text-xs text-amber-400/80 mt-1 font-medium">
            通算 ★ +1 獲得！
          </p>
        </div>

        {/* 通算ランキング */}
        <div className="mb-6 bg-gray-950/70 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center justify-center gap-1.5">
            <span>📊</span> 本日の通算ランキング
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((player, index) => {
              const isWinner = player.id === winnerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                    isWinner
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold"
                      : "bg-gray-900/60 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-left text-xs font-bold text-gray-500">
                      {index === 0 ? "👑" : `${index + 1}位`}
                    </span>
                    <span className="truncate max-w-[140px]">{player.name}</span>
                    {isWinner && (
                      <span className="text-[10px] bg-amber-400 text-gray-950 px-1.5 py-0.5 rounded-full font-black">
                        UP!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-extrabold text-amber-400">
                    <span>★</span>
                    <span className="text-base">{player.totalWins}</span>
                    <span className="text-xs text-gray-400 font-normal">勝</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* アクション導線（シンプル2大ボタン） */}
        <div className="space-y-3">
          <button
            onClick={onRematch}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>🔄 もう1戦！（リベンジ）</span>
          </button>

          <Link
            href="/"
            className="w-full py-3.5 px-6 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-sm rounded-2xl border border-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span>🎲 次の対戦ゲームを選ぶ（通算★引継）</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
