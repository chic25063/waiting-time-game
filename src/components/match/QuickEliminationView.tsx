"use client";

import React, { useMemo } from "react";
import { Game, Player } from "@/types/game";
import { Crown, Skull, RotateCcw, HelpCircle, Sparkles, CheckCircle2 } from "lucide-react";

interface QuickEliminationViewProps {
  game: Game;
  players: Player[];
  onToggleEliminate: (playerId: string) => void;
  onResetElimination: () => void;
  onSelectWinner: (playerId: string, playerName: string) => void;
  onOpenRules: () => void;
}

export default function QuickEliminationView({
  game,
  players,
  onToggleEliminate,
  onResetElimination,
  onSelectWinner,
  onOpenRules,
}: QuickEliminationViewProps) {
  // 生存者と脱落者
  const alivePlayers = useMemo(
    () => players.filter((p) => !p.isOut),
    [players]
  );
  const outPlayers = useMemo(
    () => players.filter((p) => p.isOut),
    [players]
  );

  return (
    <div className="space-y-6">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⚡ リアル完結サバイバル
            </span>
            <span className="text-xs text-gray-400">
              生存: <strong className="text-amber-400 text-sm">{alivePlayers.length}</strong> / {players.length}名
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {game.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenRules}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>ルール確認</span>
          </button>
          <button
            onClick={onResetElimination}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-xs font-medium rounded-xl border border-gray-800 transition-colors"
            title="全員生存にリセット"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>全復活</span>
          </button>
        </div>
      </div>

      {/* かけ声・コール例（ゲーム進行の手助け） */}
      {(game.call_examples || game.metadata?.callExample) && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs font-black text-amber-400 flex items-center gap-1 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>コール ＆ アクション早見表</span>
          </p>
          <div className="text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed space-y-1">
            {game.call_examples ? (
              game.call_examples.map((ex, i) => (
                <div key={i} className="bg-gray-950/40 px-3 py-1.5 rounded-lg border border-amber-500/10 font-medium">
                  {ex}
                </div>
              ))
            ) : (
              <div className="bg-gray-950/40 p-2.5 rounded-lg border border-amber-500/10 font-mono">
                {game.metadata?.callExample}
              </div>
            )}
          </div>
        </div>
      )}

      {/* サバイバル判定エリア: 生存・脱落カードグリッド */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>⚔️ サバイバル管理</span>
            <span className="text-[11px] font-normal text-gray-400">
              (ミスした人をタップしてOUT!)
            </span>
          </h3>
          {alivePlayers.length === 1 && (
            <span className="text-xs font-bold text-amber-400 animate-pulse">
              🏆 ラスト1名！勝者決定
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((player) => {
            const isAlive = !player.isOut;
            return (
              <div
                key={player.id}
                onClick={() => onToggleEliminate(player.id)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer select-none text-center ${
                  isAlive
                    ? "bg-gradient-to-b from-gray-900 to-gray-950 border-gray-700 hover:border-amber-500/60 shadow-lg hover:shadow-amber-500/10 active:scale-[0.98]"
                    : "bg-gray-950/60 border-red-950/60 opacity-60 hover:opacity-80"
                }`}
              >
                {/* 状態バッジ */}
                <div className="flex items-center justify-center mb-2">
                  {isAlive ? (
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      ●
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-xs">
                      <Skull className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="font-black text-base sm:text-lg text-white truncate px-1">
                  {player.name}
                </div>

                <div className="mt-3">
                  {isAlive ? (
                    <span className="inline-block text-[11px] font-bold text-red-400 bg-red-950/50 hover:bg-red-900/60 px-3 py-1 rounded-full border border-red-800/40 transition-colors">
                      ミス！OUT
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] font-bold text-gray-400 bg-gray-800/80 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-700 transition-colors">
                      復活する
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* または、リアルですでに決着がついている場合の【勝者を即決定】ボタン群 */}
      <div className="bg-gray-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs sm:text-sm font-black text-amber-300">
            すでに決着がついた？ 勝者をワンタップで即決定！
          </h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          脱落操作を省略して、勝ったプレイヤーのボタンを押すだけで表彰＆通算★を記録できます。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelectWinner(player.id, player.name)}
              className="py-3 px-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-200 border border-amber-500/30 hover:border-amber-400 font-bold text-xs sm:text-sm rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{player.name} の勝ち</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
