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

  // 利用可能なツール（prompt, bpm, timer, score）
  const tools: ToolType[] = (meta?.tools || []).filter(
    (t) => t === "prompt" || t === "bpm" || t === "timer" || t === "score"
  );

  // デフォルトで最初のアクティブツールを選択（なければ prompt か timer）
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
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              🛠️ ツール連動バトル
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
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>ルール確認</span>
          </button>
        </div>
      </div>

      {/* ツール切り替えタブ（複数ツールがある場合） */}
      {availableTabs.length > 1 && (
        <div className="flex p-1 bg-gray-900/80 rounded-2xl border border-gray-800 gap-1 overflow-x-auto">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-gray-950 shadow-md font-extrabold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 特大ツール表示エリア */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
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
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>⚔️ サバイバル管理</span>
            <span className="text-[11px] font-normal text-gray-400">
              (ミスした人をタップしてOUT!)
            </span>
          </h3>
          <button
            onClick={onResetElimination}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 cursor-pointer"
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
                className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  isAlive
                    ? "bg-gray-950/80 border-gray-700 text-gray-200 hover:border-amber-500/50"
                    : "bg-red-950/20 border-red-900/50 text-red-400/80 line-through"
                }`}
              >
                <span className="truncate">{player.name}</span>
                {isAlive ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold ml-1 shrink-0">
                    生
                  </span>
                ) : (
                  <Skull className="w-4 h-4 text-red-400 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* 勝者を即決定するボタン群 */}
        <div className="pt-2 border-t border-gray-800">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              👑 勝者を決定して通算★を記録:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelectWinner(player.id, player.name)}
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 hover:border-amber-400 font-bold text-xs rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{player.name} 勝利</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
