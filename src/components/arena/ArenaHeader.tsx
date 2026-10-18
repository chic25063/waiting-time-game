"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MatchSessionConfig, MatchProgressState } from "@/types/matchMode";
import {
  Flame,
  RotateCcw,
  Home,
  Dices,
  Trophy,
  Skull,
  Target,
  Swords,
  Users,
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

  // ルールタイトル生成
  const getRuleBadge = () => {
    if (state.isSuddenDeath) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black animate-pulse flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>同点サドンデス延長戦！</span>
        </span>
      );
    }

    if (config.mode === "duel_1v1") {
      const targetWins = config.duelRule === "first_to_5" ? 5 : 3;
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-1">
          <Swords className="w-3.5 h-3.5 text-rose-400" />
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
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span>点数制 【{goalText}】</span>
        </span>
      );
    }

    if (config.multiRuleType === "survival_knockout") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>勝ち残り制（サバイバル）</span>
        </span>
      );
    }

    if (config.multiRuleType === "loser_king") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black flex items-center gap-1">
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>負け残り最弱王決定戦</span>
        </span>
      );
    }

    return null;
  };

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-white/10 p-3 sm:p-4 sticky top-0 z-40 space-y-3">
      {/* 上部: ナビゲーション・タイトル・リロール */}
      <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setShowConfirmQuit(true)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs flex items-center gap-1 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">トップへ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-white/10 text-white font-black text-xs sm:text-sm">
            ROUND {state.currentRound}
          </span>
          {getRuleBadge()}
        </div>

        {/* リロール（再抽選）ボタン */}
        <button
          type="button"
          onClick={onReroll}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
          title="別のゲームを引き直す"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>リロール</span>
        </button>
      </div>

      {/* 下部: プレイヤーステータスバー */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 max-w-2xl mx-auto">
        {config.players.map((p, idx) => {
          const score = state.playerScores[p.id] || 0;
          const isEliminated = state.eliminatedPlayerIds.includes(p.id);
          const isEscaped = state.escapedPlayerIds.includes(p.id);
          const isSuddenDeathTarget =
            state.isSuddenDeath && state.suddenDeathPlayerIds?.includes(p.id);

          return (
            <div
              key={p.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border transition-all ${
                isEliminated
                  ? "bg-gray-950/40 border-gray-800 text-gray-500 line-through opacity-60"
                  : isEscaped
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : isSuddenDeathTarget
                  ? "bg-rose-950/60 border-rose-500 text-rose-200 animate-pulse"
                  : "bg-white/5 border-white/10 text-white"
              }`}
            >
              <span className="truncate max-w-[80px]">{p.name}</span>

              {/* 1vs1または点数制のスコア */}
              {(config.mode === "duel_1v1" || config.multiRuleType === "point_race") && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px]">
                  ★ {score}
                </span>
              )}

              {/* 勝ち残り制の脱落バッジ */}
              {config.multiRuleType === "survival_knockout" && (
                <span className="text-[10px]">
                  {isEliminated ? "💀 OUT" : "ALIVE"}
                </span>
              )}

              {/* 最弱王決定戦の勝ち抜けバッジ */}
              {config.multiRuleType === "loser_king" && (
                <span className="text-[10px]">
                  {isEscaped ? "🎉 SAFE" : "⚠️ 参戦中"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 離脱確認モーダル */}
      {showConfirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/20 p-6 rounded-3xl max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-black text-white">対戦を中断しますか？</h3>
            <p className="text-xs text-slate-400">
              現在の対戦データはリセットされます。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmQuit(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
              >
                続ける
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
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
