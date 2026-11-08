"use client";

import React, { useState, useMemo } from "react";
import { Game, Player, PromptItem } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Sparkles,
  Shuffle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
} from "lucide-react";
import { useGameSession } from "@/hooks/useGameSession";

interface ConsensusMatchViewProps {
  game: Game;
  players: Player[];
  onSelectWinner: (playerId: string, playerName: string) => void;
  onOpenRules: () => void;
}

export default function ConsensusMatchView({
  game,
  players,
  onSelectWinner,
  onOpenRules,
}: ConsensusMatchViewProps) {
  const { recordTeamWin } = useGameSession();

  const prompts: PromptItem[] = useMemo(
    () =>
      game.metadata?.promptList || [
        "おにぎりの具の王道といえば？",
        "カレーライスの隠し味といえば？",
        "定番の寿司ネタといえば？",
        "冬の鍋料理の定番といえば？",
      ],
    [game]
  );

  const [promptIndex, setPromptIndex] = useState<number>(0);
  const [consecutiveSyncCount, setConsecutiveSyncCount] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [traitorSelectionMode, setTraitorSelectionMode] = useState<boolean>(false);

  const currentPrompt = prompts[promptIndex % prompts.length];
  const promptText = typeof currentPrompt === "string" ? currentPrompt : currentPrompt?.question;

  const handleNextPrompt = () => {
    sound.playGacha();
    setShowCelebration(false);
    setTraitorSelectionMode(false);
    setPromptIndex((prev) => prev + 1);
  };

  const handleSyncSuccess = () => {
    sound.playWin();
    recordTeamWin();
    setConsecutiveSyncCount((prev) => prev + 1);
    setShowCelebration(true);
    setTraitorSelectionMode(false);
  };

  const handleSelectTraitor = (traitor: Player) => {
    sound.playTimeUp();
    setConsecutiveSyncCount(0);
    const other = players.find((p) => p.id !== traitor.id);
    if (other) {
      onSelectWinner(other.id, other.name);
    }
  };

  return (
    <div className="space-y-5">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="relative bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-[32%] pointer-events-none"
          style={{
            backgroundColor: "#CBC8FA",
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#CBC8FA] text-[#2B2D42] border-2 border-[#2B2D42]">
              🤝 全員一致チャレンジ
            </span>
            <span className="text-xs text-[#2B2D42] bg-[#FFE066] px-2 py-0.5 rounded-full border border-[#2B2D42] font-black flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>連続一致: {consecutiveSyncCount} 回</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2B2D42] mt-1">
            {game.title}
          </h2>
          <p className="text-xs font-bold text-[#2B2D42]/75 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <button
          onClick={onOpenRules}
          className="relative z-10 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#2B2D42]" />
          <span>ルール</span>
        </button>
      </div>

      {/* 特大お題カード */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-3xl p-6 sm:p-8 text-center shadow-[4px_5px_0_#2B2D42] relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs text-[#2B2D42]">
          <span className="font-black bg-[#CBC8FA] px-2.5 py-0.5 rounded-md border border-[#2B2D42] flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-[#2B2D42]" />
            <span>せーの！で同時に答えろ！</span>
          </span>
          <button
            onClick={handleNextPrompt}
            className="flex items-center gap-1 text-[11px] font-black text-[#2B2D42] bg-[#FAF6EB] hover:bg-[#FFE066] px-2.5 py-1 rounded-lg border-2 border-[#2B2D42] cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            <span>次のお題</span>
          </button>
        </div>

        <div className="min-h-[120px] flex items-center justify-center py-4 bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-2xl px-4">
          <p className="text-2xl sm:text-3xl font-black text-[#2B2D42] tracking-wide leading-relaxed">
            {promptText}
          </p>
        </div>

        <p className="text-xs font-bold text-[#2B2D42]/70 mt-3">
          相談は厳禁！「せーの！」で全員同時に声に出そう！
        </p>
      </div>

      {/* 全員一致セレブレーション */}
      {showCelebration && (
        <div className="p-4 rounded-2xl bg-[#9AF0A8] border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] text-center animate-in zoom-in-95">
          <div className="text-[#2B2D42] font-black text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2B2D42] animate-spin" />
            <span>🎉 全員一致達成！ 🎉</span>
          </div>
          <p className="text-xs font-bold text-[#2B2D42]/80 mt-1">
            全員の通算勝利数に ★ +1 が付与されました！
          </p>
        </div>
      )}

      {/* アクションボタン */}
      {!traitorSelectionMode ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSyncSuccess}
            className="py-4 px-4 bg-[#9AF0A8] hover:bg-[#82e893] text-[#2B2D42] font-black text-base rounded-2xl border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>全員一致！（全員★+1）</span>
          </button>

          <button
            onClick={() => setTraitorSelectionMode(true)}
            className="py-4 px-4 bg-[#FFADAD] hover:bg-[#ff9494] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-sm rounded-2xl shadow-[3px_4px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-5 h-5 text-[#2B2D42]" />
            <span>ズレた！(異端児を指定)</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 text-center shadow-[3px_4px_0_#2B2D42] space-y-3">
          <div className="text-xs font-black text-[#2B2D42]">
            空気を読めなかった犯人（異端児）をタップ:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectTraitor(p)}
                className="py-2.5 px-3 bg-[#FAF6EB] hover:bg-[#FFADAD] text-[#2B2D42] rounded-xl text-xs font-black transition-all border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] truncate cursor-pointer"
              >
                😈 {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTraitorSelectionMode(false)}
            className="text-xs font-black text-[#2B2D42]/70 hover:text-[#2B2D42] underline cursor-pointer"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}
