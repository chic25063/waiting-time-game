"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Game, Player, PromptItem } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Shuffle,
  Clock,
  Play,
  CheckCircle2,
  Skull,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface TurnRelayBlitzViewProps {
  game: Game;
  players: Player[];
  onToggleEliminate: (playerId: string) => void;
  onSelectWinner: (playerId: string, playerName: string) => void;
  onOpenRules: () => void;
}

export default function TurnRelayBlitzView({
  game,
  players,
  onToggleEliminate,
  onSelectWinner,
  onOpenRules,
}: TurnRelayBlitzViewProps) {
  const prompts: PromptItem[] = useMemo(
    () => game.metadata?.promptList || ["赤いもの", "丸いもの", "冬といえば", "コンビニにあるもの"],
    [game]
  );

  const initialLimit = game.metadata?.timerDuration || 10;
  const [timeLimit] = useState<number>(initialLimit);
  const [timeLeft, setTimeLeft] = useState<number>(initialLimit);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const [promptIndex, setPromptIndex] = useState<number>(0);
  const currentPrompt = prompts[promptIndex % prompts.length];
  const promptText = typeof currentPrompt === "string" ? currentPrompt : currentPrompt?.question;

  const alivePlayers = useMemo(() => players.filter((p) => !p.isOut), [players]);

  const [turnIndex, setTurnIndex] = useState<number>(0);
  const currentTurnPlayer = alivePlayers[turnIndex % (alivePlayers.length || 1)] || players[0];

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (alivePlayers.length === 1) {
      const champ = alivePlayers[0];
      sound.playWin();
      onSelectWinner(champ.id, champ.name);
    }
  }, [alivePlayers, onSelectWinner]);

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimerRunning(false);
          sound.playTimeUp();
          return 0;
        }
        if (prev <= 4) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handlePass = () => {
    sound.playGacha();
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
    setPromptIndex((prev) => prev + 1);
    setTurnIndex((prev) => (prev + 1) % (alivePlayers.length || 1));
  };

  const handleEliminateCurrent = () => {
    sound.playTick();
    onToggleEliminate(currentTurnPlayer.id);
    setTimeLeft(timeLimit);
    setIsTimerRunning(false);
    setPromptIndex((prev) => prev + 1);
  };

  const handleNextPromptOnly = () => {
    sound.playGacha();
    setPromptIndex((prev) => prev + 1);
  };

  const handleStartTimer = () => {
    sound.playTick();
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
  };

  return (
    <div className="space-y-5">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="relative bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-[32%] pointer-events-none"
          style={{
            backgroundColor: "#E8F655",
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#E8F655] text-[#2B2D42] border-2 border-[#2B2D42]">
              ⚡ ターン制リレー＆タイムプレッシャー
            </span>
            <span className="text-xs font-bold text-[#2B2D42]/70">
              生存: <strong className="text-[#2B2D42] font-black">{alivePlayers.length}</strong> / {players.length}名
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2B2D42] mt-1">
            {game.title}
          </h2>
          <p className="text-xs font-bold text-[#2B2D42]/75 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <button
          onClick={onOpenRules}
          className="relative z-10 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#2B2D42]" />
          <span>ルール</span>
        </button>
      </div>

      {/* 現在の手番プレイヤー表示 */}
      <div className="bg-[#FFE066] border-2 border-[#2B2D42] rounded-3xl p-4 text-center shadow-[3px_4px_0_#2B2D42]">
        <span className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white border border-[#2B2D42] text-[#2B2D42]">
          現在の手番
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-[#2B2D42] mt-1 flex items-center justify-center gap-2">
          <span>👉</span>
          <span className="underline decoration-[#2B2D42] decoration-2 underline-offset-4">
            {currentTurnPlayer.name}
          </span>
          <span>の手番！</span>
        </h3>
      </div>

      {/* 特大お題カード */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-3xl p-6 text-center shadow-[4px_5px_0_#2B2D42] relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-black text-[#2B2D42] bg-[#F9B8E0] px-2.5 py-0.5 rounded-md border border-[#2B2D42] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>お題</span>
          </span>
          <button
            onClick={handleNextPromptOnly}
            className="flex items-center gap-1 text-[11px] font-black text-[#2B2D42] bg-[#FAF6EB] hover:bg-[#FFE066] px-2.5 py-1 rounded-lg border-2 border-[#2B2D42] cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            <span>お題パス</span>
          </button>
        </div>

        <div className="min-h-[100px] flex items-center justify-center py-2 bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-2xl px-4">
          <p className="text-2xl sm:text-3xl font-black text-[#2B2D42] tracking-wide leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* 制限時間タイマー */}
        <div className="mt-4 pt-4 border-t-2 border-dashed border-[#2B2D42]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2B2D42]" />
            <span
              className={`font-mono text-2xl font-black ${
                timeLeft <= 3 && timeLeft > 0 ? "text-[#E0533C] animate-ping" : "text-[#2B2D42]"
              }`}
            >
              {timeLeft}
              <span className="text-xs text-[#2B2D42]/65 font-bold ml-0.5">秒</span>
            </span>
          </div>

          {!isTimerRunning ? (
            <button
              onClick={handleStartTimer}
              className="px-4 py-2 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] font-black text-xs rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] flex items-center gap-1.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>タイマー開始</span>
            </button>
          ) : (
            <span className="text-xs text-[#2B2D42] bg-[#FFF275] px-2.5 py-1 rounded-full border border-[#2B2D42] animate-pulse font-black">
              カウントダウン中…！
            </span>
          )}
        </div>
      </div>

      {/* アクションボタン（セーフ vs ミス脱落） */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePass}
          className="py-4 px-4 bg-[#9AF0A8] hover:bg-[#82e893] text-[#2B2D42] font-black text-base rounded-2xl border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>言えた！ 次へパス ➔</span>
        </button>

        <button
          onClick={handleEliminateCurrent}
          className="py-4 px-4 bg-[#FFADAD] hover:bg-[#ff9494] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-base rounded-2xl shadow-[3px_4px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Skull className="w-5 h-5 text-[#2B2D42]" />
          <span>詰まった (脱落)</span>
        </button>
      </div>

      {/* 生存・脱落状況一覧 */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 shadow-[3px_4px_0_#2B2D42]">
        <div className="text-xs font-black text-[#2B2D42] mb-2">参加プレイヤー状況:</div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const isTurn = p.id === currentTurnPlayer.id && !p.isOut;
            return (
              <span
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-xl font-black flex items-center gap-1.5 border-2 border-[#2B2D42] ${
                  p.isOut
                    ? "bg-[#2B2D42]/10 text-[#2B2D42]/50 line-through"
                    : isTurn
                    ? "bg-[#FFE066] text-[#2B2D42] shadow-[1px_2px_0_#2B2D42]"
                    : "bg-[#FAF6EB] text-[#2B2D42]"
                }`}
              >
                <span>{p.isOut ? "✕" : isTurn ? "👉" : "●"}</span>
                <span>{p.name}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
