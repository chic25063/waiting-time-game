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
  // 親から渡されない場合の内部ステート
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

  // 実際に使用するプレイヤーリスト
  const players = propPlayers || internalPlayers;

  // 生存人数
  const activePlayers = players.filter((p) => !p.isOut);

  // 脱落トグル
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

  // スコア変更
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

  // プレイヤー名編集
  const handleUpdateName = (id: string, name: string) => {
    if (onUpdateName) {
      onUpdateName(id, name);
    } else {
      setInternalPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name } : p))
      );
    }
  };

  // 勝者判定
  const declareWinner = (player: Player) => {
    setWinnerName(player.name);
    sound.playWin();
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f43f5e", "#38bdf8", "#a855f7"],
      });
    } catch {
      // fallback
    }
  };

  // 全員復活
  const handleReviveAll = () => {
    sound.playRevive();
    setWinnerName(null);
    if (onReviveAll) {
      onReviveAll();
    } else {
      setInternalPlayers((prev) => prev.map((p) => ({ ...p, isOut: false })));
    }
  };

  // スコア・脱落全リセット
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

  // プレイヤー追加
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

  // プレイヤー削除
  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) return;
    if (onRemovePlayer) {
      onRemovePlayer(id);
    } else {
      setInternalPlayers((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-purple-950/70 border border-white/20 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* 背景の光彩 */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
          <Users className="w-3.5 h-3.5" />
          <span>脱落・勝敗カウンター</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPlayerSetup && (
            <button
              type="button"
              onClick={onOpenPlayerSetup}
              className="p-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 active:scale-95 transition-all text-xs flex items-center gap-1"
              title="プレイヤー名を一括編集"
            >
              <UserCog className="w-3.5 h-3.5 text-purple-300" />
              <span>設定</span>
            </button>
          )}

          <span className="text-xs text-purple-200/90 font-medium">
            生存:{" "}
            <strong className="text-amber-300 font-bold text-sm">
              {activePlayers.length}
            </strong>{" "}
            / {players.length}人
          </span>

          {players.length < 8 && (
            <button
              type="button"
              onClick={handleAddPlayer}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 active:scale-95 transition-all text-xs flex items-center gap-1"
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
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-pink-500/25 to-purple-500/25 border border-amber-400/50 flex items-center justify-between animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
            <div>
              <div className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">
                WINNER!! 勝者決定！
              </div>
              <div className="text-base font-black text-white">{winnerName}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWinnerName(null)}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold"
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
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-2 ${
                p.isOut
                  ? "bg-slate-950/40 border-rose-500/20 opacity-50 grayscale"
                  : "bg-white/10 border-white/15 hover:border-white/30 shadow-sm"
              }`}
            >
              {/* 名前と脱落状態ボタン */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleOut(p.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    p.isOut
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                      : "bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-300 border border-emerald-400/40"
                  }`}
                  title={p.isOut ? "タップで復活" : "タップで脱落"}
                >
                  {p.isOut ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => handleUpdateName(p.id, e.target.value)}
                  className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-white/30 focus:border-purple-400 focus:outline-none px-1 py-0.5 truncate w-full max-w-[130px] sm:max-w-[180px]"
                />
              </div>

              {/* 右側：スコア操作と勝者ボタン */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* スコア操作 */}
                <div className="flex items-center bg-slate-950/50 rounded-xl border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateScore(p.id, -1)}
                    className="w-6 h-6 rounded-lg text-slate-300 hover:text-white flex items-center justify-center active:scale-90"
                    title="スコア -1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-amber-300">
                    {p.score}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateScore(p.id, 1)}
                    className="w-6 h-6 rounded-lg text-slate-300 hover:text-white flex items-center justify-center active:scale-90"
                    title="スコア +1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* 勝者宣言ボタン */}
                <button
                  type="button"
                  onClick={() => declareWinner(p)}
                  className="p-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 border border-amber-400/30 active:scale-90 transition-all"
                  title="この人を勝者にする！"
                >
                  <Trophy className="w-4 h-4" />
                </button>

                {/* 削除ボタン */}
                {players.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(p.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 text-xs"
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
          className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>全員復活する</span>
        </button>

        <button
          type="button"
          onClick={handleFullReset}
          className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>全リセット</span>
        </button>
      </div>
    </div>
  );
}
