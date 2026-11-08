"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Game, Player } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Clock,
  Play,
  Square,
  RotateCcw,
  Trophy,
  Flame,
  Award,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface PrecisionRankMatchViewProps {
  game: Game;
  players: Player[];
  onSelectWinner: (playerId: string, playerName: string) => void;
  onOpenRules: () => void;
}

interface PlayerRecord {
  playerId: string;
  playerName: string;
  actualSeconds: number;
  diffSeconds: number;
  rank?: number;
}

export default function PrecisionRankMatchView({
  game,
  players,
  onSelectWinner,
  onOpenRules,
}: PrecisionRankMatchViewProps) {
  const [targetSeconds, setTargetSeconds] = useState<number>(
    game.metadata?.timerDuration || 10
  );

  const [currentRunnerIndex, setCurrentRunnerIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [records, setRecords] = useState<Record<string, PlayerRecord>>({});

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const currentRunner = players[currentRunnerIndex] || players[0];
  const isAllFinished = useMemo(() => {
    return players.every((p) => records[p.id] !== undefined);
  }, [players, records]);

  useEffect(() => {
    if (!isRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const loop = () => {
      const now = performance.now();
      setElapsedMs(now - startTimeRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning]);

  const handleToggle = () => {
    if (!isRunning) {
      setElapsedMs(0);
      setIsRunning(true);
      sound.playTick();
    } else {
      setIsRunning(false);
      const actual = elapsedMs / 1000;
      const diff = actual - targetSeconds;
      sound.playTimeUp();

      setRecords((prev) => ({
        ...prev,
        [currentRunner.id]: {
          playerId: currentRunner.id,
          playerName: currentRunner.name,
          actualSeconds: actual,
          diffSeconds: diff,
        },
      }));
    }
  };

  const handleNextRunner = () => {
    sound.playTick();
    setElapsedMs(0);
    if (currentRunnerIndex + 1 < players.length) {
      setCurrentRunnerIndex((prev) => prev + 1);
    }
  };

  const handleResetMatch = () => {
    sound.playTick();
    setIsRunning(false);
    setElapsedMs(0);
    setCurrentRunnerIndex(0);
    setRecords({});
  };

  const sortedRanking = useMemo(() => {
    const list = Object.values(records);
    return list.sort((a, b) => Math.abs(a.diffSeconds) - Math.abs(b.diffSeconds));
  }, [records]);

  const handleFinishMatch = () => {
    if (sortedRanking.length > 0) {
      const champ = sortedRanking[0];
      sound.playWin();
      onSelectWinner(champ.playerId, champ.playerName);
    }
  };

  const currentRunnerRecord = records[currentRunner.id];

  return (
    <div className="space-y-5">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="relative bg-white border-2 border-[#2B2D42] rounded-2xl p-4 sm:p-5 shadow-[3px_4px_0_#2B2D42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-[32%] pointer-events-none"
          style={{
            backgroundColor: "#7CE8DC",
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#7CE8DC] text-[#2B2D42] border-2 border-[#2B2D42]">
              ⏱️ 体内時計ランキング対戦
            </span>
            <span className="text-xs font-bold text-[#2B2D42]/70">
              進捗: {Object.keys(records).length} / {players.length}名 完了
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2B2D42] mt-1">
            {game.title}
          </h2>
          <p className="text-xs font-bold text-[#2B2D42]/75 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenRules}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#2B2D42]" />
            <span>ルール</span>
          </button>
          <button
            onClick={handleResetMatch}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6EB] text-[#2B2D42] text-xs font-black rounded-xl border-2 border-[#2B2D42] shadow-[2px_2px_0_#2B2D42] active:translate-y-0.5 transition-all cursor-pointer"
            title="最初からやり直す"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 目標秒数選択 */}
      <div className="flex items-center justify-between bg-white border-2 border-[#2B2D42] rounded-2xl px-4 py-2.5 text-xs shadow-[2px_3px_0_#2B2D42]">
        <span className="text-[#2B2D42] font-black flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#2B2D42]" />
          <span>目標時間:</span>
        </span>
        <div className="flex gap-1.5">
          {[5, 10, 15, 20].map((sec) => (
            <button
              key={sec}
              disabled={isRunning || Object.keys(records).length > 0}
              onClick={() => {
                setTargetSeconds(sec);
                setElapsedMs(0);
              }}
              className={`px-3 py-1 rounded-xl font-black border-2 transition-all cursor-pointer ${
                targetSeconds === sec
                  ? "bg-[#7CE8DC] text-[#2B2D42] border-[#2B2D42] shadow-[1px_2px_0_#2B2D42]"
                  : "bg-[#FAF6EB] text-[#2B2D42]/70 border-[#2B2D42]/30 hover:border-[#2B2D42] disabled:opacity-50"
              }`}
            >
              {sec}秒
            </button>
          ))}
        </div>
      </div>

      {/* 現在の走者カード & 計測エリア */}
      {!isAllFinished ? (
        <div className="bg-white border-2 border-[#2B2D42] rounded-3xl p-6 text-center shadow-[4px_5px_0_#2B2D42] relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7CE8DC] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black mb-3">
            <span>走者 {currentRunnerIndex + 1} / {players.length}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[#2B2D42] mb-4">
            👉 {currentRunner.name} の挑戦！
          </h3>

          {/* タイマー表示（計測中は??.??に暗転） */}
          <div className="min-h-[140px] flex flex-col items-center justify-center bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-2xl p-6 mb-5">
            {isRunning ? (
              <div className="animate-pulse">
                <div className="text-6xl sm:text-7xl font-mono font-black text-[#2B2D42] tracking-wider">
                  ??.??
                </div>
                <div className="inline-flex items-center justify-center gap-1.5 text-xs text-[#2B2D42] bg-[#FFE066] px-3 py-1 rounded-full border border-[#2B2D42] font-black mt-3">
                  <Flame className="w-4 h-4 animate-bounce" />
                  <span>心の中で {targetSeconds}秒 をカウント中…！</span>
                </div>
              </div>
            ) : currentRunnerRecord ? (
              <div>
                <div className="text-5xl sm:text-6xl font-mono font-black text-[#2B2D42]">
                  {currentRunnerRecord.actualSeconds.toFixed(2)}
                  <span className="text-xl font-black text-[#2B2D42]/60 ml-1">秒</span>
                </div>
                <div className="mt-2 text-sm font-black flex items-center justify-center gap-2">
                  <span className="text-[#2B2D42]/70">目標: {targetSeconds}秒</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border-2 border-[#2B2D42] text-xs ${
                      Math.abs(currentRunnerRecord.diffSeconds) <= 0.3
                        ? "bg-[#9AF0A8] text-[#2B2D42]"
                        : "bg-[#FFE066] text-[#2B2D42]"
                    }`}
                  >
                    誤差 {currentRunnerRecord.diffSeconds >= 0 ? `+${currentRunnerRecord.diffSeconds.toFixed(2)}` : currentRunnerRecord.diffSeconds.toFixed(2)}秒
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-5xl sm:text-6xl font-mono font-black text-[#2B2D42]/40">
                  {targetSeconds}.00
                </div>
                <p className="text-xs font-bold text-[#2B2D42]/65 mt-2">
                  「スタート」を押すと数字が隠れます！
                </p>
              </div>
            )}
          </div>

          {/* ボタン操作 */}
          {!currentRunnerRecord ? (
            <button
              onClick={handleToggle}
              className={`w-full py-4 px-6 rounded-2xl font-black text-lg border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] transition-all active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer ${
                isRunning
                  ? "bg-[#FFADAD] hover:bg-[#ff9494] text-[#2B2D42]"
                  : "bg-[#7CE8DC] hover:bg-[#5cdbd0] text-[#2B2D42]"
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>ストップ！（今だ！）</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>計測スタート！</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextRunner}
              className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] font-black text-lg rounded-2xl border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] flex items-center justify-center gap-2 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>次の走者へ交代</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        /* 全員終了！優勝決定アクション */
        <div className="bg-white border-2 border-[#2B2D42] rounded-3xl p-6 text-center shadow-[4px_5px_0_#2B2D42]">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black mb-3">
            <Trophy className="w-4 h-4 text-[#2B2D42]" />
            <span>全員のタイム計測完了！</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[#2B2D42] mb-1">
            優勝: 👑 {sortedRanking[0]?.playerName}
          </h3>
          <p className="text-xs font-bold text-[#2B2D42]/75 mb-6">
            誤差わずか {Math.abs(sortedRanking[0]?.diffSeconds || 0).toFixed(2)} 秒の体内時計！
          </p>

          <button
            onClick={handleFinishMatch}
            className="w-full py-4 px-6 bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] font-black text-lg rounded-2xl border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>👑 勝者を確定して表彰へ！</span>
          </button>
        </div>
      )}

      {/* リアルタイム暫定順位表 */}
      <div className="bg-white border-2 border-[#2B2D42] rounded-2xl p-4 shadow-[3px_4px_0_#2B2D42]">
        <h4 className="text-xs font-black text-[#2B2D42] mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#2B2D42]" />
          <span>暫定リーダーボード (誤差最小順)</span>
        </h4>

        <div className="space-y-2">
          {players.map((p) => {
            const rec = records[p.id];
            const rankIndex = sortedRanking.findIndex((r) => r.playerId === p.id);

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all border-2 border-[#2B2D42] ${
                  rec
                    ? rankIndex === 0
                      ? "bg-[#FFE066] text-[#2B2D42]"
                      : "bg-[#FAF6EB] text-[#2B2D42]"
                    : "bg-[#FAF6EB]/50 text-[#2B2D42]/50 border-dashed"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 text-center font-black">
                    {rec ? (rankIndex === 0 ? "👑" : `${rankIndex + 1}位`) : "-"}
                  </span>
                  <span className="truncate max-w-[120px]">{p.name}</span>
                  {p.id === currentRunner.id && !rec && (
                    <span className="text-[10px] bg-[#7CE8DC] text-[#2B2D42] border border-[#2B2D42] px-1.5 py-0.5 rounded font-black">
                      挑戦中
                    </span>
                  )}
                </div>

                <div>
                  {rec ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#2B2D42] text-sm">
                        {rec.actualSeconds.toFixed(2)}秒
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded border border-[#2B2D42] ${
                          Math.abs(rec.diffSeconds) <= 0.3
                            ? "bg-[#9AF0A8] text-[#2B2D42]"
                            : "bg-white text-[#2B2D42]"
                        }`}
                      >
                        {rec.diffSeconds >= 0 ? `+${rec.diffSeconds.toFixed(2)}` : rec.diffSeconds.toFixed(2)}秒
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#2B2D42]/45">待機中</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
