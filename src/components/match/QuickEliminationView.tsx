"use client";

import React, { useMemo } from "react";
import { Game, Player } from "@/types/game";
import { Crown, Skull, RotateCcw, HelpCircle, Sparkles } from "lucide-react";

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
  const alivePlayers = useMemo(
    () => players.filter((p) => !p.isOut),
    [players]
  );

  return (
    <div className="space-y-6">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="relative bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-[32%] pointer-events-none"
          style={{
            backgroundColor: "#FFE066",
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#FFF275] text-[#2B2D42] border-2 border-[#2B2D42]">
              ⚡ リアル完結サバイバル
            </span>
            <span className="text-xs font-bold text-[#2B2D42]/70">
              生存: <strong className="text-[#2B2D42] font-black text-sm">{alivePlayers.length}</strong> / {players.length}名
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2B2D42] mt-1">
            {game.title}
          </h2>
          <p className="text-xs font-bold text-[#2B2D42]/75 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenRules}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#2B2D42]" />
            <span>ルール確認</span>
          </button>
          <button
            onClick={onResetElimination}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
            title="全員生存にリセット"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>全復活</span>
          </button>
        </div>
      </div>

      {/* かけ声・コール例（ゲーム進行の手助け） */}
      {(game.call_examples || game.metadata?.callExample) && (
        <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 shadow-[3px_4px_0_#2B2D42]">
          <p className="text-xs font-black text-[#2B2D42] flex items-center gap-1.5 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#FFF275] border border-[#2B2D42]">
              <Sparkles className="w-3 h-3 text-[#2B2D42]" />
            </span>
            <span>コール ＆ アクション早見表</span>
          </p>
          <div className="text-xs text-[#2B2D42] whitespace-pre-wrap leading-relaxed space-y-1.5 font-bold">
            {game.call_examples ? (
              game.call_examples.map((ex, i) => (
                <div key={i} className="bg-[#FAF6EB] px-3 py-2 rounded-xl border-2 border-[#2B2D42]">
                  {ex}
                </div>
              ))
            ) : (
              <div className="bg-[#FAF6EB] p-3 rounded-xl border-2 border-[#2B2D42] font-mono">
                {game.metadata?.callExample}
              </div>
            )}
          </div>
        </div>
      )}

      {/* サバイバル判定エリア: 生存・脱落カードグリッド */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-[#2B2D42] flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#FFADAD] border border-[#2B2D42] rounded-md text-xs">
              ⚔️ サバイバル管理
            </span>
            <span className="text-[11px] font-bold text-[#2B2D42]/65">
              (ミスした人をタップして脱落)
            </span>
          </h3>
          {alivePlayers.length === 1 && (
            <span className="text-xs font-black text-[#2B2D42] bg-[#FFE066] px-2.5 py-0.5 rounded-full border border-[#2B2D42] animate-pulse">
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
                className={`relative p-4 rounded-2xl border-2 border-[#2B2D42] transition-all cursor-pointer select-none text-center ${
                  isAlive
                    ? "bg-[#FAF6EB] hover:bg-[#FFF275]/40 shadow-[2px_3px_0_#2B2D42] active:translate-y-0.5"
                    : "bg-[#2B2D42]/10 opacity-65 hover:opacity-90"
                }`}
              >
                {/* 状態バッジ */}
                <div className="flex items-center justify-center mb-2">
                  {isAlive ? (
                    <span className="w-8 h-8 rounded-full bg-[#9AF0A8] border-2 border-[#2B2D42] text-[#2B2D42] flex items-center justify-center font-black text-xs">
                      生
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-[#FFADAD] border-2 border-[#2B2D42] text-[#2B2D42] flex items-center justify-center font-black text-xs">
                      <Skull className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className={`font-black text-base sm:text-lg text-[#2B2D42] truncate px-1 ${!isAlive ? "line-through" : ""}`}>
                  {player.name}
                </div>

                <div className="mt-3">
                  {isAlive ? (
                    <span className="inline-block text-[11px] font-black text-[#2B2D42] bg-[#FFADAD] hover:bg-[#ff9494] px-3 py-1 rounded-full border-2 border-[#2B2D42] transition-colors">
                      ミス！脱落
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] font-black text-[#2B2D42] bg-white hover:bg-[#FAF6EB] px-3 py-1 rounded-full border-2 border-[#2B2D42] transition-colors">
                      復活する
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 勝者を即決定ボタン群 */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42]">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#FFE066] border border-[#2B2D42]">
            <Crown className="w-3.5 h-3.5 text-[#2B2D42]" />
          </span>
          <h3 className="text-xs sm:text-sm font-black text-[#2B2D42]">
            すでに決着がついた？ 勝者をワンタップで即決定！
          </h3>
        </div>
        <p className="text-[11px] font-bold text-[#2B2D42]/65 mb-3">
          脱落操作を省略して、勝ったプレイヤーのボタンを押すだけで表彰＆通算★を記録できます。
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelectWinner(player.id, player.name)}
              className="py-3 px-3 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-xs sm:text-sm rounded-xl shadow-[2px_3px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-[#2B2D42] shrink-0" />
              <span className="truncate">{player.name} の勝ち</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
