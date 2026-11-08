"use client";

import React, { useMemo, useState, useEffect } from "react";
import { getAllGamesWithCustom } from "@/lib/customGames";
import { CheckSquare, Square, Filter } from "lucide-react";

interface GameExclusionSelectorProps {
  playerCount: number;
  excludedGameIds: string[];
  onChangeExcludedIds: (ids: string[]) => void;
}

export default function GameExclusionSelector({
  playerCount,
  excludedGameIds,
  onChangeExcludedIds,
}: GameExclusionSelectorProps) {
  const [allGames, setAllGames] = useState(() => getAllGamesWithCustom());

  useEffect(() => {
    const handleUpdate = () => {
      setAllGames(getAllGamesWithCustom());
    };
    window.addEventListener("customGamesUpdated", handleUpdate);
    return () => window.removeEventListener("customGamesUpdated", handleUpdate);
  }, []);

  // この人数で遊べるゲーム一覧（自作ゲームを含む）
  const eligibleGames = useMemo(() => {
    return allGames.filter(
      (g) => g.min_players <= playerCount && g.max_players >= playerCount
    );
  }, [allGames, playerCount]);

  const EXCLUSION_STORAGE_KEY = "machajikan_excluded_games_v1";

  // 初回マウント時にlocalStorageから除外リストを読み込み
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(EXCLUSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onChangeExcludedIds(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load excluded games:", e);
    }
  }, []);

  const saveToStorage = (ids: string[]) => {
    onChangeExcludedIds(ids);
    try {
      localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error("Failed to save excluded games:", e);
    }
  };

  const toggleGame = (id: string) => {
    if (excludedGameIds.includes(id)) {
      saveToStorage(excludedGameIds.filter((item) => item !== id));
    } else {
      // 最低1つは残す
      if (excludedGameIds.length >= eligibleGames.length - 1) {
        return;
      }
      saveToStorage([...excludedGameIds, id]);
    }
  };

  const handleSelectAll = () => {
    saveToStorage([]);
  };

  const handleDeselectAll = () => {
    // 最初の1個だけ残してすべて除外
    if (eligibleGames.length > 1) {
      saveToStorage(eligibleGames.slice(1).map((g) => g.id));
    }
  };

  const activeCount = eligibleGames.length - excludedGameIds.length;

  return (
    <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-3.5 space-y-2.5 shadow-[2px_3px_0_#2B2D42]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-black text-[#2B2D42] flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#2B2D42]" />
          <span>除外設定 (やりたくないゲームをOFF)</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FFF275] border border-[#2B2D42] text-[#2B2D42] font-black cursor-pointer hover:brightness-95"
          >
            全ON
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FAF6EB] border border-[#2B2D42]/40 text-[#2B2D42]/70 hover:text-[#2B2D42] font-bold cursor-pointer"
          >
            全OFF
          </button>
        </div>
      </div>

      <div className="text-[11px] font-bold text-[#2B2D42]/75">
        抽選対象:{" "}
        <strong className="px-1.5 py-0.2 rounded bg-[#FFF275] text-[#2B2D42] font-black">
          {activeCount}
        </strong>{" "}
        / {eligibleGames.length} 種類
      </div>

      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
        {eligibleGames.map((g) => {
          const isExcluded = excludedGameIds.includes(g.id);
          const isIncluded = !isExcluded;

          return (
            <button
              type="button"
              key={g.id}
              onClick={() => toggleGame(g.id)}
              className={`p-2 rounded-xl text-left border-2 text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                isIncluded
                  ? "bg-[#FAF6EB] border-[#2B2D42] text-[#2B2D42] font-extrabold hover:bg-[#FFF275]/40"
                  : "bg-slate-100 border-[#2B2D42]/25 text-[#2B2D42]/40 line-through"
              }`}
            >
              {isIncluded ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#2B2D42] shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#2B2D42]/35 shrink-0" />
              )}
              <span className="truncate flex-1">{g.title}</span>
              {g.isCustom && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#FFE066] border border-[#2B2D42] text-[#2B2D42] font-black shrink-0">
                  ★自作
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
