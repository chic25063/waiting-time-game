"use client";

import React, { useState } from "react";
import { Game } from "@/types/game";
import PromptTool from "@/components/tools/PromptTool";
import BpmTool from "@/components/tools/BpmTool";
import TimerTool from "@/components/tools/TimerTool";
import ScoreTool from "@/components/tools/ScoreTool";
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
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>現在の対戦競技</span>
          </div>

          <button
            type="button"
            onClick={() => setShowFullRule((prev) => !prev)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{showFullRule ? "ルールを閉じる" : "詳しいルール"}</span>
            {showFullRule ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {game.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            {game.short_description || game.description}
          </p>
        </div>

        {/* 詳しいルール展開 */}
        {showFullRule && (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-2 animate-in fade-in">
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>遊び方・公式ルール:</span>
            </div>
            <p className="whitespace-pre-line leading-relaxed text-slate-300">
              {game.description}
            </p>
            {game.rules && (
              <p className="whitespace-pre-line leading-relaxed text-slate-400 pt-1 border-t border-white/5">
                {game.rules}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ゲームマスター対戦ツールエリア */}
      <div className="space-y-4">
        {/* お題ガチャツール */}
        {(meta?.tools?.includes("prompt") || meta?.promptList || game.prompt_list) && (
          <PromptTool
            prompts={meta?.promptList || game.prompt_list || []}
            gameTitle={game.title}
          />
        )}

        {/* BPMメトロノームツール */}
        {(meta?.tools?.includes("bpm") || meta?.defaultBpm || game.default_bpm) && (
          <BpmTool defaultBpm={meta?.defaultBpm || game.default_bpm || 110} />
        )}

        {/* タイマー・ストップウォッチツール */}
        {(meta?.tools?.includes("timer") || meta?.timerDuration) && (
          <TimerTool
            defaultDuration={meta?.timerDuration || 10}
            isBlindDefault={meta?.blindTimer || false}
          />
        )}

        {/* 専用ツールがないシンプルゲーム用のサポートガイド */}
        {!meta?.tools?.includes("prompt") &&
          !meta?.promptList &&
          !game.prompt_list &&
          !meta?.tools?.includes("bpm") &&
          !meta?.defaultBpm &&
          !game.default_bpm &&
          !meta?.tools?.includes("timer") &&
          !meta?.timerDuration && (
            <div className="p-6 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 space-y-2">
              <div className="text-sm font-bold text-slate-300">
                🗣️ リアルで対決しよう！
              </div>
              <p className="text-xs text-slate-400">
                このゲームは道具不要の会話・アクションゲームです。勝負がついたら下のボタンで結果を記録してください。
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
