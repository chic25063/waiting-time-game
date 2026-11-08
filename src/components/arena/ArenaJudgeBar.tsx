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
      <div className="w-full max-w-xl mx-auto p-4 bg-[#FAF6EB] border-t-2 border-x-2 border-[#2B2D42] rounded-t-3xl shadow-[0_-4px_0_rgba(43,45,66,0.12)] space-y-2.5">
        <div className="text-center text-xs font-black text-[#2B2D42]">
          👑 このラウンドで勝ったのはどっち？
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick(true);
              onRecordWinner(p1.id);
            }}
            className="py-3.5 px-3 rounded-2xl bg-[#FFADAD] hover:brightness-95 text-[#2B2D42] border-2 border-[#2B2D42] font-black text-sm sm:text-base shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Crown className="w-5 h-5 text-[#2B2D42] shrink-0" />
            <span className="truncate">{p1.name} の勝ち！</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(true);
              onRecordWinner(p2.id);
            }}
            className="py-3.5 px-3 rounded-2xl bg-[#7CE8DC] hover:brightness-95 text-[#2B2D42] border-2 border-[#2B2D42] font-black text-sm sm:text-base shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Crown className="w-5 h-5 text-[#2B2D42] shrink-0" />
            <span className="truncate">{p2.name} の勝ち！</span>
          </button>
        </div>
      </div>
    );
  }

  // 多人数 点数制（Point Race）
  if (config.multiRuleType === "point_race") {
    const eligiblePlayers =
      state.isSuddenDeath && state.suddenDeathPlayerIds
        ? config.players.filter((p) =>
            state.suddenDeathPlayerIds?.includes(p.id)
          )
        : config.players;

    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-[#FAF6EB] border-t-2 border-x-2 border-[#2B2D42] rounded-t-3xl space-y-2.5">
        <div className="text-center text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5">
          {state.isSuddenDeath ? (
            <>
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-rose-600 font-black">
                サドンデス！ 勝った方が総合優勝！
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
              className="py-3 px-2 rounded-xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-xs sm:text-sm shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 shrink-0" />
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
      <div className="w-full max-w-xl mx-auto p-4 bg-[#FAF6EB] border-t-2 border-x-2 border-[#2B2D42] rounded-t-3xl space-y-2.5">
        <div className="text-center text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5">
          <Skull className="w-3.5 h-3.5" />
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
              className="py-3 px-2 rounded-xl bg-[#FFADAD] hover:brightness-95 border-2 border-[#2B2D42] text-[#2B2D42] font-black text-xs sm:text-sm shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Skull className="w-4 h-4 shrink-0" />
              <span className="truncate">{p.name} 脱落</span>
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
      <div className="w-full max-w-xl mx-auto p-4 bg-[#FAF6EB] border-t-2 border-x-2 border-[#2B2D42] rounded-t-3xl space-y-2.5">
        <div className="text-center text-xs font-black text-[#2B2D42] flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
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
              className="py-3 px-2 rounded-xl bg-[#9AF0A8] hover:brightness-95 text-[#2B2D42] border-2 border-[#2B2D42] font-black text-xs sm:text-sm shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{p.name} 勝ち抜け！</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
