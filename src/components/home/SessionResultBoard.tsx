"use client";

import React, { useEffect } from "react";
import { Award, RotateCcw } from "lucide-react";
import { useGameSession } from "@/hooks/useGameSession";
import { loadStoredPlayers } from "@/lib/playerStorage";
import { PlayerStampAvatar } from "@/components/match/StepByStepGameFlow";
import { sound } from "@/lib/sound";

interface SessionResultBoardProps {
  compact?: boolean;
}

export default function SessionResultBoard({
  compact = false,
}: SessionResultBoardProps) {
  const {
    players: sessionPlayers,
    resetSessionWins,
    syncSessionPlayers,
  } = useGameSession();

  // 初回マウント時、もしセッションにプレイヤーがいなければ保存済みプレイヤーを同期
  useEffect(() => {
    if (sessionPlayers.length === 0) {
      const stored = loadStoredPlayers(3);
      if (stored.length > 0) {
        syncSessionPlayers(stored);
      }
    }
  }, [sessionPlayers.length, syncSessionPlayers]);

  if (sessionPlayers.length === 0) return null;

  const maxWins = Math.max(...sessionPlayers.map((p) => p.totalWins), 0);
  const totalStars = sessionPlayers.reduce((sum, p) => sum + p.totalWins, 0);

  // 勝ち星が多い順にソート（同率の場合はID順）
  const sortedPlayers = [...sessionPlayers].sort((a, b) => {
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins;
    }
    return a.id.localeCompare(b.id);
  });

  const handleReset = () => {
    if (confirm("全員の通算★数を 0 にリセットしますか？")) {
      sound.playTick();
      resetSessionWins();
    }
  };

  return (
    <section
      aria-label="現在のリザルト"
      className={`w-full rounded-3xl bg-white border-[2.5px] border-[#2B2D42] shadow-[4px_5px_0_#2B2D42] ${
        compact ? "p-3.5 sm:p-4" : "p-4 sm:p-5"
      }`}
    >
      {/* 見出しバー */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b-2 border-dashed border-[#2B2D42]/20">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#FFE066] border-2 border-[#2B2D42] flex items-center justify-center shadow-[1px_2px_0_#2B2D42] shrink-0">
            <Award className="w-4 h-4 text-[#2B2D42] stroke-[2.5]" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#2B2D42] leading-tight">
              現在のリザルト（通算★）
            </h3>
            <p className="text-[10px] font-bold text-[#2B2D42]/65">
              合計 {totalStars} ゲーム決着
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1.5 rounded-xl bg-[#FAF6EB] hover:bg-[#FFADAD] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42] active:translate-y-0.5 flex items-center gap-1 text-[11px] font-black text-[#2B2D42] transition-all cursor-pointer shrink-0"
          title="通算★数を0にリセット"
        >
          <RotateCcw className="w-3 h-3 stroke-[2.5]" />
          <span>★リセット</span>
        </button>
      </div>

      {/* プレイヤー2列グリッド（空きスペースで見やすく一覧表示） */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {sortedPlayers.map((player, index) => {
          const isTop = maxWins > 0 && player.totalWins === maxWins;
          const matchNum = player.id.match(/^p-(\d+)$/);
          const avatarIndex = matchNum
            ? Math.max(0, parseInt(matchNum[1], 10) - 1)
            : index;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl border-2 border-[#2B2D42] transition-all ${
                isTop
                  ? "bg-[#FFE066] shadow-[2px_3px_0_#2B2D42]"
                  : "bg-[#FAF6EB]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <PlayerStampAvatar index={avatarIndex} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded border border-[#2B2D42] ${
                        isTop
                          ? "bg-white text-[#2B2D42]"
                          : "bg-white/80 text-[#2B2D42]/75"
                      }`}
                    >
                      {index + 1}位
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#2B2D42] truncate mt-0.5">
                    {player.name}
                  </div>
                </div>
              </div>

              <div className="px-2 py-1 rounded-xl bg-white border-2 border-[#2B2D42] text-xs sm:text-sm font-black text-[#2B2D42] shrink-0 shadow-[1px_1px_0_#2B2D42]">
                ★{player.totalWins}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
