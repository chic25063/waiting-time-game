"use client";

import { useEffect, useState } from "react";
import { Player } from "@/types/game";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  Skull,
  UserCheck,
  UserX,
  Trophy,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Users,
  UserCog,
} from "lucide-react";

interface EliminationTrackerProps {
  players: Player[];
  onToggleOut: (id: string) => void;
  onReviveAll: () => void;
  onOpenPlayerSetup?: () => void;
  gameTitle?: string;
}

export default function EliminationTracker({
  players,
  onToggleOut,
  onReviveAll,
  onOpenPlayerSetup,
  gameTitle,
}: EliminationTrackerProps) {
  const [lastSurvivor, setLastSurvivor] = useState<Player | null>(null);

  const activePlayers = players.filter((p) => !p.isOut);
  const eliminatedPlayers = players.filter((p) => p.isOut);

  // 生存者が残り1人になったときの検知
  useEffect(() => {
    if (players.length >= 2 && activePlayers.length === 1 && !lastSurvivor) {
      const winner = activePlayers[0];
      setLastSurvivor(winner);
      sound.playWin();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#f43f5e", "#fbbf24", "#38bdf8", "#a855f7"],
        });
      } catch {
        // fallback
      }
    } else if (activePlayers.length !== 1 && lastSurvivor) {
      // 人数が戻ったら解除
      setLastSurvivor(null);
    }
  }, [activePlayers, players.length, lastSurvivor]);

  const handleEliminate = (player: Player) => {
    sound.playEliminate();
    onToggleOut(player.id);
  };

  const handleRevive = (player: Player) => {
    sound.playRevive();
    onToggleOut(player.id);
  };

  const handleResetAll = () => {
    sound.playRevive();
    setLastSurvivor(null);
    onReviveAll();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950/80 via-rose-950/30 to-purple-950/70 border border-rose-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* 背景の光彩 */}
      <div className="absolute -top-20 -right-20 w-52 h-52 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold">
          <Skull className="w-3.5 h-3.5" />
          <span>脱落トラッカー (サバイバル)</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPlayerSetup && (
            <button
              type="button"
              onClick={onOpenPlayerSetup}
              className="p-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 active:scale-95 transition-all text-xs flex items-center gap-1"
              title="プレイヤー名を変更・追加"
            >
              <UserCog className="w-3.5 h-3.5 text-purple-300" />
              <span>設定</span>
            </button>
          )}

          <div className="text-xs text-purple-200/90 font-medium px-2 py-1 rounded-xl bg-slate-900/60 border border-white/10">
            生存:{" "}
            <strong className="text-amber-300 font-bold text-sm">
              {activePlayers.length}
            </strong>{" "}
            / {players.length}人
          </div>
        </div>
      </div>

      {/* ラストサバイバー（勝者）バナー */}
      {lastSurvivor && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 border-2 border-amber-400/80 flex items-center justify-between shadow-xl animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/30">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">
                👑 LAST SURVIVOR 勝者決定！
              </div>
              <div className="text-lg font-black text-white">{lastSurvivor.name}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all active:scale-95"
          >
            全員復活
          </button>
        </div>
      )}

      {/* プレイヤー一覧カード */}
      <div className="space-y-2.5 mb-4">
        {players.map((p, idx) => {
          return (
            <div
              key={p.id}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                p.isOut
                  ? "bg-slate-950/60 border-rose-950/60 opacity-60"
                  : "bg-white/10 border-white/15 hover:border-rose-400/30 shadow-md"
              }`}
            >
              {/* プレイヤー名と状態 */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    p.isOut
                      ? "bg-rose-950/80 border border-rose-700/50 text-rose-400"
                      : "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                  }`}
                >
                  {p.isOut ? <Skull className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm sm:text-base font-black truncate block ${
                        p.isOut ? "text-slate-400 line-through" : "text-white"
                      }`}
                    >
                      {p.name}
                    </span>
                    {p.isOut ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        脱落
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        生存中
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 脱落 / 復活ボタン */}
              <div className="shrink-0">
                {p.isOut ? (
                  <button
                    type="button"
                    onClick={() => handleRevive(p)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 border border-white/15 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>復活</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEliminate(p)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/40 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-400" />
                    <span>脱落！</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* フッター操作ボタン */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleResetAll}
          className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
          <span>全員を復活する</span>
        </button>

        {onOpenPlayerSetup && (
          <button
            type="button"
            onClick={onOpenPlayerSetup}
            className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>プレイヤー名編集</span>
          </button>
        )}
      </div>
    </div>
  );
}
