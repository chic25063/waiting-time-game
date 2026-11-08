"use client";

import React, { useState } from "react";
import { MatchSessionConfig, MatchProgressState } from "@/types/matchMode";
import {
  Flame,
  Home,
  Dices,
  Trophy,
  Skull,
  Target,
  Swords,
} from "lucide-react";

interface ArenaHeaderProps {
  config: MatchSessionConfig;
  state: MatchProgressState;
  onReroll: () => void;
  onQuit: () => void;
}

export default function ArenaHeader({
  config,
  state,
  onReroll,
  onQuit,
}: ArenaHeaderProps) {
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);

  const getRuleBadge = () => {
    if (state.isSuddenDeath) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#FFADAD] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black animate-pulse flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" />
          <span>同点サドンデス延長戦！</span>
        </span>
      );
    }

    if (config.mode === "duel_1v1") {
      const targetWins = config.duelRule === "first_to_5" ? 5 : 3;
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#7CE8DC] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black flex items-center gap-1">
          <Swords className="w-3.5 h-3.5" />
          <span>1vs1 【{targetWins}本先取】</span>
        </span>
      );
    }

    if (config.multiRuleType === "point_race") {
      const goalText =
        config.pointRaceGoal === "points_3"
          ? "3点先取"
          : config.pointRaceGoal === "rounds_3"
          ? "全3回戦"
          : "全5回戦";
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#7CE8DC] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          <span>点数制 【{goalText}】</span>
        </span>
      );
    }

    if (config.multiRuleType === "survival_knockout") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#E8F655] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" />
          <span>勝ち残り制</span>
        </span>
      );
    }

    if (config.multiRuleType === "loser_king") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-[#FFADAD] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black flex items-center gap-1">
          <Skull className="w-3.5 h-3.5" />
          <span>最弱王決定戦</span>
        </span>
      );
    }

    return null;
  };

  return (
    <header className="w-full bg-[#FAF6EB]/95 backdrop-blur-xs border-b-2 border-[#2B2D42] p-3 sm:p-4 sticky top-0 z-40 space-y-3">
      {/* 上部: ナビゲーション・タイトル・リロール */}
      <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setShowConfirmQuit(true)}
          className="w-10 h-10 rounded-xl bg-white border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] text-[#2B2D42] hover:bg-amber-50 flex items-center justify-center transition-all cursor-pointer"
          title="トップへ戻る"
          aria-label="トップへ戻る"
        >
          <Home className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-xl bg-[#2B2D42] text-white font-black text-xs sm:text-sm">
            第{state.currentRound}戦
          </span>
          {getRuleBadge()}
        </div>

        {/* リロール（再抽選）ボタン */}
        <button
          type="button"
          onClick={onReroll}
          className="px-3 py-2 rounded-xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
          title="別のゲームを引き直す"
        >
          <Dices className="w-4 h-4" />
          <span>引き直す</span>
        </button>
      </div>

      {/* 下部: プレイヤーステータスバー */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 max-w-xl mx-auto">
        {config.players.map((p) => {
          const score = state.playerScores[p.id] || 0;
          const isEliminated = state.eliminatedPlayerIds.includes(p.id);
          const isEscaped = state.escapedPlayerIds.includes(p.id);
          const isSuddenDeathTarget =
            state.isSuddenDeath && state.suddenDeathPlayerIds?.includes(p.id);

          return (
            <div
              key={p.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 border-2 transition-all ${
                isEliminated
                  ? "bg-slate-200 border-[#2B2D42]/30 text-[#2B2D42]/45 line-through"
                  : isEscaped
                  ? "bg-[#9AF0A8] border-[#2B2D42] text-[#2B2D42]"
                  : isSuddenDeathTarget
                  ? "bg-[#FFADAD] border-[#2B2D42] text-[#2B2D42] animate-pulse"
                  : "bg-white border-[#2B2D42] text-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
              }`}
            >
              <span className="truncate max-w-[80px]">{p.name}</span>

              {(config.mode === "duel_1v1" ||
                config.multiRuleType === "point_race") && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#FFE066] border border-[#2B2D42] text-[#2B2D42] font-black text-[10px]">
                  ★ {score}
                </span>
              )}

              {config.multiRuleType === "survival_knockout" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF6EB] border border-[#2B2D42]/40">
                  {isEliminated ? "脱落" : "生存"}
                </span>
              )}

              {config.multiRuleType === "loser_king" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF6EB] border border-[#2B2D42]/40">
                  {isEscaped ? "🎉 勝ち抜け" : "対戦中"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 離脱確認モーダル */}
      {showConfirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <div className="bg-[#FAF6EB] border-2 border-[#2B2D42] p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-[6px_7px_0_#2B2D42] text-[#2B2D42]">
            <h3 className="text-base font-black">対戦を中断しますか？</h3>
            <p className="text-xs font-bold text-[#2B2D42]/75">
              現在の対戦データはリセットされます。
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmQuit(false)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] cursor-pointer"
              >
                続ける
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="flex-1 py-2.5 rounded-xl bg-[#FFADAD] hover:brightness-95 border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] cursor-pointer"
              >
                トップへ戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
