"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  MatchMode,
  MatchSessionConfig,
  MatchProgressState,
  MatchPlayer,
} from "@/types/matchMode";
import { ALL_GAMES } from "@/data/games";
import { getAllGamesWithCustom } from "@/lib/customGames";

const ACTIVE_MATCH_STORAGE_KEY = "machajikan_active_match_v1";

interface ActiveMatchContextType {
  config: MatchSessionConfig | null;
  state: MatchProgressState | null;
  startMatch: (newConfig: MatchSessionConfig) => void;
  spinNextGame: () => void;
  rerollGame: () => void;
  recordRoundWinner: (winnerId: string) => void;
  recordRoundEliminated: (eliminatedId: string) => void;
  rematch: () => void;
  clearMatch: () => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

const ActiveMatchContext = createContext<ActiveMatchContextType | undefined>(undefined);

// 条件に合うゲームをプールからランダム抽選するヘルパー
function pickRandomGame(
  playerCount: number,
  excludedIds: string[],
  previousGameId?: string
): string {
  const allAvailableGames = getAllGamesWithCustom();

  // 人数に適合し、除外リストに入っていないゲームを抽出
  const pool = allAvailableGames.filter((g) => {
    if (excludedIds.includes(g.id)) return false;
    return g.min_players <= playerCount && g.max_players >= playerCount;
  });

  if (pool.length === 0) {
    // もし全部除外されていた場合の安全フォールバック（人数に合う最初のゲーム）
    const fallback = allAvailableGames.find((g) => g.min_players <= playerCount && g.max_players >= playerCount);
    return fallback ? fallback.id : allAvailableGames[0]?.id || ALL_GAMES[0].id;
  }

  // 直前のゲームとできるだけ被らないように抽選
  const candidate = pool.length > 1 && previousGameId ? pool.filter((g) => g.id !== previousGameId) : pool;
  const picked = candidate[Math.floor(Math.random() * candidate.length)];
  return picked.id;
}

export function ActiveMatchProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MatchSessionConfig | null>(null);
  const [state, setState] = useState<MatchProgressState | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 初回マウント時にlocalStorageから復帰
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(ACTIVE_MATCH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config && parsed.state) {
          setConfig(parsed.config);
          setState(parsed.state);
        }
      }
    } catch (e) {
      console.error("Failed to load active match:", e);
    }
    setIsInitialized(true);
  }, []);

  // 状態変更時にlocalStorageへ永続化
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    try {
      if (config && state) {
        localStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify({ config, state }));
      } else {
        localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save active match:", e);
    }
  }, [config, state, isInitialized]);

  // 新規対戦の開始
  const startMatch = useCallback((newConfig: MatchSessionConfig) => {
    const playerCount = newConfig.players.length;
    const firstGameId = pickRandomGame(playerCount, newConfig.excludedGameIds);

    const initialScores: Record<string, number> = {};
    newConfig.players.forEach((p) => {
      initialScores[p.id] = 0;
    });

    const initialState: MatchProgressState = {
      currentRound: 1,
      currentGameId: firstGameId,
      isRouletteSpinning: true,
      playerScores: initialScores,
      eliminatedPlayerIds: [],
      escapedPlayerIds: [],
      isMatchFinished: false,
    };

    setConfig(newConfig);
    setState(initialState);
    setIsSpinning(true);
  }, []);

  // 次のゲームをスロット抽選
  const spinNextGame = useCallback(() => {
    if (!config || !state) return;
    const playerCount = config.players.length;
    const nextGameId = pickRandomGame(playerCount, config.excludedGameIds, state.currentGameId);

    setIsSpinning(true);
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        currentGameId: nextGameId,
        isRouletteSpinning: true,
      };
    });
  }, [config, state]);

  // 現在のゲームを再抽選（リロール）
  const rerollGame = useCallback(() => {
    if (!config || !state) return;
    const currentParticipantCount =
      config.mode === "duel_1v1"
        ? 2
        : config.multiRuleType === "survival_knockout"
        ? config.players.length - state.eliminatedPlayerIds.length
        : config.multiRuleType === "loser_king"
        ? config.players.length - state.escapedPlayerIds.length
        : state.isSuddenDeath && state.suddenDeathPlayerIds
        ? state.suddenDeathPlayerIds.length
        : config.players.length;

    const nextGameId = pickRandomGame(
      currentParticipantCount,
      config.excludedGameIds,
      state.currentGameId
    );
    setIsSpinning(true);
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentGameId: nextGameId,
        isRouletteSpinning: true,
      };
    });
  }, [config, state]);

  // ラウンド勝者を記録
  const recordRoundWinner = useCallback((winnerId: string) => {
    if (!config || !state) return;

    setState((prev) => {
      if (!prev) return null;

      const newScores = {
        ...prev.playerScores,
        [winnerId]: (prev.playerScores[winnerId] || 0) + 1,
      };

      const winnerPlayer = config.players.find((p) => p.id === winnerId);

      // 【1vs1 モードの場合】
      if (config.mode === "duel_1v1") {
        const targetWins = config.duelRule === "first_to_5" ? 5 : 3;
        const reached = newScores[winnerId] >= targetWins;

        if (reached) {
          return {
            ...prev,
            playerScores: newScores,
            winnerPlayer,
            isMatchFinished: true,
          };
        }

        // 次のゲームを抽選
        const nextGameId = pickRandomGame(2, config.excludedGameIds, prev.currentGameId);
        setIsSpinning(true);
        return {
          ...prev,
          currentRound: prev.currentRound + 1,
          currentGameId: nextGameId,
          playerScores: newScores,
          isRouletteSpinning: true,
        };
      }

      // 【多人数 モードの場合】
      if (config.mode === "party_multi") {
        // ① 点数制
        if (config.multiRuleType === "point_race") {
          // すでに同点サドンデス中の場合は、このラウンドの勝者が即座に総合優勝！
          if (prev.isSuddenDeath) {
            return {
              ...prev,
              playerScores: newScores,
              winnerPlayer,
              isMatchFinished: true,
            };
          }

          const goal = config.pointRaceGoal || "rounds_5";

          if (goal === "points_3") {
            if (newScores[winnerId] >= 3) {
              return {
                ...prev,
                playerScores: newScores,
                winnerPlayer,
                isMatchFinished: true,
              };
            }
          } else {
            const maxRounds = goal === "rounds_3" ? 3 : 5;
            if (prev.currentRound >= maxRounds) {
              // 最高得点を算出
              let maxScore = -1;
              config.players.forEach((p) => {
                const s = newScores[p.id] || 0;
                if (s > maxScore) maxScore = s;
              });

              // 最高得点者のリスト
              const topPlayers = config.players.filter(
                (p) => (newScores[p.id] || 0) === maxScore
              );

              // 同点者が複数人いる場合は【同点サドンデス延長戦】へ！
              if (topPlayers.length > 1) {
                const suddenGameId = pickRandomGame(
                  topPlayers.length,
                  config.excludedGameIds,
                  prev.currentGameId
                );
                setIsSpinning(true);
                return {
                  ...prev,
                  currentRound: prev.currentRound + 1,
                  currentGameId: suddenGameId,
                  playerScores: newScores,
                  isSuddenDeath: true,
                  suddenDeathPlayerIds: topPlayers.map((p) => p.id),
                  isRouletteSpinning: true,
                };
              }

              // 単独トップで完全優勝！
              return {
                ...prev,
                playerScores: newScores,
                winnerPlayer: topPlayers[0],
                isMatchFinished: true,
              };
            }
          }

          // 次のラウンドへ
          const nextGameId = pickRandomGame(
            config.players.length,
            config.excludedGameIds,
            prev.currentGameId
          );
          setIsSpinning(true);
          return {
            ...prev,
            currentRound: prev.currentRound + 1,
            currentGameId: nextGameId,
            playerScores: newScores,
            isRouletteSpinning: true,
          };
        }

        // ③ 負け残り制（最弱王決定戦）
        if (config.multiRuleType === "loser_king") {
          const newEscaped = Array.from(new Set([...prev.escapedPlayerIds, winnerId]));
          const remainingPlayers = config.players.filter((p) => !newEscaped.includes(p.id));

          // 残り1名になったら、その人が「最弱王」に決定！
          if (remainingPlayers.length === 1) {
            return {
              ...prev,
              escapedPlayerIds: newEscaped,
              loserPlayer: remainingPlayers[0],
              isMatchFinished: true,
            };
          }

          // 残りメンバーで次戦へ
          const nextGameId = pickRandomGame(remainingPlayers.length, config.excludedGameIds, prev.currentGameId);
          setIsSpinning(true);
          return {
            ...prev,
            currentRound: prev.currentRound + 1,
            currentGameId: nextGameId,
            escapedPlayerIds: newEscaped,
            isRouletteSpinning: true,
          };
        }
      }

      return prev;
    });
  }, [config, state]);

  // ラウンド敗者（脱落者）を記録（多人数 勝ち残り制用）
  const recordRoundEliminated = useCallback((eliminatedId: string) => {
    if (!config || !state) return;

    setState((prev) => {
      if (!prev) return null;

      const newEliminated = Array.from(new Set([...prev.eliminatedPlayerIds, eliminatedId]));
      const alivePlayers = config.players.filter((p) => !newEliminated.includes(p.id));

      // 残り1名になったら、その人が「総合優勝」！
      if (alivePlayers.length === 1) {
        return {
          ...prev,
          eliminatedPlayerIds: newEliminated,
          winnerPlayer: alivePlayers[0],
          isMatchFinished: true,
        };
      }

      // 次のラウンドへ（生存人数に適合するゲームを抽選）
      const nextGameId = pickRandomGame(alivePlayers.length, config.excludedGameIds, prev.currentGameId);
      setIsSpinning(true);
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        currentGameId: nextGameId,
        eliminatedPlayerIds: newEliminated,
        isRouletteSpinning: true,
      };
    });
  }, [config, state]);

  // 同じ設定で再戦（リベンジ）
  const rematch = useCallback(() => {
    if (!config) return;
    startMatch(config);
  }, [config, startMatch]);

  // 対戦終了・クリア
  const clearMatch = useCallback(() => {
    setConfig(null);
    setState(null);
    setIsSpinning(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    }
  }, []);

  return (
    <ActiveMatchContext.Provider
      value={{
        config,
        state,
        startMatch,
        spinNextGame,
        rerollGame,
        recordRoundWinner,
        recordRoundEliminated,
        rematch,
        clearMatch,
        isSpinning,
        setIsSpinning,
      }}
    >
      {children}
    </ActiveMatchContext.Provider>
  );
}

export function useActiveMatch() {
  const context = useContext(ActiveMatchContext);
  if (!context) {
    throw new Error("useActiveMatch must be used within an ActiveMatchProvider");
  }
  return context;
}
