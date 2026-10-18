"use client";

import React, { useState, useMemo } from "react";
import { Game, Player } from "@/types/game";
import { sound } from "@/lib/sound";
import {
  Swords,
  Trophy,
  Crown,
  RotateCcw,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Flame,
} from "lucide-react";

interface TournamentDuelViewProps {
  game: Game;
  players: Player[];
  onSelectWinner: (playerId: string, playerName: string) => void;
  onOpenRules: () => void;
}

interface TournamentMatch {
  id: string;
  roundName: string;
  playerA?: Player;
  playerB?: Player;
  winner?: Player;
}

export default function TournamentDuelView({
  game,
  players,
  onSelectWinner,
  onOpenRules,
}: TournamentDuelViewProps) {
  const isDirectDuel = players.length === 2;

  // 2人プレイ用: 3本先取ポイント
  const [scores, setScores] = useState<Record<string, number>>(() => ({
    [players[0]?.id || "p1"]: 0,
    [players[1]?.id || "p2"]: 0,
  }));
  const TARGET_POINTS = 3;

  // 多人数用トーナメントの構築
  const [matches, setMatches] = useState<TournamentMatch[]>(() => {
    if (players.length <= 2) return [];

    // 4人以下の簡易トーナメント
    if (players.length <= 4) {
      return [
        {
          id: "m-semi-1",
          roundName: "準決勝 第1試合",
          playerA: players[0],
          playerB: players[1],
        },
        {
          id: "m-semi-2",
          roundName: "準決勝 第2試合",
          playerA: players[2],
          playerB: players[3] || undefined, // 3人なら不戦勝
          winner: players[3] ? undefined : players[2], // 3人ならplayer[2]が自動進出
        },
        {
          id: "m-final",
          roundName: "🏆 決勝戦",
          playerA: undefined,
          playerB: players.length === 3 ? players[2] : undefined,
        },
      ];
    }

    // 5〜8人のトーナメント
    return [
      { id: "m-r1-1", roundName: "1回戦 ①", playerA: players[0], playerB: players[1] },
      { id: "m-r1-2", roundName: "1回戦 ②", playerA: players[2], playerB: players[3] },
      { id: "m-r1-3", roundName: "1回戦 ③", playerA: players[4], playerB: players[5] },
      { id: "m-r1-4", roundName: "1回戦 ④", playerA: players[6], playerB: players[7] },
      { id: "m-semi-1", roundName: "準決勝 ①", playerA: undefined, playerB: undefined },
      { id: "m-semi-2", roundName: "準決勝 ②", playerA: undefined, playerB: undefined },
      { id: "m-final", roundName: "🏆 決勝戦", playerA: undefined, playerB: undefined },
    ];
  });

  // 2人デュエルでポイント加算
  const handleAddPoint = (playerId: string) => {
    sound.playTick();
    const current = scores[playerId] || 0;
    const next = current + 1;
    setScores((prev) => ({ ...prev, [playerId]: next }));

    // 規定点に到達したら優勝！
    if (next >= TARGET_POINTS) {
      const winnerPlayer = players.find((p) => p.id === playerId);
      if (winnerPlayer) {
        sound.playWin();
        onSelectWinner(winnerPlayer.id, winnerPlayer.name);
      }
    }
  };

  // トーナメントで試合の勝者を決定
  const handleTournamentWin = (matchId: string, winner: Player) => {
    sound.playTick();

    setMatches((prev) => {
      const next = prev.map((m) => (m.id === matchId ? { ...m, winner } : m));

      // 4人制の場合
      if (players.length <= 4) {
        const semi1 = next.find((m) => m.id === "m-semi-1");
        const semi2 = next.find((m) => m.id === "m-semi-2");
        const finalMatch = next.find((m) => m.id === "m-final");

        if (finalMatch) {
          finalMatch.playerA = semi1?.winner || finalMatch.playerA;
          finalMatch.playerB = semi2?.winner || finalMatch.playerB;
        }

        // 決勝戦が決着した場合
        if (matchId === "m-final") {
          sound.playWin();
          onSelectWinner(winner.id, winner.name);
        }
      } else {
        // 5〜8人制の進行ロジック
        const r1_1 = next.find((m) => m.id === "m-r1-1");
        const r1_2 = next.find((m) => m.id === "m-r1-2");
        const r1_3 = next.find((m) => m.id === "m-r1-3");
        const r1_4 = next.find((m) => m.id === "m-r1-4");
        const semi1 = next.find((m) => m.id === "m-semi-1");
        const semi2 = next.find((m) => m.id === "m-semi-2");
        const finalMatch = next.find((m) => m.id === "m-final");

        if (semi1) {
          semi1.playerA = r1_1?.winner;
          semi1.playerB = r1_2?.winner;
        }
        if (semi2) {
          semi2.playerA = r1_3?.winner;
          semi2.playerB = r1_4?.winner;
        }
        if (finalMatch) {
          finalMatch.playerA = semi1?.winner;
          finalMatch.playerB = semi2?.winner;
        }

        if (matchId === "m-final") {
          sound.playWin();
          onSelectWinner(winner.id, winner.name);
        }
      }

      return [...next];
    });
  };

  // リセット
  const handleReset = () => {
    sound.playTick();
    setScores({
      [players[0]?.id || "p1"]: 0,
      [players[1]?.id || "p2"]: 0,
    });
    // トーナメント再生成
    if (players.length > 2 && players.length <= 4) {
      setMatches([
        { id: "m-semi-1", roundName: "準決勝 第1試合", playerA: players[0], playerB: players[1] },
        { id: "m-semi-2", roundName: "準決勝 第2試合", playerA: players[2], playerB: players[3] || undefined, winner: players[3] ? undefined : players[2] },
        { id: "m-final", roundName: "🏆 決勝戦", playerA: undefined, playerB: players.length === 3 ? players[2] : undefined },
      ]);
    }
  };

  return (
    <div className="space-y-5">
      {/* ゲームタイトル ＆ ヘッダー情報 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {isDirectDuel ? "⚔️ 1vs1 ラウンドデュエル" : "🏆 勝ち抜きトーナメント"}
            </span>
            <span className="text-xs text-gray-400">
              {isDirectDuel ? `${TARGET_POINTS}本先取マッチ` : `${players.length}名 参加トーナメント`}
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
            <HelpCircle className="w-4 h-4 text-rose-400" />
            <span>ルール</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-bold rounded-xl border border-gray-700 transition-colors"
            title="リセット"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2名直接対戦の場合: 3本先取ポイントバトル */}
      {isDirectDuel ? (
        <div className="space-y-4">
          <div className="text-center text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>先に {TARGET_POINTS} 本取った方の勝利！</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {players.map((p, idx) => {
              const score = scores[p.id] || 0;
              const isMatchPoint = score === TARGET_POINTS - 1;

              return (
                <div
                  key={p.id}
                  className={`bg-gray-900/90 border-2 rounded-3xl p-5 text-center transition-all ${
                    idx === 0 ? "border-rose-500/40" : "border-blue-500/40"
                  }`}
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    idx === 0 ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {idx === 0 ? "PLAYER 1" : "PLAYER 2"}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1 truncate">
                    {p.name}
                  </h3>

                  <div className="text-6xl font-mono font-black text-amber-400 my-3">
                    {score}
                    <span className="text-xs text-gray-500 font-normal ml-1">/{TARGET_POINTS}</span>
                  </div>

                  {isMatchPoint && (
                    <span className="inline-block text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold mb-3 animate-pulse">
                      マッチポイント！
                    </span>
                  )}

                  <button
                    onClick={() => handleAddPoint(p.id)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                      idx === 0
                        ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30"
                    }`}
                  >
                    <span>1本取った！ (+1)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3人以上のトーナメント表 */
        <div className="space-y-4">
          <div className="text-center text-xs text-gray-400">
            対戦カードの勝者をタップしてトーナメントを進めよう！
          </div>

          <div className="space-y-3">
            {matches.map((m) => {
              const isReady = m.playerA && m.playerB && !m.winner;
              const isFinal = m.id === "m-final";

              return (
                <div
                  key={m.id}
                  className={`bg-gray-900/80 border rounded-2xl p-4 transition-all ${
                    isFinal
                      ? "border-amber-500/60 bg-gradient-to-r from-gray-900 via-amber-950/20 to-gray-900"
                      : "border-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                      isFinal ? "text-amber-400" : "text-gray-400"
                    }`}>
                      {isFinal && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{m.roundName}</span>
                    </span>
                    {m.winner && (
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        勝者: {m.winner.name} ➔ 進出
                      </span>
                    )}
                  </div>

                  {/* 対戦枠 */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* プレイヤーA */}
                    <button
                      disabled={!isReady}
                      onClick={() => m.playerA && handleTournamentWin(m.id, m.playerA)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        m.winner?.id === m.playerA?.id
                          ? "bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold"
                          : isReady
                          ? "bg-gray-800 hover:bg-gray-700/80 border-gray-700 text-white cursor-pointer active:scale-95"
                          : "bg-gray-950/40 border-gray-800 text-gray-600"
                      }`}
                    >
                      <div className="text-[10px] text-gray-400">SIDE A</div>
                      <div className="text-sm font-bold truncate mt-0.5">
                        {m.playerA ? m.playerA.name : "待機中..."}
                      </div>
                      {isReady && (
                        <div className="text-[10px] text-amber-400 font-bold mt-1">
                          タップで勝利 ➔
                        </div>
                      )}
                    </button>

                    {/* プレイヤーB */}
                    <button
                      disabled={!isReady}
                      onClick={() => m.playerB && handleTournamentWin(m.id, m.playerB)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        m.winner?.id === m.playerB?.id
                          ? "bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold"
                          : isReady
                          ? "bg-gray-800 hover:bg-gray-700/80 border-gray-700 text-white cursor-pointer active:scale-95"
                          : "bg-gray-950/40 border-gray-800 text-gray-600"
                      }`}
                    >
                      <div className="text-[10px] text-gray-400">SIDE B</div>
                      <div className="text-sm font-bold truncate mt-0.5">
                        {m.playerB ? m.playerB.name : "待機中..."}
                      </div>
                      {isReady && (
                        <div className="text-[10px] text-amber-400 font-bold mt-1">
                          タップで勝利 ➔
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
