"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Game, Player, PromptItem } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Shuffle,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  Skull,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Flame,
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
  const [timeLimit, setTimeLimit] = useState<number>(initialLimit);
  const [timeLeft, setTimeLeft] = useState<number>(initialLimit);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // お題インデックス
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const currentPrompt = prompts[promptIndex % prompts.length];
  const promptText = typeof currentPrompt === "string" ? currentPrompt : currentPrompt?.question;

  // 生存プレイヤーのみを抽出
  const alivePlayers = useMemo(() => players.filter((p) => !p.isOut), [players]);

  // 現在の手番プレイヤーインデックス（alivePlayersの中でのインデックス）
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const currentTurnPlayer = alivePlayers[turnIndex % (alivePlayers.length || 1)] || players[0];

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 残り1名になったら自動勝者判定
  useEffect(() => {
    if (alivePlayers.length === 1) {
      const champ = alivePlayers[0];
      sound.playWin();
      onSelectWinner(champ.id, champ.name);
    }
  }, [alivePlayers, onSelectWinner]);

  // カウントダウンタイマー
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

  // セーフ！次の人へパス
  const handlePass = () => {
    sound.playGacha();
    // タイマーリセットして次へ
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
    setPromptIndex((prev) => prev + 1);
    setTurnIndex((prev) => (prev + 1) % (alivePlayers.length || 1));
  };

  // 手番プレイヤーがミスまたは時間切れで脱落
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
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⚡ ターン制リレー＆タイムプレッシャー
            </span>
            <span className="text-xs text-gray-400">
              生存: <strong className="text-amber-400 font-bold">{alivePlayers.length}</strong> / {players.length}名
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {game.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <button
          onClick={onOpenRules}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>ルール</span>
        </button>
      </div>

      {/* 現在の手番プレイヤー表示 */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 border-2 border-amber-500/40 rounded-3xl p-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
          CURRENT TURN
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-center justify-center gap-2">
          <span>👉</span>
          <span className="underline decoration-amber-400 underline-offset-4">
            {currentTurnPlayer.name}
          </span>
          <span>の手番！</span>
        </h3>
      </div>

      {/* 特大お題カード */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>お題</span>
          </span>
          <button
            onClick={handleNextPromptOnly}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-gray-800/80 px-2.5 py-1 rounded-lg"
          >
            <Shuffle className="w-3 h-3" />
            <span>お題パス</span>
          </button>
        </div>

        <div className="min-h-[100px] flex items-center justify-center py-2">
          <p className="text-2xl sm:text-3xl font-black text-white tracking-wide leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* 制限時間タイマー */}
        <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className={`font-mono text-2xl font-black ${
              timeLeft <= 3 && timeLeft > 0 ? "text-rose-500 animate-ping" : "text-amber-400"
            }`}>
              {timeLeft}
              <span className="text-xs text-gray-400 font-normal ml-0.5">秒</span>
            </span>
          </div>

          {!isTimerRunning ? (
            <button
              onClick={handleStartTimer}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>タイマー開始</span>
            </button>
          ) : (
            <span className="text-xs text-amber-300 animate-pulse font-bold">
              カウントダウン中…！
            </span>
          )}
        </div>
      </div>

      {/* アクションボタン（セーフ vs ミス脱落） */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePass}
          className="py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>言えた！ 次へパス ➔</span>
        </button>

        <button
          onClick={handleEliminateCurrent}
          className="py-4 px-4 bg-gray-800 hover:bg-rose-950/50 hover:border-rose-500/50 text-gray-300 hover:text-rose-200 border border-gray-700 font-bold text-base rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Skull className="w-5 h-5 text-rose-400" />
          <span>詰まった (脱落)</span>
        </button>
      </div>

      {/* 生存・脱落状況一覧 */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-400 mb-2">参加プレイヤー状況:</div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const isTurn = p.id === currentTurnPlayer.id && !p.isOut;
            return (
              <span
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border ${
                  p.isOut
                    ? "bg-gray-950/60 border-gray-800 text-gray-600 line-through"
                    : isTurn
                    ? "bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-500/20"
                    : "bg-gray-800/80 border-gray-700 text-gray-200"
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
