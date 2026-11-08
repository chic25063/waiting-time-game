"use client";

import { useState } from "react";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import { Player } from "@/types/game";
import {
  Users,
  Trophy,
  UserX,
  UserCheck,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  UserPlus,
  UserCog,
} from "lucide-react";

export interface ScoreToolProps {
  initialPlayerCount?: number;
  players?: Player[];
  onToggleOut?: (id: string) => void;
  onUpdateScore?: (id: string, delta: number) => void;
  onUpdateName?: (id: string, name: string) => void;
  onAddPlayer?: () => void;
  onRemovePlayer?: (id: string) => void;
  onReviveAll?: () => void;
  onFullReset?: () => void;
  onOpenPlayerSetup?: () => void;
}

export default function ScoreTool({
  initialPlayerCount = 4,
  players: propPlayers,
  onToggleOut,
  onUpdateScore,
  onUpdateName,
  onAddPlayer,
  onRemovePlayer,
  onReviveAll,
  onFullReset,
  onOpenPlayerSetup,
}: ScoreToolProps) {
  const [internalPlayers, setInternalPlayers] = useState<Player[]>(() => {
    const count = Math.max(2, Math.min(8, initialPlayerCount));
    return Array.from({ length: count }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `プレイヤー ${i + 1}`,
      score: 0,
      isOut: false,
    }));
  });

  const [winnerName, setWinnerName] = useState<string | null>(null);

  const players = propPlayers || internalPlayers;
  const activePlayers = players.filter((p) => !p.isOut);

  const handleToggleOut = (id: string) => {
    const target = players.find((p) => p.id === id);
    if (target?.isOut) {
      sound.playRevive();
    } else {
      sound.playEliminate();
    }

    if (onToggleOut) {
      onToggleOut(id);
    } else {
      setInternalPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isOut: !p.isOut } : p))
      );
    }
  };

  const handleUpdateScore = (id: string, delta: number) => {
    sound.playTick();
    if (onUpdateScore) {
      onUpdateScore(id, delta);
    } else {
      setInternalPlayers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, score: Math.max(0, p.score + delta) } : p
        )
      );
    }
  };

  const handleUpdateName = (id: string, name: string) => {
    if (onUpdateName) {
      onUpdateName(id, name);
    } else {
      setInternalPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name } : p))
      );
    }
  };

  const declareWinner = (player: Player) => {
    setWinnerName(player.name);
    sound.playWin();
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback
    }
  };

  const handleReviveAll = () => {
    sound.playRevive();
    setWinnerName(null);
    if (onReviveAll) {
      onReviveAll();
    } else {
      setInternalPlayers((prev) => prev.map((p) => ({ ...p, isOut: false })));
    }
  };

  const handleFullReset = () => {
    sound.playTick();
    setWinnerName(null);
    if (onFullReset) {
      onFullReset();
    } else {
      setInternalPlayers((prev) =>
        prev.map((p) => ({ ...p, isOut: false, score: 0 }))
      );
    }
  };

  const handleAddPlayer = () => {
    if (players.length >= 8) return;
    if (onAddPlayer) {
      onAddPlayer();
    } else {
      const newId = `p-${Date.now()}`;
      const newNum = players.length + 1;
      setInternalPlayers((prev) => [
        ...prev,
        { id: newId, name: `プレイヤー ${newNum}`, score: 0, isOut: false },
      ]);
    }
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) return;
    if (onRemovePlayer) {
      onRemovePlayer(id);
    } else {
      setInternalPlayers((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#2B2D42] p-5 sm:p-6 shadow-[4px_5px_0_#2B2D42] text-[#2B2D42]">
      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9AF0A8] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
          <Users className="w-3.5 h-3.5" />
          <span>脱落・勝敗カウンター</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPlayerSetup && (
            <button
              type="button"
              onClick={onOpenPlayerSetup}
              className="p-1.5 px-2.5 rounded-xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] text-xs font-black flex items-center gap-1 cursor-pointer"
              title="プレイヤー名を一括編集"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>設定</span>
            </button>
          )}

          <span className="text-xs text-[#2B2D42] font-bold">
            生存:{" "}
            <strong className="px-1.5 py-0.2 rounded bg-[#FFF275] font-black text-sm">
              {activePlayers.length}
            </strong>{" "}
            / {players.length}人
          </span>

          {players.length < 8 && (
            <button
              type="button"
              onClick={handleAddPlayer}
              className="p-1.5 px-2 rounded-xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] border-2 border-[#2B2D42] text-xs font-black flex items-center gap-1 cursor-pointer"
              title="プレイヤー追加"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">追加</span>
            </button>
          )}
        </div>
      </div>

      {/* 勝者ポップアップ */}
      {winnerName && (
        <div className="mb-4 p-4 rounded-2xl bg-[#FFE066] border-2 border-[#2B2D42] shadow-[3px_3px_0_#2B2D42] flex items-center justify-between animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#2B2D42] animate-bounce" />
            <div>
              <div className="text-[10px] text-[#2B2D42]/80 font-black">
                勝者決定！
              </div>
              <div className="text-base font-black text-[#2B2D42]">
                {winnerName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWinnerName(null)}
            className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#2B2D42] text-[#2B2D42] font-extrabold cursor-pointer"
          >
            閉じる
          </button>
        </div>
      )}

      {/* プレイヤーリスト */}
      <div className="space-y-2 mb-4">
        {players.map((p) => {
          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-2 ${
                p.isOut
                  ? "bg-slate-100 border-[#2B2D42]/30 opacity-55"
                  : "bg-[#FAF6EB] border-[#2B2D42] shadow-[2px_2px_0_#2B2D42]"
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleOut(p.id)}
                  className={`w-8 h-8 rounded-xl border-2 border-[#2B2D42] flex items-center justify-center font-black text-xs shrink-0 transition-all cursor-pointer ${
                    p.isOut
                      ? "bg-[#FFADAD] text-[#2B2D42]"
                      : "bg-[#9AF0A8] text-[#2B2D42]"
                  }`}
                  title={p.isOut ? "タップで復活" : "タップで脱落"}
                >
                  {p.isOut ? (
                    <UserX className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => handleUpdateName(p.id, e.target.value)}
                  className="bg-transparent text-sm font-black text-[#2B2D42] border-b border-transparent focus:border-[#2B2D42] focus:outline-none px-1 py-0.5 truncate w-full max-w-[130px] sm:max-w-[180px]"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center bg-white rounded-xl border-2 border-[#2B2D42] p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateScore(p.id, -1)}
                    className="w-6 h-6 rounded-lg text-[#2B2D42] flex items-center justify-center active:scale-90 cursor-pointer"
                    title="スコア -1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-black text-xs text-[#2B2D42]">
                    {p.score}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateScore(p.id, 1)}
                    className="w-6 h-6 rounded-lg text-[#2B2D42] flex items-center justify-center active:scale-90 cursor-pointer"
                    title="スコア +1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => declareWinner(p)}
                  className="p-1.5 rounded-xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] active:scale-90 transition-all cursor-pointer"
                  title="この人を勝者にする！"
                >
                  <Trophy className="w-4 h-4" />
                </button>

                {players.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(p.id)}
                    className="p-1 rounded-lg text-[#2B2D42]/50 hover:text-rose-600 text-xs font-black cursor-pointer"
                    title="削除"
                  >
                    ×
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
          onClick={handleReviveAll}
          className="py-2.5 px-3 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] font-black text-xs flex items-center justify-center gap-1.5 border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>全員復活する</span>
        </button>

        <button
          type="button"
          onClick={handleFullReset}
          className="py-2.5 px-3 rounded-2xl bg-[#FAF6EB] hover:bg-slate-100 text-[#2B2D42] font-black text-xs flex items-center justify-center gap-1.5 border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>全リセット</span>
        </button>
      </div>
    </div>
  );
}
