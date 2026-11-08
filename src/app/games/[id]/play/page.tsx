"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getGameById } from "@/lib/supabase";
import { Game, Player } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import { useGameSession } from "@/hooks/useGameSession";
import StepByStepGameFlow from "@/components/match/StepByStepGameFlow";
import MatchWinnerModal from "@/components/match/MatchWinnerModal";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";
import {
  loadStoredPlayers,
  saveStoredPlayers,
  syncPlayersWithCount,
} from "@/lib/playerStorage";
import { sound } from "@/lib/sound";
import { ArrowLeft } from "lucide-react";

function GamePlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const countParam = searchParams?.get("count");
  const targetCount = countParam ? parseInt(countParam, 10) : null;

  const { players: sessionPlayers, setPlayerCount } = useGameSession();

  const initialGame = ALL_GAMES.find((g) => g.id === id) || null;
  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState<boolean>(!initialGame);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

  const [winner, setWinner] = useState<{ id: string; name: string } | null>(
    null
  );

  const [players, setPlayers] = useState<Player[]>(() => {
    const minP = initialGame?.min_players || 2;
    const maxP = initialGame?.max_players || 8;
    const defaultCount = targetCount || Math.max(3, minP);
    const current = loadStoredPlayers(defaultCount);
    return syncPlayersWithCount(
      current,
      Math.min(maxP, Math.max(minP, defaultCount)),
      minP,
      maxP,
      false
    );
  });

  useEffect(() => {
    if (sessionPlayers.length > 0 && players.length === sessionPlayers.length) {
      setPlayers((prev) =>
        prev.map((p, idx) => {
          const sessionP = sessionPlayers[idx];
          if (sessionP && sessionP.name !== p.name) {
            return { ...p, name: sessionP.name };
          }
          return p;
        })
      );
    }
  }, [sessionPlayers, players.length]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      try {
        const data = await getGameById(id);
        if (isMounted) {
          setGame(data);
          setLoading(false);

          const minP = data?.min_players || 2;
          const maxP = data?.max_players || 8;
          const current = loadStoredPlayers(Math.max(3, minP));
          let adjusted: Player[];

          if (targetCount && !isNaN(targetCount)) {
            adjusted = syncPlayersWithCount(
              current,
              targetCount,
              minP,
              maxP,
              false
            );
          } else if (current.length < minP) {
            adjusted = syncPlayersWithCount(current, minP, minP, maxP, false);
          } else if (current.length > maxP) {
            adjusted = syncPlayersWithCount(current, maxP, minP, maxP, false);
          } else {
            adjusted = current;
          }

          setPlayers(adjusted);
          saveStoredPlayers(adjusted);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, targetCount]);

  const handleToggleEliminate = (playerId: string) => {
    sound.playClick();
    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, isOut: !p.isOut } : p
      );
      saveStoredPlayers(updated);

      const alive = updated.filter((p) => !p.isOut);
      if (updated.length >= 2 && alive.length === 1) {
        sound.playWin();
        setWinner({ id: alive[0].id, name: alive[0].name });
      }
      return updated;
    });
  };

  const handleResetElimination = () => {
    setPlayers((prev) => {
      const updated = prev.map((p) => ({ ...p, isOut: false }));
      saveStoredPlayers(updated);
      return updated;
    });
    setWinner(null);
  };

  const handleSelectWinner = (playerId: string, playerName: string) => {
    sound.playWin();
    setWinner({ id: playerId, name: playerName });
  };

  const handleRematch = () => {
    sound.playRevive();
    handleResetElimination();
  };

  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
    setShowPlayerModal(false);
    setPlayerCount(newPlayers.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2B2D42] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black">ゲームを起動中...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white border-2 border-[#2B2D42] rounded-3xl p-6 shadow-[4px_5px_0_#2B2D42]">
          <h2 className="text-xl font-black text-rose-600 mb-2">
            ゲームが見つかりません
          </h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-sm font-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップへ戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-[#FAF6EB] text-[#2B2D42] flex flex-col relative px-4 py-2"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 大学ノートの左端：赤い縦マージン2本線 */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      <main className="relative z-10 flex-1 w-full">
        <StepByStepGameFlow
          game={game}
          players={players}
          onOpenPlayerModal={() => setShowPlayerModal(true)}
          onToggleEliminate={handleToggleEliminate}
          onResetElimination={handleResetElimination}
          onSelectWinner={handleSelectWinner}
          onBackToHome={() => router.push("/")}
        />

        {/* プレイヤー人数・名前設定モーダル（⚙️ボタンから開く） */}
        <PlayerRegistrationModal
          isOpen={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
          initialPlayers={players}
          onSave={handleSavePlayers}
          minPlayers={game.min_players || 2}
          maxPlayers={game.max_players || 8}
          gameTitle={game.title}
          isInitialSetup={false}
        />

        {/* 勝者発表モーダル */}
        <MatchWinnerModal
          winnerId={winner?.id || ""}
          winnerName={winner?.name || ""}
          isOpen={!!winner}
          onRematch={handleRematch}
        />
      </main>
    </div>
  );
}

export default function GamePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#2B2D42] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black">ゲームを起動中...</p>
          </div>
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}
