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
}: EliminationTrackerProps) {
  const [lastSurvivor, setLastSurvivor] = useState<Player | null>(null);

  const activePlayers = players.filter((p) => !p.isOut);

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
        });
      } catch {
        // fallback
      }
    } else if (activePlayers.length !== 1 && lastSurvivor) {
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
    <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#2B2D42] p-5 sm:p-6 shadow-[4px_5px_0_#2B2D42] text-[#2B2D42]">
      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFADAD] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
          <Skull className="w-3.5 h-3.5" />
          <span>脱落トラッカー (サバイバル)</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPlayerSetup && (
            <button
              type="button"
              onClick={onOpenPlayerSetup}
              className="p-1.5 px-2.5 rounded-xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] text-xs font-black flex items-center gap-1 cursor-pointer"
              title="プレイヤー名を変更・追加"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>設定</span>
            </button>
          )}

          <div className="text-xs text-[#2B2D42] font-bold px-2.5 py-1 rounded-xl bg-[#FAF6EB] border-2 border-[#2B2D42]">
            生存:{" "}
            <strong className="text-[#2B2D42] font-black text-sm">
              {activePlayers.length}
            </strong>{" "}
            / {players.length}人
          </div>
        </div>
      </div>

      {/* ラストサバイバー（勝者）バナー */}
      {lastSurvivor && (
        <div className="mb-4 p-4 rounded-2xl bg-[#FFE066] border-2 border-[#2B2D42] flex items-center justify-between shadow-[3px_3px_0_#2B2D42] animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] flex items-center justify-center">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] text-[#2B2D42]/80 font-black">
                👑 最後の生存者！勝者決定！
              </div>
              <div className="text-lg font-black text-[#2B2D42]">
                {lastSurvivor.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs px-3 py-1.5 rounded-xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] font-black transition-all cursor-pointer"
          >
            全員復活
          </button>
        </div>
      )}

      {/* プレイヤー一覧カード */}
      <div className="space-y-2.5 mb-4">
        {players.map((p) => {
          return (
            <div
              key={p.id}
              className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3 ${
                p.isOut
                  ? "bg-slate-100 border-[#2B2D42]/30 opacity-55"
                  : "bg-[#FAF6EB] border-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl border-2 border-[#2B2D42] flex items-center justify-center font-black text-xs shrink-0 ${
                    p.isOut
                      ? "bg-[#FFADAD] text-[#2B2D42]"
                      : "bg-[#9AF0A8] text-[#2B2D42]"
                  }`}
                >
                  {p.isOut ? (
                    <Skull className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm sm:text-base font-black truncate block ${
                        p.isOut
                          ? "text-[#2B2D42]/50 line-through"
                          : "text-[#2B2D42]"
                      }`}
                    >
                      {p.name}
                    </span>
                    {p.isOut ? (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#FFADAD] text-[#2B2D42] border border-[#2B2D42]">
                        脱落
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#9AF0A8] text-[#2B2D42] border border-[#2B2D42]">
                        生存中
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {p.isOut ? (
                  <button
                    type="button"
                    onClick={() => handleRevive(p)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>復活</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEliminate(p)}
                    className="px-3 py-1.5 rounded-xl bg-[#FFADAD] hover:brightness-95 text-[#2B2D42] border-2 border-[#2B2D42] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
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
          className="py-2.5 px-3 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] font-black text-xs flex items-center justify-center gap-1.5 border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>全員を復活する</span>
        </button>

        {onOpenPlayerSetup && (
          <button
            type="button"
            onClick={onOpenPlayerSetup}
            className="py-2.5 px-3 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] font-black text-xs flex items-center justify-center gap-1.5 border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>プレイヤー名編集</span>
          </button>
        )}
      </div>
    </div>
  );
}
