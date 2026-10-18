"use client";

import React, { useState, useMemo } from "react";
import { Game, Player, PromptItem } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Users,
  Sparkles,
  Shuffle,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
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

  // 次のお題
  const handleNextPrompt = () => {
    sound.playGacha();
    setShowCelebration(false);
    setTraitorSelectionMode(false);
    setPromptIndex((prev) => prev + 1);
  };

  // 全員一致！
  const handleSyncSuccess = () => {
    sound.playWin();
    recordTeamWin();
    setConsecutiveSyncCount((prev) => prev + 1);
    setShowCelebration(true);
    setTraitorSelectionMode(false);
  };

  // 異端児を指定した場合（犯人以外が勝利または犯人を明確化）
  const handleSelectTraitor = (traitor: Player) => {
    sound.playTimeUp();
    setConsecutiveSyncCount(0);
    // 異端児以外の適当なプレイヤーを1名ピックアップして勝者にするか、単に次へ進む
    const other = players.find((p) => p.id !== traitor.id);
    if (other) {
      onSelectWinner(other.id, other.name);
    }
  };

  return (
    <div className="space-y-5">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              🤝 パーティー全員一致チャレンジ
            </span>
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>連続一致: {consecutiveSyncCount} 回</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {game.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <button
          onClick={onOpenRules}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>ルール</span>
        </button>
      </div>

      {/* 特大お題カード */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-900/90 to-purple-950/30 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs text-purple-300">
          <span className="font-bold flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>せーの！で同時に答えろ！</span>
          </span>
          <button
            onClick={handleNextPrompt}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-gray-800/80 px-2.5 py-1 rounded-lg"
          >
            <Shuffle className="w-3 h-3" />
            <span>次のお題</span>
          </button>
        </div>

        <div className="min-h-[120px] flex items-center justify-center py-4">
          <p className="text-2xl sm:text-3xl font-black text-white tracking-wide leading-relaxed">
            {promptText}
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          相談は厳禁！「せーの！」で全員同時に声に出そう！
        </p>
      </div>

      {/* 全員一致セレブレーション */}
      {showCelebration && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-400/60 text-center animate-in zoom-in-95">
          <div className="text-emerald-300 font-black text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <span>🎉 PERFECT SYNC!! 全員一致達成！ 🎉</span>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            全員の通算勝利数に ★ +1 が付与されました！
          </p>
        </div>
      )}

      {/* アクションボタン */}
      {!traitorSelectionMode ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSyncSuccess}
            className="py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>全員一致！（全員★+1）</span>
          </button>

          <button
            onClick={() => setTraitorSelectionMode(true)}
            className="py-4 px-4 bg-gray-800 hover:bg-rose-950/50 hover:border-rose-500/50 text-gray-300 hover:text-rose-200 border border-gray-700 font-bold text-sm rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>ズレた！(異端児を指定)</span>
          </button>
        </div>
      ) : (
        <div className="bg-gray-900/90 border border-rose-500/40 rounded-2xl p-4 text-center space-y-3">
          <div className="text-xs font-bold text-rose-300">
            空気を読めなかった犯人（異端児）をタップ:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectTraitor(p)}
                className="py-2.5 px-3 bg-gray-800 hover:bg-rose-600/80 text-white rounded-xl text-xs font-bold transition-all border border-gray-700 truncate"
              >
                😈 {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTraitorSelectionMode(false)}
            className="text-xs text-gray-400 hover:text-white"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}
