"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DuelRule, MatchSessionConfig } from "@/types/matchMode";
import { useActiveMatch } from "@/context/ActiveMatchContext";
import { useGameSession } from "@/hooks/useGameSession";
import GameExclusionSelector from "./GameExclusionSelector";
import { Swords, X, Flame, Sparkles } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-rose-500/40 rounded-3xl p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2 text-rose-400">
            <Swords className="w-5 h-5" />
            <h3 className="text-lg font-black text-white">1対1 対戦モード設定</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* プレイヤー名入力 */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400">対戦プレイヤー名:</div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-gray-950/70 border border-gray-800 p-2.5 rounded-xl">
              <label className="text-[10px] text-rose-400 font-bold block mb-1">
                PLAYER 1
              </label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                placeholder="名前"
                maxLength={10}
              />
            </div>

            <div className="bg-gray-950/70 border border-gray-800 p-2.5 rounded-xl">
              <label className="text-[10px] text-blue-400 font-bold block mb-1">
                PLAYER 2
              </label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                placeholder="名前"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* 勝利条件選択 */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-400">勝利条件:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDuelRule("first_to_3")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                duelRule === "first_to_3"
                  ? "bg-rose-500/20 border-rose-500 text-rose-300 font-black shadow-md shadow-rose-500/20"
                  : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <div className="text-sm">3本先取</div>
              <div className="text-[10px] text-gray-400 mt-0.5">サクッと決着！</div>
            </button>

            <button
              type="button"
              onClick={() => setDuelRule("first_to_5")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                duelRule === "first_to_5"
                  ? "bg-rose-500/20 border-rose-500 text-rose-300 font-black shadow-md shadow-rose-500/20"
                  : "bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <div className="text-sm">5本先取</div>
              <div className="text-[10px] text-gray-400 mt-0.5">じっくり白熱勝負！</div>
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
          className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 hover:from-rose-400 hover:to-red-400 text-white font-black text-lg rounded-2xl shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Flame className="w-5 h-5" />
          <span>🔥 1vs1 対戦スタート！</span>
        </button>
      </div>
    </div>
  );
}
