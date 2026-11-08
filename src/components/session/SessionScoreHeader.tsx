"use client";

import { useState } from "react";
import { useGameSession } from "@/hooks/useGameSession";
import { Trophy, RotateCcw, Crown, Star, AlertTriangle, X } from "lucide-react";

export default function SessionScoreHeader() {
  const { players, resetSessionWins } = useGameSession();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const maxWins = Math.max(...players.map((p) => p.totalWins), 0);

  const handleReset = () => {
    resetSessionWins();
    setShowConfirm(false);
  };

  return (
    <>
      <div className="relative z-10 w-full max-w-md mx-auto mt-3 mb-2 px-3 py-2 rounded-2xl bg-white border-2 border-[#2B2D42] shadow-[3px_3px_0_#2B2D42] flex items-center justify-between gap-2 text-[#2B2D42]">
        <div className="flex items-center gap-1.5 shrink-0 text-[#2B2D42]">
          <Trophy className="w-4 h-4 fill-[#FFE066]" />
          <span className="text-[11px] font-black hidden sm:inline">
            通算スコア
          </span>
        </div>

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {players.map((player, idx) => {
            const isLeader = maxWins > 0 && player.totalWins === maxWins;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black shrink-0 border-2 border-[#2B2D42] ${
                  isLeader
                    ? "bg-[#FFE066] text-[#2B2D42]"
                    : "bg-[#FAF6EB] text-[#2B2D42]"
                }`}
              >
                {isLeader ? (
                  <Crown className="w-3.5 h-3.5 text-[#2B2D42] shrink-0" />
                ) : (
                  <span className="w-3.5 text-[10px] text-[#2B2D42]/70 font-black shrink-0 text-center">
                    {idx + 1}.
                  </span>
                )}
                <span className="truncate max-w-[70px] sm:max-w-[90px]">
                  {player.name}
                </span>
                {Boolean(
                  player.consecutiveWins && player.consecutiveWins >= 2
                ) && (
                  <span
                    className="text-[10px] text-rose-600 font-black"
                    title={`${player.consecutiveWins}連勝中！`}
                  >
                    🔥{player.consecutiveWins}
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 ml-0.5 text-[11px] text-[#2B2D42] font-black shrink-0">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {player.totalWins}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="p-1.5 rounded-xl bg-[#FAF6EB] hover:bg-[#FFADAD] text-[#2B2D42] border-2 border-[#2B2D42] transition-all shrink-0 cursor-pointer"
          title="通算成績をリセット"
          aria-label="通算成績をリセット"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF6EB] border-2 border-[#2B2D42] p-5 shadow-[6px_7px_0_#2B2D42] text-[#2B2D42] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>通算成績のリセット</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-lg bg-white border border-[#2B2D42] text-[#2B2D42] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#2B2D42]/85 leading-relaxed">
              全員の通算勝利数（★）を <strong>0勝</strong> にリセットしますか？
              <br />
              <span className="text-[#2B2D42]/65 text-[11px]">
                ※プレイヤーの名前と人数はそのまま維持されます。
              </span>
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FFADAD] hover:brightness-95 border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] cursor-pointer"
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
