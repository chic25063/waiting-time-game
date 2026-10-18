"use client";

import React, { useState, useEffect, useRef } from "react";
import { Game } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { sound } from "@/lib/sound";
import { Sparkles, Dices, Flame, FastForward } from "lucide-react";

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
    let speed = 60; // 初速 (ms)
    let count = 0;
    const maxCount = 28; // 約2.5秒で停止

    const spin = () => {
      intervalRef.current = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * ALL_GAMES.length);
        setDisplayGame(ALL_GAMES[randomIndex]);
        sound.playTick();
        count++;

        if (count < maxCount) {
          // 徐々にスローダウン
          if (count > maxCount - 8) {
            speed += 35;
          }
          spin();
        } else {
          // 抽選確定
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

  // タップまたはスキップボタンで即完了
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-150 cursor-pointer select-none"
    >
      <div className="w-full max-w-md text-center space-y-6">
        {/* ラウンドバッジ */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-sm font-black tracking-wider animate-bounce">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>ROUND {roundNumber} 競技抽選</span>
        </div>

        {/* スロットルーレット表示カード */}
        <div
          className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${
            isDecided
              ? "bg-gradient-to-b from-amber-950/70 via-gray-900 to-slate-950 border-amber-400 shadow-2xl shadow-amber-500/30 scale-105"
              : "bg-gray-950 border-indigo-500/40 shadow-xl"
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Dices
              className={`w-8 h-8 ${!isDecided ? "animate-spin" : "scale-110"}`}
            />
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            {isDecided ? "🔥 今回の対戦競技に決定！ 🔥" : "ルーレット回転中..."}
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-black transition-all ${
              isDecided
                ? "text-amber-300 scale-110 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                : "text-white"
            }`}
          >
            {displayGame.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 line-clamp-2 leading-relaxed">
            {displayGame.short_description || displayGame.description}
          </p>

          {isDecided && displayGame.metadata?.tags && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {displayGame.metadata.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* スキップガイド */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <FastForward className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>画面タップでスキップ</span>
        </div>
      </div>
    </div>
  );
}
