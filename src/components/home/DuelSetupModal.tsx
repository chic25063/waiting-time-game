"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DuelRule, MatchSessionConfig } from "@/types/matchMode";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import { useGameSession } from "@/hooks/useGameSession";
import GameExclusionSelector from "./GameExclusionSelector";
import { Swords, X, Flame } from "lucide-react";

interface DuelSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DuelSetupModal({ isOpen, onClose }: DuelSetupModalProps) {
  const router = useRouter();
  const { startMatch } = useActiveMatch();
  const { players: sessionPlayers } = useGameSession();

  const DUEL_PLAYERS_STORAGE_KEY = "machajikan_duel_players_v1";

  const [p1Name, setP1Name] = useState<string>(
    sessionPlayers[0]?.name || "プレイヤー 1"
  );
  const [p2Name, setP2Name] = useState<string>(
    sessionPlayers[1]?.name || "プレイヤー 2"
  );
  const [duelRule, setDuelRule] = useState<DuelRule>("first_to_3");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // 前回のプレイヤー名があれば読み込み
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DUEL_PLAYERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.p1) setP1Name(parsed.p1);
        if (parsed.p2) setP2Name(parsed.p2);
      }
    } catch (e) {
      console.error("Failed to load duel player names:", e);
    }
  }, []);

  if (!isOpen) return null;

  const handleStart = () => {
    const finalP1 = p1Name.trim() || "プレイヤー 1";
    const finalP2 = p2Name.trim() || "プレイヤー 2";

    try {
      localStorage.setItem(
        DUEL_PLAYERS_STORAGE_KEY,
        JSON.stringify({ p1: finalP1, p2: finalP2 })
      );
    } catch (e) {
      console.error("Failed to save duel players:", e);
    }

    const config: MatchSessionConfig = {
      mode: "duel_1v1",
      players: [
        { id: "p-1", name: finalP1 },
        { id: "p-2", name: finalP2 },
      ],
      duelRule,
      excludedGameIds: excludedIds,
    };

    startMatch(config);
    onClose();
    router.push("/arena");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 text-[#2B2D42] shadow-[6px_7px_0_#2B2D42] max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2B2D42]/25">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#7CE8DC] border-2 border-[#2B2D42] flex items-center justify-center">
              <Swords className="w-4 h-4 text-[#2B2D42]" />
            </span>
            <h3 className="text-lg font-black text-[#2B2D42]">
              1対1 対戦モード設定
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] hover:bg-amber-100 cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* プレイヤー名入力 */}
        <div className="space-y-2.5">
          <div className="text-xs font-black text-[#2B2D42]">
            対戦プレイヤー名:
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl shadow-[2px_2px_0_#2B2D42]">
              <label className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFADAD] text-[#2B2D42] font-black inline-block mb-1">
                プレイヤー 1
              </label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none"
                placeholder="名前"
                maxLength={10}
              />
            </div>

            <div className="bg-white border-2 border-[#2B2D42] p-2.5 rounded-xl shadow-[2px_2px_0_#2B2D42]">
              <label className="text-[10px] px-1.5 py-0.2 rounded bg-[#7CE8DC] text-[#2B2D42] font-black inline-block mb-1">
                プレイヤー 2
              </label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full bg-transparent text-sm font-black text-[#2B2D42] focus:outline-none"
                placeholder="名前"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* 勝利条件選択 */}
        <div className="space-y-2">
          <div className="text-xs font-black text-[#2B2D42]">勝利条件:</div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDuelRule("first_to_3")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                duelRule === "first_to_3"
                  ? "bg-[#7CE8DC] text-[#2B2D42] font-black shadow-[3px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-black">3本先取</div>
              <div className="text-[10px] font-bold opacity-80 mt-0.5">
                サクッと決着！
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDuelRule("first_to_5")}
              className={`p-3 rounded-2xl border-2 border-[#2B2D42] text-center transition-all cursor-pointer ${
                duelRule === "first_to_5"
                  ? "bg-[#7CE8DC] text-[#2B2D42] font-black shadow-[3px_3px_0_#2B2D42]"
                  : "bg-white text-[#2B2D42]/70 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-black">5本先取</div>
              <div className="text-[10px] font-bold opacity-80 mt-0.5">
                じっくり白熱勝負！
              </div>
            </button>
          </div>
        </div>

        {/* 除外ゲーム設定 */}
        <GameExclusionSelector
          playerCount={2}
          excludedGameIds={excludedIds}
          onChangeExcludedIds={setExcludedIds}
        />

        {/* スタートボタン */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-lg rounded-2xl shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Flame className="w-5 h-5 fill-current" />
          <span>1vs1 対戦スタート！</span>
        </button>
      </div>
    </div>
  );
}
