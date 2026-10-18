"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { MatchSessionConfig, MatchProgressState } from "@/types/matchMode";
import {
  Trophy,
  Skull,
  RotateCcw,
  SlidersHorizontal,
  Home,
  Share2,
  Check,
  Crown,
  Flame,
} from "lucide-react";

interface ArenaMatchFinishedModalProps {
  isOpen: boolean;
  config: MatchSessionConfig;
  state: MatchProgressState;
  onRematch: () => void;
  onChangeSettings: () => void;
  onGoHome: () => void;
}

export default function ArenaMatchFinishedModal({
  isOpen,
  config,
  state,
  onRematch,
  onChangeSettings,
  onGoHome,
}: ArenaMatchFinishedModalProps) {
  const [copied, setCopied] = useState(false);

  const isLoserKingMode = config.multiRuleType === "loser_king";
  const winner = state.winnerPlayer;
  const loser = state.loserPlayer;

  useEffect(() => {
    if (!isOpen) return;

    if (!isLoserKingMode) {
      // 優勝時の紙吹雪演出
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#fbbf24", "#f43f5e", "#6366f1", "#10b981", "#38bdf8"],
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  }, [isOpen, isLoserKingMode]);

  if (!isOpen) return null;

  // 結果テキストのコピー
  const handleCopyResult = () => {
    let text = "";
    if (isLoserKingMode) {
      text = `【マチジカン！最弱王決定戦】\n💀 本日の最弱王: ${loser?.name || "???"}\n⚠️ 罰ゲーム: ${config.loserPenaltyText || "なし"}\n#マチジカン`;
    } else {
      text = `【マチジカン！対戦結果】\n👑 優勝: ${winner?.name || "???"} !!\n総ラウンド数: ${state.currentRound}回戦\n#マチジカン`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 text-center text-white shadow-2xl space-y-6 ${
          isLoserKingMode
            ? "bg-gradient-to-b from-gray-950 via-rose-950 to-black border-rose-500/60 shadow-rose-900/40"
            : "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-amber-400/60 shadow-amber-500/20"
        }`}
      >
        {/* アイコン & タイトル */}
        {isLoserKingMode ? (
          <div className="space-y-3">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-950/80 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/30 animate-pulse">
              <Skull className="w-10 h-10" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-rose-400">
                MATCH FINISHED
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-200 mt-1">
                💀 本日の最弱王 決定 💀
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/30 space-y-1">
              <div className="text-xl sm:text-2xl font-black text-rose-400">
                😈 {loser?.name || "???"} 😈
              </div>
              <div className="text-xs text-rose-300/80">
                一度も勝ち抜けできず完全敗北…！
              </div>
            </div>

            {/* 執行される罰ゲーム */}
            <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 space-y-1.5">
              <div className="text-[11px] font-black text-rose-300 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>執行される罰ゲーム:</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {config.loserPenaltyText || "ジュース奢り"}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/30 scale-105">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-400">
                MATCH CHAMPION
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                🎉 完全優勝おめでとう！ 🎉
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-amber-400/30 space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <span>{winner?.name || "???"}</span>
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-xs text-slate-300">
                {config.mode === "duel_1v1"
                  ? `${config.duelRule === "first_to_5" ? 5 : 3}本先取で見事勝利！`
                  : `全${state.currentRound}戦を制して頂点に君臨！`}
              </div>
            </div>
          </div>
        )}

        {/* 4大アクションボタン */}
        <div className="space-y-2 pt-2">
          {/* ① もう1戦リベンジ */}
          <button
            type="button"
            onClick={onRematch}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>もう1戦プレイ（同じ設定で再戦）</span>
          </button>

          {/* ② 設定を変更する */}
          <button
            type="button"
            onClick={onChangeSettings}
            className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-300" />
            <span>設定やルールを変えて遊ぶ</span>
          </button>

          {/* ③ 結果をコピー & ④ トップへ戻る */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyResult}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">コピー完了！</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>結果をコピー</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>トップへ戻る</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
