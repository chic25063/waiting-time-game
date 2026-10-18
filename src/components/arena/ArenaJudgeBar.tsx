"use client";

import React from "react";
import { MatchSessionConfig, MatchProgressState } from "@/types/matchMode";
import { sound } from "@/lib/sound";
import { Crown, Skull, CheckCircle2, Flame } from "lucide-react";

interface ArenaJudgeBarProps {
  config: MatchSessionConfig;
  state: MatchProgressState;
  onRecordWinner: (playerId: string) => void;
  onRecordEliminated: (playerId: string) => void;
}

export default function ArenaJudgeBar({
  config,
  state,
  onRecordWinner,
  onRecordEliminated,
}: ArenaJudgeBarProps) {
  // 1vs1 対戦時
  if (config.mode === "duel_1v1") {
    const [p1, p2] = config.players;
    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl space-y-2">
        <div className="text-center text-xs font-bold text-slate-400">
          👑 このラウンドで勝ったのはどっち？
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick(true);
              onRecordWinner(p1.id);
            }}
            className="py-4 px-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Crown className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="truncate">{p1.name} の勝ち！</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(true);
              onRecordWinner(p2.id);
            }}
            className="py-4 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Crown className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="truncate">{p2.name} の勝ち！</span>
          </button>
        </div>
      </div>
    );
  }

  // 多人数 点数制（Point Race）
  if (config.multiRuleType === "point_race") {
    // サドンデス中の場合は同点者のみ表示
    const eligiblePlayers = state.isSuddenDeath && state.suddenDeathPlayerIds
      ? config.players.filter((p) => state.suddenDeathPlayerIds?.includes(p.id))
      : config.players;

    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl space-y-2">
        <div className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
          {state.isSuddenDeath ? (
            <>
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-black">
                サドンデス！ 勝った方が総合チャンピオン！
              </span>
            </>
          ) : (
            <span>👑 このラウンドの勝者をタップ（+1点）</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {eligiblePlayers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                sound.playClick(true);
                onRecordWinner(p.id);
              }}
              className="py-3 px-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="truncate">{p.name} 勝ち！</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 多人数 勝ち残り制（サバイバル脱落方式）
  if (config.multiRuleType === "survival_knockout") {
    const alivePlayers = config.players.filter(
      (p) => !state.eliminatedPlayerIds.includes(p.id)
    );

    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl space-y-2">
        <div className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>ミスした人・負けた人をタップして脱落！</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {alivePlayers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                sound.playEliminate();
                onRecordEliminated(p.id);
              }}
              className="py-3 px-2 rounded-xl bg-gradient-to-r from-gray-800 to-rose-950 hover:from-rose-900 hover:to-red-900 border border-rose-500/30 text-rose-200 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Skull className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">{p.name} OUT</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 多人数 負け残り制（最弱王決定戦）
  if (config.multiRuleType === "loser_king") {
    const remainingPlayers = config.players.filter(
      (p) => !state.escapedPlayerIds.includes(p.id)
    );

    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl space-y-2">
        <div className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>勝った人をタップして「セーフ！勝ち抜け！」</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {remainingPlayers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                sound.playWin();
                onRecordWinner(p.id);
              }}
              className="py-3 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">{p.name} SAFE!</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
