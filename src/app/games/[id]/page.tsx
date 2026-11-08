"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGameById } from "@/lib/supabase";
import { Game, Player } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
import SessionScoreHeader from "@/components/session/SessionScoreHeader";
import PlayerRegistrationModal from "@/components/players/PlayerRegistrationModal";
import {
  loadStoredPlayers,
  saveStoredPlayers,
  generateDefaultPlayers,
} from "@/lib/playerStorage";
import {
  Users,
  Play,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Activity,
  Clock,
  Shuffle,
  Trophy,
  Tag,
  UserCog,
  Skull,
} from "lucide-react";

export default function GameDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const initialGame = ALL_GAMES.find((g) => g.id === id) || null;
  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState<boolean>(!initialGame);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

  const [players, setPlayers] = useState<Player[]>(() => {
    return loadStoredPlayers(initialGame?.min_players || 3);
  });

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      try {
        const data = await getGameById(id);
        if (isMounted) {
          if (data) {
            setGame(data);
            const minP = data.min_players || 2;
            const current = loadStoredPlayers(minP);
            if (current.length < minP) {
              const adjusted = generateDefaultPlayers(minP);
              setPlayers(adjusted);
              saveStoredPlayers(adjusted);
            } else {
              setPlayers(current);
            }
          }
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2B2D42] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black">ゲームを読み込み中...</p>
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
          <p className="text-xs font-bold text-[#2B2D42]/75 mb-4">
            指定されたゲームが存在しないか、削除された可能性があります。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFE066] border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-black shadow-[2px_3px_0_#2B2D42]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップページへ戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  const meta = game.metadata;
  const tools = meta?.tools || [];

  return (
    <div
      className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex flex-col justify-between relative"
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

      {/* 通算成績スコアバー */}
      <SessionScoreHeader />

      <main className="relative z-10 p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="max-w-xl w-full mx-auto flex-1 flex flex-col py-2">
          {/* ナビゲーションバー */}
          <div className="flex items-center justify-between gap-2 mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-[#2B2D42] text-xs font-black transition-all border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ホームへ戻る</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 text-xs text-[#2B2D42] font-black bg-[#7CE8DC] px-3 py-1.5 rounded-xl border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42]">
              <Users className="w-3.5 h-3.5" />
              <span>
                {game.min_players}〜{game.max_players}人対応
              </span>
            </span>
          </div>

          {/* メイン詳細カード */}
          <div className="bg-white border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-7 shadow-[5px_6px_0_#2B2D42] space-y-5">
            <div>
              {meta?.tags && meta.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {meta.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF6EB] border border-[#2B2D42] text-[#2B2D42] text-[11px] font-black"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative inline-block">
                <span
                  className="absolute bottom-0.5 inset-x-0 h-3 bg-[#FFF275] -rotate-1 rounded-xs -z-10"
                  aria-hidden="true"
                />
                <h1 className="text-2xl sm:text-3xl font-black text-[#2B2D42] tracking-wide">
                  {game.title}
                </h1>
              </div>
              <p className="text-[#2B2D42]/85 font-bold text-xs sm:text-sm mt-2 leading-relaxed whitespace-pre-wrap">
                {game.description}
              </p>
            </div>

            {/* 参加プレイヤー設定セクション */}
            <div className="p-4 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#2B2D42]">
                  <Users className="w-4 h-4" />
                  <span>参加プレイヤー（{players.length}名）</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(true)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 text-[#2B2D42] border-2 border-[#2B2D42] font-black flex items-center gap-1 shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
                >
                  <UserCog className="w-3 h-3" />
                  <span>名前を登録・変更</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {players.map((p, idx) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-[#2B2D42] text-xs font-black border-2 border-[#2B2D42]"
                  >
                    <span className="w-4 h-4 rounded-md bg-[#FFE066] border border-[#2B2D42] text-[10px] flex items-center justify-center font-black">
                      {idx + 1}
                    </span>
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <PlayerRegistrationModal
              isOpen={showPlayerModal}
              onClose={() => setShowPlayerModal(false)}
              initialPlayers={players}
              onSave={handleSavePlayers}
              minPlayers={game.min_players || 2}
              maxPlayers={game.max_players || 8}
              gameTitle={game.title}
            />

            {/* 「このゲームを開始する」CTAボタン */}
            <Link
              href={`/games/${game.id}/play?count=${players.length}`}
              className="w-full py-4 px-6 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>このメンバーで開始する！</span>
            </Link>

            {/* 付属ゲームマスターツール一覧バッジ */}
            {tools.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42]">
                <span className="text-xs font-black text-[#2B2D42] flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>使用可能なゲームマスターツール</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {tools.includes("prompt") && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F9B8E0] border-2 border-[#2B2D42] text-[#2B2D42]">
                      <Shuffle className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-black">お題ガチャ</div>
                        <div className="text-[10px] font-bold opacity-80">
                          豊富なプリセット題
                        </div>
                      </div>
                    </div>
                  )}
                  {tools.includes("bpm") && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#CBC8FA] border-2 border-[#2B2D42] text-[#2B2D42]">
                      <Activity className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-black">BPMメトロノーム</div>
                        <div className="text-[10px] font-bold opacity-80">
                          初期BPM: {meta?.defaultBpm || 110}
                        </div>
                      </div>
                    </div>
                  )}
                  {tools.includes("timer") && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#7CE8DC] border-2 border-[#2B2D42] text-[#2B2D42]">
                      <Clock className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-black">タイマー</div>
                        <div className="text-[10px] font-bold opacity-80">
                          {meta?.blindTimer
                            ? "ブラインド判定"
                            : `${meta?.timerDuration || 15}秒計測`}
                        </div>
                      </div>
                    </div>
                  )}
                  {tools.includes("score") && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#9AF0A8] border-2 border-[#2B2D42] text-[#2B2D42]">
                      <Trophy className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-black">脱落・勝敗カウンター</div>
                        <div className="text-[10px] font-bold opacity-80">
                          勝者判定＆サバイバル
                        </div>
                      </div>
                    </div>
                  )}
                  {(tools.includes("elimination") ||
                    tools.includes("elimination_tracker")) &&
                    !tools.includes("score") && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFADAD] border-2 border-[#2B2D42] text-[#2B2D42]">
                        <Skull className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="font-black">脱落トラッカー</div>
                          <div className="text-[10px] font-bold opacity-80">
                            サバイバル脱落判定
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* かけ声・コール例 */}
            {meta?.callExample && (
              <div className="p-4 rounded-2xl bg-[#FFF275]/45 border-2 border-[#2B2D42]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#2B2D42] mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>かけ声・コールの流れ</span>
                </div>
                <pre className="text-xs sm:text-sm font-bold text-[#2B2D42] font-sans whitespace-pre-wrap leading-relaxed">
                  {meta.callExample}
                </pre>
              </div>
            )}

            {/* 詳しいルールステップ */}
            {meta?.ruleSummary && meta.ruleSummary.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FAF6EB] border-2 border-[#2B2D42]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#2B2D42] mb-2.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>あそび方の流れ・ルール</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm font-bold text-[#2B2D42]">
                  {meta.ruleSummary.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2B2D42] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
