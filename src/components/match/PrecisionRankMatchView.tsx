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

  // 現在の走者インデックス
  const [currentRunnerIndex, setCurrentRunnerIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // 走者ごとの記録
  const [records, setRecords] = useState<Record<string, PlayerRecord>>({});

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const currentRunner = players[currentRunnerIndex] || players[0];
  const isAllFinished = useMemo(() => {
    return players.every((p) => records[p.id] !== undefined);
  }, [players, records]);

  // 計測アニメーションループ
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

  // スタート / ストップ
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

      // 現在走者の記録を保存
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

  // 次の走者へ進む
  const handleNextRunner = () => {
    sound.playTick();
    setElapsedMs(0);
    if (currentRunnerIndex + 1 < players.length) {
      setCurrentRunnerIndex((prev) => prev + 1);
    }
  };

  // 全員リセット（再対戦）
  const handleResetMatch = () => {
    sound.playTick();
    setIsRunning(false);
    setElapsedMs(0);
    setCurrentRunnerIndex(0);
    setRecords({});
  };

  // ランキング算出（誤差の絶対値が小さい順）
  const sortedRanking = useMemo(() => {
    const list = Object.values(records);
    return list.sort((a, b) => Math.abs(a.diffSeconds) - Math.abs(b.diffSeconds));
  }, [records]);

  // 優勝者を決定してモーダルへ
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
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              ⏱️ 体内時計ランキング対戦
            </span>
            <span className="text-xs text-gray-400">
              進捗: {Object.keys(records).length} / {players.length}名 完了
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {game.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {game.short_description || game.description}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenRules}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>ルール</span>
          </button>
          <button
            onClick={handleResetMatch}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-bold rounded-xl border border-gray-700 transition-colors"
            title="最初からやり直す"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 目標秒数選択 */}
      <div className="flex items-center justify-between bg-gray-900/60 border border-gray-800/80 rounded-2xl px-4 py-2.5 text-xs">
        <span className="text-gray-400 font-bold flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
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
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                targetSeconds === sec
                  ? "bg-cyan-500 text-gray-950 shadow-md shadow-cyan-500/20"
                  : "bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
              }`}
            >
              {sec}秒
            </button>
          ))}
        </div>
      </div>

      {/* 現在の走者カード & 計測エリア */}
      {!isAllFinished ? (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-cyan-950/40 border-2 border-cyan-500/40 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold mb-3">
            <span>走者 {currentRunnerIndex + 1} / {players.length}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
            👉 {currentRunner.name} の挑戦！
          </h3>

          {/* タイマー表示（計測中は??.??に暗転） */}
          <div className="min-h-[140px] flex flex-col items-center justify-center bg-gray-950/70 border border-gray-800 rounded-2xl p-6 mb-5">
            {isRunning ? (
              <div className="animate-pulse">
                <div className="text-6xl sm:text-7xl font-mono font-black text-cyan-400 tracking-wider">
                  ??.??
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-400 font-bold mt-2">
                  <Flame className="w-4 h-4 animate-bounce" />
                  <span>心の中で {targetSeconds}秒 をカウント中…！</span>
                </div>
              </div>
            ) : currentRunnerRecord ? (
              <div>
                <div className="text-5xl sm:text-6xl font-mono font-black text-white">
                  {currentRunnerRecord.actualSeconds.toFixed(2)}
                  <span className="text-xl font-normal text-gray-400 ml-1">秒</span>
                </div>
                <div className="mt-2 text-sm font-bold flex items-center justify-center gap-2">
                  <span className="text-gray-400">目標: {targetSeconds}秒</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full ${
                      Math.abs(currentRunnerRecord.diffSeconds) <= 0.3
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    誤差 {currentRunnerRecord.diffSeconds >= 0 ? `+${currentRunnerRecord.diffSeconds.toFixed(2)}` : currentRunnerRecord.diffSeconds.toFixed(2)}秒
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-5xl sm:text-6xl font-mono font-black text-gray-600">
                  {targetSeconds}.00
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  「スタート」を押すと数字が隠れます！
                </p>
              </div>
            )}
          </div>

          {/* ボタン操作 */}
          {!currentRunnerRecord ? (
            <button
              onClick={handleToggle}
              className={`w-full py-4 px-6 rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                isRunning
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/40"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-950 shadow-cyan-500/30"
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
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-gray-950 font-black text-lg rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>次の走者へ交代</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        /* 全員終了！優勝決定アクション */
        <div className="bg-gradient-to-br from-amber-950/40 via-gray-900 to-gray-900 border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>全員のタイム計測完了！</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
            優勝: 👑 {sortedRanking[0]?.playerName} !!
          </h3>
          <p className="text-xs text-amber-400 mb-6">
            誤差わずか {Math.abs(sortedRanking[0]?.diffSeconds || 0).toFixed(2)} 秒の神業体内時計！
          </p>

          <button
            onClick={handleFinishMatch}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>👑 勝者を確定して表彰へ！</span>
          </button>
        </div>
      )}

      {/* 📊 リアルタイム暫定順位表 */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>暫定リーダーボード (誤差最小順)</span>
        </h4>

        <div className="space-y-2">
          {players.map((p) => {
            const rec = records[p.id];
            const rankIndex = sortedRanking.findIndex((r) => r.playerId === p.id);

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  rec
                    ? rankIndex === 0
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                      : "bg-gray-800/80 border-gray-700/80 text-gray-200"
                    : "bg-gray-950/40 border-gray-800/40 text-gray-500"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center font-bold">
                    {rec ? (rankIndex === 0 ? "👑" : `${rankIndex + 1}位`) : "-"}
                  </span>
                  <span className="truncate max-w-[120px]">{p.name}</span>
                  {p.id === currentRunner.id && !rec && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                      挑戦中
                    </span>
                  )}
                </div>

                <div>
                  {rec ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white text-sm">
                        {rec.actualSeconds.toFixed(2)}秒
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded ${
                          Math.abs(rec.diffSeconds) <= 0.3
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {rec.diffSeconds >= 0 ? `+${rec.diffSeconds.toFixed(2)}` : rec.diffSeconds.toFixed(2)}s
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-600">待機中</span>
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
