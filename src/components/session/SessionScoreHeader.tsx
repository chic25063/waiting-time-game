"use client";

import { useState } from "react";
import { useGameSession } from "@/hooks/useGameSession";
import { Trophy, RotateCcw, Crown, Star, AlertTriangle, X } from "lucide-react";

export default function SessionScoreHeader() {
  const { players, resetSessionWins } = useGameSession();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // 最高勝利数を取得
  const maxWins = Math.max(...players.map((p) => p.totalWins), 0);

  const handleReset = () => {
    resetSessionWins();
    setShowConfirm(false);
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto mb-4 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-lg flex items-center justify-between gap-2 transition-all">
        {/* 左側: トロフィーアイコン＆タイトル */}
        <div className="flex items-center gap-1.5 shrink-0 text-amber-300">
          <Trophy className="w-4 h-4 fill-amber-400/20" />
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 hidden sm:inline">
            通算スコア
          </span>
        </div>

        {/* 中央: プレイヤー別 ★ スコア一覧 */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {players.map((player, idx) => {
            const isLeader = maxWins > 0 && player.totalWins === maxWins;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  isLeader
                    ? "bg-gradient-to-r from-amber-400/25 to-orange-500/25 border-amber-400/50 text-amber-200 shadow-sm shadow-amber-500/20"
                    : "bg-white/5 border-white/10 text-slate-200"
                }`}
              >
                {isLeader ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                ) : (
                  <span className="w-3.5 text-[10px] text-purple-300 font-medium shrink-0 text-center">
                    {idx + 1}.
                  </span>
                )}
                <span className="truncate max-w-[70px] sm:max-w-[90px]">{player.name}</span>
                {Boolean(player.consecutiveWins && player.consecutiveWins >= 2) && (
                  <span className="text-[10px] text-orange-400 font-extrabold animate-pulse" title={`${player.consecutiveWins}連勝中！`}>
                    🔥{player.consecutiveWins}
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 ml-0.5 text-[11px] text-amber-300 font-black shrink-0">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {player.totalWins}
                </span>
              </div>
            );
          })}
        </div>

        {/* 右側: 成績リセットボタン */}
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-rose-300 border border-white/10 transition-all active:scale-95 shrink-0"
          title="通算成績をリセット"
          aria-label="通算成績をリセット"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* リセット確認モーダル */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-purple-500/30 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>通算成績のリセット</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              全員の通算勝利数（★）を <strong className="text-white">0勝</strong> にリセットしますか？
              <br />
              <span className="text-slate-400 text-[11px]">※プレイヤーの名前と人数はそのまま維持されます。</span>
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-all"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
