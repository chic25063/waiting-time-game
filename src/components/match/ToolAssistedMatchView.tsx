"use client";

import React, { useState } from "react";
import { Game, ToolType, Player } from "@/types/game";
import PromptTool from "@/components/tools/PromptTool";
import BpmTool from "@/components/tools/BpmTool";
import TimerTool from "@/components/tools/TimerTool";
import ScoreTool from "@/components/tools/ScoreTool";
import {
  Shuffle,
  Activity,
  Clock,
  Trophy,
  Crown,
  Skull,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface ToolAssistedMatchViewProps {
  game: Game;
  players: Player[];
  onToggleEliminate: (playerId: string) => void;
  onResetElimination: () => void;
  onSelectWinner: (playerId: string, playerName: string) => void;
  onScoreChange: (playerId: string, delta: number) => void;
  onOpenRules: () => void;
}

export default function ToolAssistedMatchView({
  game,
  players,
  onToggleEliminate,
  onResetElimination,
  onSelectWinner,
  onScoreChange,
  onOpenRules,
}: ToolAssistedMatchViewProps) {
  const meta = game.metadata;

  const tools: ToolType[] = (meta?.tools || []).filter(
    (t) => t === "prompt" || t === "bpm" || t === "timer" || t === "score"
  );

  const [activeTab, setActiveTab] = useState<ToolType>(
    tools.length > 0 ? tools[0] : "prompt"
  );

  const toolTabs: { type: ToolType; label: string; icon: React.ReactNode }[] = [
    { type: "prompt", label: "お題ガチャ", icon: <Shuffle className="w-4 h-4" /> },
    { type: "timer", label: "タイマー", icon: <Clock className="w-4 h-4" /> },
    { type: "bpm", label: "BPMメトロノーム", icon: <Activity className="w-4 h-4" /> },
    { type: "score", label: "得点記録", icon: <Trophy className="w-4 h-4" /> },
  ];

  const availableTabs = toolTabs.filter((t) => tools.includes(t.type));
  const alivePlayers = players.filter((p) => !p.isOut);

  return (
    <div className="space-y-6">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="relative bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-[32%] pointer-events-none"
          style={{
            backgroundColor: "#7CE8DC",
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#7CE8DC] text-[#2B2D42] border-2 border-[#2B2D42]">
              🛠️ ツール連動バトル
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
        </div>
      </div>

      {/* ツール切り替えタブ（複数ツールがある場合） */}
      {availableTabs.length > 1 && (
        <div className="flex p-1.5 bg-white rounded-2xl border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] gap-1.5 overflow-x-auto">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#FFE066] text-[#2B2D42] border-2 border-[#2B2D42] shadow-[1px_2px_0_#2B2D42]"
                    : "text-[#2B2D42]/70 hover:text-[#2B2D42] hover:bg-[#FAF6EB]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ツール表示エリア */}
      <div>
        {activeTab === "prompt" && meta?.promptList && (
          <PromptTool prompts={meta.promptList} />
        )}
        {activeTab === "timer" && (
          <TimerTool
            defaultDuration={meta?.timerDuration || 10}
            isBlindDefault={meta?.blindTimer ?? false}
          />
        )}
        {activeTab === "bpm" && (
          <BpmTool defaultBpm={meta?.defaultBpm || 110} />
        )}
        {activeTab === "score" && (
          <ScoreTool
            players={players}
            onToggleOut={onToggleEliminate}
            onUpdateScore={onScoreChange}
            onReviveAll={onResetElimination}
          />
        )}
      </div>

      {/* 下部：サバイバル脱落判定 & 勝者決定 */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#2B2D42] flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#FFADAD] border border-[#2B2D42] rounded-md text-xs">
              ⚔️ サバイバル管理
            </span>
            <span className="text-[11px] font-bold text-[#2B2D42]/65">
              (ミスした人をタップして脱落)
            </span>
          </h3>
          <button
            onClick={onResetElimination}
            className="flex items-center gap-1 text-[11px] font-black text-[#2B2D42] bg-[#FAF6EB] hover:bg-[#FFE066] px-2.5 py-1 rounded-lg border-2 border-[#2B2D42] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>全復活</span>
          </button>
        </div>

        {/* プレイヤーチップ一覧 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {players.map((player) => {
            const isAlive = !player.isOut;
            return (
              <button
                key={player.id}
                onClick={() => onToggleEliminate(player.id)}
                className={`py-3 px-3 rounded-xl border-2 border-[#2B2D42] text-xs sm:text-sm font-black flex items-center justify-between transition-all cursor-pointer ${
                  isAlive
                    ? "bg-[#FAF6EB] text-[#2B2D42] hover:bg-[#FFF275]/50 shadow-[2px_2px_0_#2B2D42]"
                    : "bg-[#FFADAD]/35 text-[#2B2D42]/60 line-through"
                }`}
              >
                <span className="truncate">{player.name}</span>
                {isAlive ? (
                  <span className="w-5 h-5 rounded-full bg-[#9AF0A8] border border-[#2B2D42] text-[#2B2D42] text-[10px] flex items-center justify-center font-black ml-1 shrink-0">
                    生
                  </span>
                ) : (
                  <Skull className="w-4 h-4 text-[#2B2D42] shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* 勝者を即決定するボタン群 */}
        <div className="pt-3 border-t-2 border-dashed border-[#2B2D42]/20">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Crown className="w-4 h-4 text-[#2B2D42]" />
            <span className="text-xs font-black text-[#2B2D42]">
              👑 勝者を決定して通算★を記録:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelectWinner(player.id, player.name)}
                className="py-2.5 px-3 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-xs rounded-xl shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Crown className="w-3 h-3 text-[#2B2D42] shrink-0" />
                <span className="truncate">{player.name} 勝利</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
