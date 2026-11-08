"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Search,
  Edit2,
  Trash2,
  Play,
  Users,
  BookOpen,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { Game } from "@/types/game";
import { deleteCustomGame } from "@/lib/customGames";

interface GameCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGameList: Game[];
  onRefresh: () => void;
  onEditCustomGame: (game: Game) => void;
}

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

type DoodleType =
  | "katana"
  | "train"
  | "numbers"
  | "leaf"
  | "flame"
  | "lemon"
  | "stopwatch"
  | "music"
  | "cards"
  | "mic"
  | "hand"
  | "crown";

interface CardVisualTheme {
  markerColor: string;
  inkAccent: string;
  defaultDoodle: DoodleType;
}

// ノートの上で映える蛍光マーカー風パレット
const CARD_THEMES: CardVisualTheme[] = [
  { markerColor: "#7CE8DC", inkAccent: "#1D4E56", defaultDoodle: "katana" },
  { markerColor: "#E8F655", inkAccent: "#425214", defaultDoodle: "train" },
  { markerColor: "#CBC8FA", inkAccent: "#3B356E", defaultDoodle: "numbers" },
  { markerColor: "#9AF0A8", inkAccent: "#1F572D", defaultDoodle: "leaf" },
  { markerColor: "#FFADAD", inkAccent: "#6E2323", defaultDoodle: "flame" },
  { markerColor: "#FFF275", inkAccent: "#5C4D12", defaultDoodle: "lemon" },
  { markerColor: "#8ED8F8", inkAccent: "#1B4965", defaultDoodle: "stopwatch" },
  { markerColor: "#FFD194", inkAccent: "#663F14", defaultDoodle: "music" },
  { markerColor: "#F9B8E0", inkAccent: "#63224C", defaultDoodle: "cards" },
  { markerColor: "#B8E1FF", inkAccent: "#1E3F66", defaultDoodle: "mic" },
  { markerColor: "#D9F788", inkAccent: "#365314", defaultDoodle: "hand" },
  { markerColor: "#FCE073", inkAccent: "#5C4308", defaultDoodle: "cards" },
];

// ゲームのIDや特徴から最適な「ノートの落書き（Doodle）モチーフ」を選択
function resolveDoodleType(game: Game, fallback: DoodleType): DoodleType {
  if (game.isCustom) return "crown";
  const id = game.id.toLowerCase();
  const title = game.title;

  if (id.includes("samurai") || title.includes("侍")) return "katana";
  if (id.includes("ginton") || title.includes("ギントン")) return "train";
  if (id.includes("kazu") || title.includes("数") || title.includes("数字"))
    return "numbers";
  if (
    id.includes("spinach") ||
    title.includes("ほうれん草") ||
    title.includes("グリンピース") ||
    title.includes("たけのこ")
  )
    return "leaf";
  if (title.includes("カルビ") || title.includes("焼肉")) return "flame";
  if (title.includes("レモン")) return "lemon";
  if (
    game.metadata?.tools?.includes("timer") ||
    title.includes("秒") ||
    title.includes("時計")
  )
    return "stopwatch";
  if (game.metadata?.tools?.includes("bpm")) return "music";
  if (game.metadata?.tools?.includes("prompt")) return "mic";
  if (title.includes("指") || title.includes("じゃんけん")) return "hand";

  return fallback;
}

// ノートにボールペンで描いたような完全オリジナルの落書きスタンプSVG
function NotebookDoodle({
  type,
  inkColor = "#2B2D42",
}: {
  type: DoodleType;
  inkColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 56 56"
      className="w-12 h-12 sm:w-13 sm:h-13 overflow-visible opacity-90"
      fill="none"
      stroke={inkColor}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 侍の刀＆キラキラ */}
      {type === "katana" && (
        <g transform="rotate(-8 28 28)">
          <path d="M12 44 L42 14 C44 12 46 12 46 15 L18 43 Z" fill="#FFFFFF" />
          <line x1="15" y1="35" x2="23" y2="43" strokeWidth="3" />
          <path d="M9 47 L16 40" strokeWidth="3.2" />
          {/* 手描きキラキラ */}
          <path d="M22 14 L24 9 L26 14 L31 16 L26 18 L24 23 L22 18 L17 16 Z" />
        </g>
      )}

      {/* トレイン・リズム */}
      {type === "train" && (
        <g transform="rotate(-5 28 28)">
          <rect x="12" y="16" width="30" height="24" rx="5" fill="#FFFFFF" />
          <rect x="17" y="21" width="9" height="8" rx="1.5" />
          <rect x="29" y="21" width="9" height="8" rx="1.5" />
          <circle cx="19" cy="43" r="3.5" fill="#FFFFFF" />
          <circle cx="35" cy="43" r="3.5" fill="#FFFFFF" />
          <path d="M22 12 Q25 7 30 9 Q34 5 39 8" />
        </g>
      )}

      {/* 数字スタンプ (1・2・3) */}
      {type === "numbers" && (
        <g transform="rotate(-6 28 28)">
          <rect
            x="10"
            y="16"
            width="36"
            height="26"
            rx="6"
            fill="#FFFFFF"
            strokeDasharray="4 2.5"
          />
          <text
            x="28"
            y="35"
            textAnchor="middle"
            fill={inkColor}
            stroke="none"
            fontSize="16"
            fontWeight="900"
            fontFamily="monospace"
          >
            123!
          </text>
          <path d="M42 10 L45 6 M47 14 L51 12" />
        </g>
      )}

      {/* 双葉・リーフ */}
      {type === "leaf" && (
        <g transform="rotate(-6 28 28)">
          <path d="M28 45 L28 24" strokeWidth="2.5" />
          <path
            d="M28 30 C14 30 12 16 26 16 C28 16 28 24 28 30 Z"
            fill="#FFFFFF"
          />
          <path
            d="M28 26 C42 26 44 12 30 12 C28 12 28 20 28 26 Z"
            fill="#FFFFFF"
          />
          <path d="M21 23 L26 27 M35 19 L30 23" />
        </g>
      )}

      {/* メラメラ炎・熱戦 */}
      {type === "flame" && (
        <g transform="rotate(-4 28 28)">
          <path
            d="M28 10 C32 18 42 22 40 34 C39 42 33 46 26 46 C19 46 14 40 15 32 C16 26 21 24 21 19 C21 19 25 23 26 26 C25 19 26 14 28 10 Z"
            fill="#FFFFFF"
          />
          <path d="M27 32 C29 35 32 37 31 41 C30 44 25 44 24 41 C23 38 25 35 27 32 Z" />
        </g>
      )}

      {/* レモン＆稲妻 */}
      {type === "lemon" && (
        <g transform="rotate(-12 28 28)">
          <path
            d="M12 29 C14 17 26 13 38 19 C43 21 45 25 46 28 C44 39 32 43 20 37 C15 35 13 31 12 29 Z"
            fill="#FFFFFF"
          />
          <circle cx="24" cy="26" r="1" fill={inkColor} />
          <circle cx="30" cy="24" r="1" fill={inkColor} />
          <path d="M38 10 L33 17 L39 17 L34 24" strokeWidth="2.2" />
        </g>
      )}

      {/* ストップウォッチ・タイマー */}
      {type === "stopwatch" && (
        <g transform="rotate(-6 28 28)">
          <circle cx="28" cy="31" r="14" fill="#FFFFFF" />
          <line x1="24" y1="13" x2="32" y2="13" strokeWidth="2.8" />
          <line x1="28" y1="13" x2="28" y2="17" />
          <line x1="38" y1="17" x2="41" y2="14" />
          <polyline points="28,23 28,31 34,34" />
        </g>
      )}

      {/* 音符・リズムビート */}
      {type === "music" && (
        <g transform="rotate(-8 28 28)">
          <path d="M21 38 L21 17 L41 13 L41 34" />
          <ellipse cx="17" cy="39" rx="4.5" ry="3.5" fill="#FFFFFF" />
          <ellipse cx="37" cy="35" rx="4.5" ry="3.5" fill="#FFFFFF" />
          <line x1="21" y1="22" x2="41" y2="18" />
        </g>
      )}

      {/* トランプ・お題カード */}
      {type === "cards" && (
        <g transform="rotate(-6 28 28)">
          <rect
            x="14"
            y="16"
            width="20"
            height="28"
            rx="3"
            transform="rotate(-10 24 30)"
            fill="#FFFFFF"
          />
          <rect
            x="22"
            y="15"
            width="20"
            height="28"
            rx="3"
            transform="rotate(8 32 29)"
            fill="#FFFFFF"
          />
          <polygon
            points="32,23 36,29 32,35 28,29"
            fill={inkColor}
            stroke="none"
          />
        </g>
      )}

      {/* マイク・コール */}
      {type === "mic" && (
        <g transform="rotate(12 28 28)">
          <rect x="22" y="12" width="12" height="18" rx="6" fill="#FFFFFF" />
          <line x1="22" y1="21" x2="34" y2="21" />
          <path d="M18 24 C18 31 22 35 28 35 C34 35 38 31 38 24" />
          <line x1="28" y1="35" x2="28" y2="43" />
          <line x1="22" y1="43" x2="34" y2="43" />
        </g>
      )}

      {/* ピース・ハンドサイン */}
      {type === "hand" && (
        <g transform="rotate(-6 28 28)">
          <path
            d="M22 28 L19 14 C18.5 11.5 22 11 23 13.5 L26 25 L29 13 C30 10.5 33.5 11.5 33 14 L30 26 L34 26 C37 26 38 29 37 32 L35 40 C34 43 30 45 25 45 C20 45 17 41 17 36 L17 30 C17 28 19.5 27 22 28 Z"
            fill="#FFFFFF"
          />
        </g>
      )}

      {/* 王冠スタンプ（自作ゲーム用） */}
      {type === "crown" && (
        <g transform="rotate(-6 28 28)">
          <polygon
            points="12,38 15,20 23,28 28,16 33,28 41,20 44,38"
            fill="#FFFFFF"
          />
          <line x1="13" y1="42" x2="43" y2="42" />
          <circle cx="15" cy="16" r="1.8" fill={inkColor} />
          <circle cx="28" cy="12" r="1.8" fill={inkColor} />
          <circle cx="41" cy="16" r="1.8" fill={inkColor} />
        </g>
      )}
    </svg>
  );
}

export default function GameCatalogModal({
  isOpen,
  onClose,
  allGameList,
  onRefresh,
  onEditCustomGame,
}: GameCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [playerFilter, setPlayerFilter] = useState<number | null>(null);
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const filteredGames = useMemo(() => {
    return allGameList.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchTags = g.metadata?.tags?.some((t) =>
          t.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchTags) return false;
      }
      if (playerFilter !== null) {
        if (g.min_players > playerFilter || g.max_players < playerFilter) {
          return false;
        }
      }
      return true;
    });
  }, [allGameList, searchQuery, playerFilter]);

  const handleDelete = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    if (confirm(`「${game.title}」を削除してもよろしいですか？`)) {
      deleteCustomGame(game.id);
      setSelectedGame(null);
      onRefresh();
    }
  };

  if (!isOpen) return null;

  const hasActiveFilter = searchQuery.trim() !== "" || playerFilter !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ゲーム一覧"
      className="fixed inset-0 z-50 bg-[#FAF6EB] text-[#2B2D42] flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
      style={{
        // 大学ノートの横罫線（28px間隔の淡いブルー罫線）
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(116, 162, 209, 0.32) 27px, rgba(116, 162, 209, 0.32) 28px)",
        backgroundPosition: "0 16px",
      }}
    >
      {/* 大学ノートの左端：赤い縦マージン2本線（スマホ〜PC対応） */}
      <div
        className="pointer-events-none fixed inset-y-0 left-4 sm:left-10 w-1 border-l-2 border-r border-rose-400/45 z-0"
        aria-hidden="true"
      />

      {/* メイン中央カラム */}
      <div className="relative z-10 w-full max-w-md mx-auto h-full flex flex-col">
        {/* 最上部：リングノートのスパイラル金具＆パンチ穴あしらい */}
        <div
          className="px-6 pt-2 pb-1 flex items-center justify-between pointer-events-none shrink-0"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-2 h-3.5 -mt-2 rounded-full border-2 border-[#2B2D42]/70 bg-[#E2DDD0]" />
              <div className="w-3.5 h-3.5 -mt-1 rounded-full bg-[#DBD5C5] border border-[#2B2D42]/30 shadow-inner" />
            </div>
          ))}
        </div>

        {/* ノート見出しヘッダー（左：ホーム、中央：ノートタイトル、右：検索・人数フィルター開閉） */}
        <header className="px-4 pt-2 pb-3 flex items-center justify-between border-b-2 border-[#2B2D42] bg-[#FAF6EB]/90 backdrop-blur-xs shrink-0">
          {/* 左：ホームへ戻るボタン */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center text-[#2B2D42] hover:bg-amber-50 transition-all cursor-pointer"
            aria-label="ホームへ戻る"
            title="ホームへ戻る"
          >
            <svg
              viewBox="0 0 28 28"
              className="w-6 h-6 fill-current"
              aria-hidden="true"
            >
              <path d="M14 3.5 L3 13.5 L6.5 13.5 L6.5 23.5 C6.5 24.1 7 24.5 7.5 24.5 L11.8 24.5 L11.8 17.5 L16.2 17.5 L16.2 24.5 L20.5 24.5 C21 24.5 21.5 24.1 21.5 23.5 L21.5 13.5 L25 13.5 Z" />
            </svg>
          </button>

          {/* 中央：大学ノート見出し風タイトル */}
          <div className="flex flex-col items-center">
            <div className="relative px-2">
              {/* 蛍光ペン風のアンダーライン */}
              <span
                className="absolute bottom-0.5 inset-x-0 h-3 bg-[#FFF275] -rotate-1 rounded-xs -z-10"
                aria-hidden="true"
              />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#2B2D42]">
                ゲーム一覧
              </h2>
            </div>
          </div>

          {/* 右：検索・人数フィルター開閉ボタン */}
          <button
            type="button"
            onClick={() => setShowFilterBar((prev) => !prev)}
            className={`relative w-10 h-10 rounded-xl border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_1px_0_#2B2D42] flex items-center justify-center transition-all cursor-pointer ${
              showFilterBar || hasActiveFilter
                ? "bg-[#FFF275] text-[#2B2D42]"
                : "bg-white text-[#2B2D42] hover:bg-amber-50"
            }`}
            aria-label="検索・人数絞り込み"
            title="検索・人数絞り込み"
          >
            <Search className="w-5 h-5 stroke-[2.6]" />
            {hasActiveFilter && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-[#2B2D42]" />
            )}
          </button>
        </header>

        {/* 開閉式：検索＆人数フィルターバー */}
        {showFilterBar && (
          <div className="px-4 pt-3 pb-1 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="bg-white rounded-2xl p-3 border-2 border-[#2B2D42] shadow-[3px_4px_0_#2B2D42] space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#2B2D42]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ゲーム名、タグで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF6EB] border-2 border-[#2B2D42]/25 text-xs font-bold text-[#2B2D42] placeholder-[#2B2D42]/45 focus:outline-none focus:border-[#2B2D42]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2B2D42]/50 hover:text-[#2B2D42]"
                    aria-label="検索クリア"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-0.5">
                <span className="text-[#2B2D42] font-extrabold shrink-0 pr-0.5 text-xs">
                  人数:
                </span>
                <button
                  type="button"
                  onClick={() => setPlayerFilter(null)}
                  className={`px-2.5 py-1 rounded-lg font-extrabold shrink-0 border border-[#2B2D42] transition-all cursor-pointer ${
                    playerFilter === null
                      ? "bg-[#2B2D42] text-white"
                      : "bg-[#FAF6EB] text-[#2B2D42] hover:bg-[#FFF275]/60"
                  }`}
                >
                  すべて
                </button>
                {PLAYER_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setPlayerFilter(playerFilter === p ? null : p)
                    }
                    className={`px-2.5 py-1 rounded-lg font-extrabold shrink-0 border border-[#2B2D42] transition-all cursor-pointer ${
                      playerFilter === p
                        ? "bg-[#2B2D42] text-white"
                        : "bg-[#FAF6EB] text-[#2B2D42] hover:bg-[#FFF275]/60"
                    }`}
                  >
                    {p}人
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2列カード一覧（白ベース＋インク枠＋斜め蛍光マーカー＋落書きスタンプ） */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-4">
            {filteredGames.map((game, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const doodleType = resolveDoodleType(game, theme.defaultDoodle);

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedGame(game)}
                  className="group relative h-[80px] sm:h-[86px] w-full rounded-2xl bg-white border-2 border-[#2B2D42] overflow-hidden text-left flex items-center pl-3.5 pr-12 shadow-[3px_4px_0_#2B2D42] hover:-translate-y-0.5 hover:shadow-[4px_5px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all cursor-pointer"
                >
                  {/* 右側の斜め蛍光マーカーカラー */}
                  <div
                    className="absolute inset-y-0 right-0 w-[52%] pointer-events-none transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: game.isCustom
                        ? "#FFE066"
                        : theme.markerColor,
                      clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0% 100%)",
                    }}
                  />

                  {/* 自作ゲームの★ワンポイントタグ */}
                  {game.isCustom && (
                    <span className="absolute top-1.5 left-3 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#FFE066] border border-[#2B2D42] text-[9px] font-black text-[#2B2D42] z-10">
                      ★自作
                    </span>
                  )}

                  {/* 左側：ゲームタイトル（濃紺インク太字） */}
                  <span
                    className={`relative z-10 font-black text-[#2B2D42] text-[13.5px] sm:text-[15px] leading-snug tracking-tight line-clamp-2 ${
                      game.isCustom ? "mt-2.5" : ""
                    }`}
                  >
                    {game.title}
                  </span>

                  {/* 右下：ノートの落書き風オリジナルアイコン */}
                  <div className="absolute bottom-0.5 right-1 z-10 pointer-events-none transition-transform duration-200 group-hover:rotate-6 group-hover:scale-105">
                    <NotebookDoodle
                      type={doodleType}
                      inkColor={game.isCustom ? "#2B2D42" : theme.inkAccent}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {filteredGames.length === 0 && (
            <div className="mt-12 p-8 rounded-2xl bg-white border-2 border-[#2B2D42] text-center text-[#2B2D42] font-bold shadow-[4px_5px_0_#2B2D42]">
              <p className="text-sm">該当するゲームが見つかりませんでした。</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPlayerFilter(null);
                }}
                className="mt-3 px-4 py-1.5 rounded-xl bg-[#2B2D42] text-white text-xs font-extrabold cursor-pointer"
              >
                フィルターをリセット
              </button>
            </div>
          )}
        </div>
      </div>

      {/* カードタップ時の詳細ポップアップ（ノートの切り抜きカード風） */}
      {selectedGame && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="selected-game-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedGame(null)}
        >
          <div
            className="relative w-full max-w-sm max-h-[85vh] bg-[#FAF6EB] border-2 border-[#2B2D42] rounded-3xl p-5 sm:p-6 shadow-[6px_7px_0_#2B2D42] text-[#2B2D42] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダル上部ヘッダー */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-dashed border-[#2B2D42]/25 shrink-0">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2B2D42] text-white text-[11px] font-extrabold">
                    <Users className="w-3 h-3" />
                    <span>
                      {selectedGame.min_players}〜{selectedGame.max_players}人
                    </span>
                  </span>
                  {selectedGame.isCustom && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFE066] border border-[#2B2D42] text-[#2B2D42] text-[11px] font-black">
                      ★ 自作ゲーム
                    </span>
                  )}
                  {selectedGame.metadata?.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-white border border-[#2B2D42]/30 text-[#2B2D42] text-[10px] font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <h3
                  id="selected-game-modal-title"
                  className="text-xl sm:text-2xl font-black text-[#2B2D42] leading-tight"
                >
                  {selectedGame.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGame(null)}
                className="p-1.5 rounded-xl bg-white border-2 border-[#2B2D42] hover:bg-amber-100 text-[#2B2D42] transition-colors shrink-0 cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* ルール・説明本文 */}
            <div className="overflow-y-auto flex-1 py-3 space-y-3 pr-1">
              <p className="text-xs sm:text-sm font-bold text-[#2B2D42]/90 leading-relaxed whitespace-pre-wrap">
                {selectedGame.description}
              </p>

              {selectedGame.metadata?.callExample && (
                <div className="p-3 rounded-2xl bg-[#FFF275]/45 border-2 border-[#2B2D42]/20">
                  <div className="flex items-center gap-1 text-xs font-black text-[#2B2D42] mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>かけ声・コールの例</span>
                  </div>
                  <pre className="text-xs font-bold text-[#2B2D42]/90 font-sans whitespace-pre-wrap leading-relaxed">
                    {selectedGame.metadata.callExample}
                  </pre>
                </div>
              )}

              {selectedGame.metadata?.ruleSummary &&
                selectedGame.metadata.ruleSummary.length > 0 && (
                  <div className="p-3 rounded-2xl bg-white border-2 border-[#2B2D42]/20">
                    <div className="flex items-center gap-1 text-xs font-black text-[#2B2D42] mb-2">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>あそび方の流れ</span>
                    </div>
                    <ul className="space-y-1.5 text-xs font-bold text-[#2B2D42]/90">
                      {selectedGame.metadata.ruleSummary.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#2B2D42] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* アクションボタン群 */}
            <div className="pt-3 border-t-2 border-dashed border-[#2B2D42]/25 space-y-2 shrink-0">
              <Link
                href={`/games/${selectedGame.id}/play?setup=1&count=${
                  playerFilter || selectedGame.min_players
                }`}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FFE066] hover:bg-[#ffd633] text-[#2B2D42] border-2 border-[#2B2D42] font-black text-base flex items-center justify-center gap-2 shadow-[3px_4px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0_#2B2D42] transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>すぐ遊ぶ！</span>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={`/games/${selectedGame.id}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>詳細ページを見る</span>
                </Link>

                {selectedGame.isCustom && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedGame;
                        setSelectedGame(null);
                        onEditCustomGame(target);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-amber-200 hover:bg-amber-300 border-2 border-[#2B2D42] text-[#2B2D42] text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                      title="編集する"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>編集</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, selectedGame)}
                      className="py-2.5 px-3 rounded-xl bg-rose-200 hover:bg-rose-300 border-2 border-[#2B2D42] text-rose-900 text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                      title="削除する"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>削除</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
