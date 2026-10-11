"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getGameById } from "@/lib/supabase";
import { Game, Player } from "@/types/game";
import { ALL_GAMES } from "@/data/games";
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
  const router = useRouter();
  const id = params?.id as string;

  const initialGame = ALL_GAMES.find((g) => g.id === id) || null;
  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState<boolean>(!initialGame);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

  // プレイヤー管理
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
            // ゲームの推奨人数に合わせて調整
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">ゲームを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-rose-400 mb-2">ゲームが見つかりません</h2>
          <p className="text-sm text-slate-400 mb-4">
            指定されたゲームが存在しないか、削除された可能性があります。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col py-4">
        {/* ナビゲーションバー */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs sm:text-sm font-semibold transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ホームへ戻る</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs text-purple-200 font-semibold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>{game.min_players}〜{game.max_players}人対応</span>
          </span>
        </div>

        {/* メイン詳細カード */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* タイトルとタグ */}
          <div>
            {meta?.tags && meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[11px] font-semibold"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {game.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed whitespace-pre-wrap">
              {game.description}
            </p>
          </div>

          {/* 参加プレイヤー設定セクション */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
                <Users className="w-4 h-4 text-pink-400" />
                <span>参加プレイヤー（{players.length}名）</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPlayerModal(true)}
                className="text-xs px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 font-semibold flex items-center gap-1 transition-all active:scale-95"
              >
                <UserCog className="w-3 h-3 text-pink-300" />
                <span>名前を登録・変更</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {players.map((p, idx) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10"
                >
                  <span className="w-4 h-4 rounded-md bg-gradient-to-r from-pink-500 to-indigo-500 text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span>{p.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* プレイヤー登録モーダル */}
          <PlayerRegistrationModal
            isOpen={showPlayerModal}
            onClose={() => setShowPlayerModal(false)}
            initialPlayers={players}
            onSave={handleSavePlayers}
            minPlayers={game.min_players || 2}
            maxPlayers={game.max_players || 8}
            gameTitle={game.title}
          />

          {/* 超目立つ「このゲームを開始する」CTAボタン */}
          <Link
            href={`/games/${game.id}/play?count=${players.length}`}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:via-orange-400 hover:to-pink-400 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all ring-2 ring-amber-300/50"
          >
            <Play className="w-6 h-6 fill-current text-slate-950" />
            <span>このメンバーで開始する！</span>
          </Link>

          {/* 付属ゲームマスターツール一覧バッジ */}
          {tools.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/10">
              <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>使用可能なゲームマスターツール</span>
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {tools.includes("prompt") && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-500/15 border border-pink-400/20 text-pink-200">
                    <Shuffle className="w-4 h-4 text-pink-400" />
                    <div>
                      <div className="font-bold">お題ガチャ</div>
                      <div className="text-[10px] text-pink-300/80">豊富なプリセット題</div>
                    </div>
                  </div>
                )}
                {tools.includes("bpm") && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/15 border border-amber-400/20 text-amber-200">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold">BPMメトロノーム</div>
                      <div className="text-[10px] text-amber-300/80">初期BPM: {meta?.defaultBpm || 110}</div>
                    </div>
                  </div>
                )}
                {tools.includes("timer") && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-200">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">タイマー</div>
                      <div className="text-[10px] text-cyan-300/80">
                        {meta?.blindTimer ? "ブラインド判定" : `${meta?.timerDuration || 15}秒計測`}
                      </div>
                    </div>
                  </div>
                )}
                {tools.includes("score") && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold">脱落・勝敗カウンター</div>
                      <div className="text-[10px] text-emerald-300/80">勝者判定＆サバイバル脱落</div>
                    </div>
                  </div>
                )}
                {(tools.includes("elimination") || tools.includes("elimination_tracker")) && !tools.includes("score") && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/15 border border-rose-400/20 text-rose-200">
                    <Skull className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="font-bold">脱落トラッカー</div>
                      <div className="text-[10px] text-rose-300/80">サバイバル脱落判定</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* かけ声・コール例 */}
          {meta?.callExample && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>かけ声・コールの流れ</span>
              </div>
              <pre className="text-xs sm:text-sm text-indigo-100 font-sans whitespace-pre-wrap leading-relaxed">
                {meta.callExample}
              </pre>
            </div>
          )}

          {/* 詳しいルールステップ */}
          {meta?.ruleSummary && meta.ruleSummary.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2.5">
                <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
                <span>あそび方の流れ・ルール</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {meta.ruleSummary.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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

      <footer className="text-center text-[11px] text-slate-500 py-3">
        マチジカン！ - ゲームマスター
      </footer>
    </main>
  );
}
