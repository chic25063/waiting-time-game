"use client";

import React, { useState } from "react";
import { Game } from "@/types/game";
import PromptTool from "@/components/tools/PromptTool";
import BpmTool from "@/components/tools/BpmTool";
import TimerTool from "@/components/tools/TimerTool";
import { Info, Sparkles, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface ArenaGameHostProps {
  game: Game;
}

export default function ArenaGameHost({ game }: ArenaGameHostProps) {
  const [showFullRule, setShowFullRule] = useState<boolean>(false);
  const meta = game.metadata;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* 競技タイトル＆概要カード */}
      <div className="relative overflow-hidden p-5 rounded-3xl bg-white border-2 border-[#2B2D42] shadow-[4px_5px_0_#2B2D42] space-y-3 text-[#2B2D42]">
        {/* 右側の斜め蛍光マーカー */}
        <div
          className="absolute inset-y-0 right-0 w-36 pointer-events-none opacity-65"
          style={{
            backgroundColor: "#FFF275",
            clipPath: "polygon(45% 0, 100% 0, 100% 100%, 0% 100%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2B2D42] text-white text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-[#FFE066]" />
            <span>今回の対戦競技</span>
          </div>

          <button
            type="button"
            onClick={() => setShowFullRule((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-white border-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] hover:bg-amber-50 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showFullRule ? "ルールを閉じる" : "詳しいルール"}</span>
            {showFullRule ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42] tracking-tight">
            {game.title}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#2B2D42]/85 mt-1 leading-relaxed">
            {game.short_description || game.description}
          </p>
        </div>

        {/* 詳しいルール展開 */}
        {showFullRule && (
          <div className="relative z-10 p-3.5 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] text-xs text-[#2B2D42] space-y-2 animate-in fade-in">
            <div className="font-black flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>遊び方・公式ルール:</span>
            </div>
            <p className="whitespace-pre-line font-bold leading-relaxed text-[#2B2D42]/90">
              {game.description}
            </p>
            {game.rules && (
              <p className="whitespace-pre-line font-bold leading-relaxed text-[#2B2D42]/80 pt-2 border-t border-dashed border-[#2B2D42]/30">
                {game.rules}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ゲームマスター対戦ツールエリア */}
      <div className="space-y-4">
        {(meta?.tools?.includes("prompt") ||
          meta?.promptList ||
          game.prompt_list) && (
          <PromptTool
            prompts={meta?.promptList || game.prompt_list || []}
            gameTitle={game.title}
          />
        )}

        {(meta?.tools?.includes("bpm") ||
          meta?.defaultBpm ||
          game.default_bpm) && (
          <BpmTool defaultBpm={meta?.defaultBpm || game.default_bpm || 110} />
        )}

        {(meta?.tools?.includes("timer") || meta?.timerDuration) && (
          <TimerTool
            defaultDuration={meta?.timerDuration || 10}
            isBlindDefault={meta?.blindTimer || false}
          />
        )}

        {!meta?.tools?.includes("prompt") &&
          !meta?.promptList &&
          !game.prompt_list &&
          !meta?.tools?.includes("bpm") &&
          !meta?.defaultBpm &&
          !game.default_bpm &&
          !meta?.tools?.includes("timer") &&
          !meta?.timerDuration && (
            <div className="p-6 text-center rounded-3xl bg-white border-2 border-dashed border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] space-y-2">
              <div className="text-sm font-black text-[#2B2D42]">
                🗣️ リアルで対決しよう！
              </div>
              <p className="text-xs font-bold text-[#2B2D42]/75">
                このゲームは道具不要の会話・アクションゲームです。勝負がついたら下のボタンで結果を記録してください。
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
