"use client";

import React, { useState, useEffect, useRef } from "react";
import { Game } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";
import { sound } from "@/lib/sound";
import { Dices, Flame, FastForward } from "lucide-react";

interface GameRouletteOverlayProps {
  isOpen: boolean;
  targetGame: Game;
  roundNumber: number;
  onFinish: () => void;
}

export default function GameRouletteOverlay({
  isOpen,
  targetGame,
  roundNumber,
  onFinish,
}: GameRouletteOverlayProps) {
  const [displayGame, setDisplayGame] = useState<Game>(targetGame);
  const [isDecided, setIsDecided] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsDecided(false);
      return;
    }

    setIsDecided(false);
    let speed = 60;
    let count = 0;
    const maxCount = 28;
    const pool = getAllGamesWithCustom();

    const spin = () => {
      intervalRef.current = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setDisplayGame(pool[randomIndex] || ALL_GAMES[0]);
        sound.playTick();
        count++;

        if (count < maxCount) {
          if (count > maxCount - 8) {
            speed += 35;
          }
          spin();
        } else {
          setDisplayGame(targetGame);
          setIsDecided(true);
          sound.playGacha();
          timerRef.current = setTimeout(() => {
            onFinish();
          }, 1100);
        }
      }, speed);
    };

    spin();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, targetGame, onFinish]);

  const handleSkip = () => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayGame(targetGame);
    setIsDecided(true);
    sound.playGacha();
    setTimeout(() => {
      onFinish();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleSkip}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer select-none"
    >
      <div className="w-full max-w-md text-center space-y-5">
        {/* ラウンドバッジ */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-sm font-black shadow-[3px_3px_0_#2B2D42] animate-bounce">
          <Flame className="w-4 h-4 fill-current" />
          <span>第{roundNumber}戦 競技抽選</span>
        </div>

        {/* スロットルーレット表示カード（ノート風白カード＋斜め蛍光マーカー） */}
        <div
          className={`relative overflow-hidden p-8 rounded-3xl bg-white border-2 border-[#2B2D42] text-[#2B2D42] transition-all duration-300 ${
            isDecided
              ? "shadow-[8px_9px_0_#2B2D42] scale-105"
              : "shadow-[5px_6px_0_#2B2D42]"
          }`}
        >
          {/* 斜め蛍光マーカー */}
          <div
            className="absolute inset-y-0 right-0 w-[52%] pointer-events-none transition-colors duration-200"
            style={{
              backgroundColor: isDecided ? "#FFE066" : "#7CE8DC",
              clipPath: "polygon(42% 0, 100% 0, 100% 100%, 0% 100%)",
            }}
          />

          <div className="relative z-10 w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] flex items-center justify-center text-[#2B2D42] shadow-[2px_3px_0_#2B2D42]">
            <Dices
              className={`w-8 h-8 ${!isDecided ? "animate-spin" : "scale-110"}`}
            />
          </div>

          <div className="relative z-10 text-xs font-black text-[#2B2D42]/70 mb-1">
            {isDecided ? "🔥 今回の対戦競技に決定！ 🔥" : "ルーレット回転中..."}
          </div>

          <h2
            className={`relative z-10 text-2xl sm:text-3xl font-black text-[#2B2D42] transition-all ${
              isDecided ? "scale-105" : ""
            }`}
          >
            {displayGame.title}
          </h2>

          {displayGame.isCustom && (
            <div className="relative z-10 inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black">
              <span>★ オリジナル自作ゲーム</span>
            </div>
          )}

          <p className="relative z-10 text-xs sm:text-sm font-bold text-[#2B2D42]/80 mt-3 line-clamp-2 leading-relaxed">
            {displayGame.short_description || displayGame.description}
          </p>

          {isDecided && displayGame.metadata?.tags && (
            <div className="relative z-10 flex flex-wrap justify-center gap-1.5 mt-4">
              {displayGame.metadata.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#2B2D42] text-[#2B2D42]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* スキップガイド */}
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#2B2D42] text-xs text-[#2B2D42] font-black">
          <FastForward className="w-3.5 h-3.5" />
          <span>画面タップでスキップ</span>
        </div>
      </div>
    </div>
  );
}
