"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllGames } from "@/lib/supabase";
import { Game } from "@/types/game";
import { getAllGamesWithCustom } from "@/lib/customGames";
import DuelSetupModal from "@/components/home/DuelSetupModal";
import PartySetupModal from "@/components/home/PartySetupModal";
import CustomGameModal from "@/components/home/CustomGameModal";
import GameCatalogModal from "@/components/home/GameCatalogModal";

type HomeDoodleType = "duel_swords" | "party_cracker" | "create_pencil" | "catalog_book";

// トップ画面の4大カード専用：ボールペン落書き風スタンプSVG
function HomeCardDoodle({
  type,
  inkColor = "#2B2D42",
}: {
  type: HomeDoodleType;
  inkColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-15 h-15 sm:w-17 sm:h-17 overflow-visible opacity-90"
      fill="none"
      stroke={inkColor}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* ① 1on1：交差する2本の剣＆火花 */}
      {type === "duel_swords" && (
        <g transform="rotate(-4 32 32)">
          {/* 左から右上の剣 */}
          <path d="M14 48 L46 16 L50 14 L48 18 L16 50 Z" fill="#FFFFFF" />
          <line x1="18" y1="38" x2="26" y2="46" strokeWidth="3" />
          <line x1="11" y1="51" x2="17" y2="45" strokeWidth="3.2" />

          {/* 右から左上の剣 */}
          <path d="M50 48 L18 16 L14 14 L16 18 L48 50 Z" fill="#FFFFFF" />
          <line x1="46" y1="38" x2="38" y2="46" strokeWidth="3" />
          <line x1="53" y1="51" x2="47" y2="45" strokeWidth="3.2" />

          {/* ぶつかる火花 */}
          <path
            d="M32 8 L33.5 13 L38.5 14.5 L33.5 16 L32 21 L30.5 16 L25.5 14.5 L30.5 13 Z"
            fill="#FFFFFF"
          />
        </g>
      )}

      {/* ② みんなで遊ぶ：パーティークラッカー＆紙吹雪 */}
      {type === "party_cracker" && (
        <g transform="rotate(-6 32 32)">
          {/* クラッカー本体 */}
          <polygon points="14,50 24,24 40,40" fill="#FFFFFF" />
          <line x1="19" y1="37" x2="31" y2="44" />
          <line x1="22" y1="29" x2="37" y2="41" />
          {/* 飛び出すテープと星 */}
          <path d="M34 26 Q42 16 50 18" />
          <path d="M29 21 Q32 11 40 10" />
          <path d="M38 33 Q48 31 53 36" />
          <circle cx="48" cy="25" r="2.2" fill={inkColor} />
          <circle cx="26" cy="14" r="2" fill={inkColor} />
          <polygon
            points="46,10 47.5,13 51,13.5 48.5,16 49,19.5 46,17.8 43,19.5 43.5,16 41,13.5 44.5,13"
            fill="#FFFFFF"
          />
        </g>
      )}

      {/* ③ ゲームを作る：鉛筆＆ひらめき電球 */}
      {type === "create_pencil" && (
        <g transform="rotate(-6 32 32)">
          {/* 鉛筆 */}
          <g transform="rotate(28 32 36)">
            <rect x="27" y="18" width="10" height="26" fill="#FFFFFF" />
            <polygon points="27,44 37,44 32,53" fill="#FFFFFF" />
            <polygon points="30.5,50 33.5,50 32,53" fill={inkColor} />
            <rect x="27" y="13" width="10" height="5" rx="1.5" fill="#FFFFFF" />
            <line x1="32" y1="18" x2="32" y2="44" />
          </g>
          {/* ひらめきの星・電球マーク */}
          <path
            d="M18 14 L20 9 L22 14 L27 16 L22 18 L20 23 L18 18 L13 16 Z"
            fill="#FFFFFF"
          />
          <line x1="46" y1="12" x2="50" y2="9" />
          <line x1="49" y1="18" x2="54" y2="17" />
        </g>
      )}

      {/* ④ ゲーム一覧：開いたノート＆しおり・虫眼鏡 */}
      {type === "catalog_book" && (
        <g transform="rotate(-5 32 32)">
          {/* 見開きノート */}
          <path
            d="M12 20 Q22 17 32 21 L32 46 Q22 42 12 45 Z"
            fill="#FFFFFF"
          />
          <path
            d="M52 20 Q42 17 32 21 L32 46 Q42 42 52 45 Z"
            fill="#FFFFFF"
          />
          {/* ノートの文字線 */}
          <line x1="17" y1="26" x2="27" y2="27" />
          <line x1="17" y1="32" x2="27" y2="33" />
          <line x1="17" y1="38" x2="25" y2="39" />
          <line x1="37" y1="27" x2="47" y2="26" />
          <line x1="37" y1="33" x2="47" y2="32" />
          {/* しおりリボン */}
          <polygon points="39,44 39,53 42.5,50 46,53 46,43" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
}

// 右下の文房具あしらい（プラスチック消しゴム＆蛍光ペン）
function NotebookStationery() {
  return (
    <div
      className="flex items-end gap-3 select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* 蛍光マーカーペン（斜め置き） */}
      <div className="flex items-center -rotate-6 translate-y-0.5 drop-shadow-[2px_2px_0_#2B2D42]">
        {/* ペン先 */}
        <div
          className="w-2.5 h-3 bg-[#FFF275] border-2 border-r-0 border-[#2B2D42]"
          style={{ clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 80%)" }}
        />
        {/* 首軸 */}
        <div className="w-3 h-4 bg-white border-2 border-r-0 border-[#2B2D42]" />
        {/* ペン軸本体 */}
        <div className="w-20 sm:w-24 h-5 bg-[#FFF275] border-2 border-[#2B2D42] rounded-r-md flex items-center justify-between px-2">
          <span className="text-[7px] font-black tracking-widest text-[#2B2D42]">
            MARKER
          </span>
          <div className="w-3 h-1.5 bg-[#2B2D42]/20 rounded-full" />
        </div>
      </div>

      {/* プラスチック消しゴム（青白スリーブ付き） */}
      <div className="relative w-14 h-8 bg-white rounded-md border-2 border-[#2B2D42] shadow-[2px_3px_0_#2B2D42] rotate-3 flex overflow-hidden">
        {/* 白いラバー部分（左） */}
        <div className="w-3.5 h-full bg-[#FAF8F5] border-r-2 border-[#2B2D42]" />
        {/* 青い紙ケース（スリーブ） */}
        <div className="flex-1 h-full bg-[#3A86FF] flex flex-col justify-between py-1 px-1.5">
          <div className="w-full h-1 bg-white/90 rounded-xs" />
          <span className="text-[7px] font-black tracking-tighter text-white leading-none text-center">
            ERASER
          </span>
          <div className="w-full h-1 bg-[#2B2D42] rounded-xs" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [allGameList, setAllGameList] = useState<Game[]>([]);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState<boolean>(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);

  // ゲームリストの読み込み（自作ゲームを含む）
  const refreshGames = useCallback(async () => {
    const defaultGames = await getAllGames();
    const custom = getAllGamesWithCustom().filter((g) => g.isCustom);
    setAllGameList([...custom, ...defaultGames]);
  }, []);

  useEffect(() => {
    refreshGames();
    const handleCustomUpdate = () => {
      refreshGames();
    };
    window.addEventListener("customGamesUpdated", handleCustomUpdate);
    return () =>
      window.removeEventListener("customGamesUpdated", handleCustomUpdate);
  }, [refreshGames]);

  const handleOpenCustomCreate = () => {
    setGameToEdit(null);
    setIsCustomModalOpen(true);
  };

  const handleEditCustomGame = (game: Game) => {
    setGameToEdit(game);
    setIsCustomModalOpen(true);
  };

  const customCount = allGameList.filter((g) => g.isCustom).length;
  // 1on1・みんなで遊ぶ・ゲームを作る は内部データとして保持しつつ一時非表示
  const SHOW_EXTRA_MODES = false;

  return (
    <main
      className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none relative"
      style={{
        // 大学ノートの横罫線（28px間隔の淡いブルー罫線）
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

      {/* ノートページ中央コンテナ */}
      <div className="relative z-10 w-full max-w-md h-[92vh] max-h-[820px] min-h-[600px] flex flex-col justify-between">
        {/* 最上部：リングノートのスパイラル金具＆パンチ穴あしらい */}
        <div>
          <div
            className="px-4 sm:px-6 pt-1 pb-2 flex items-center justify-between pointer-events-none"
            aria-hidden="true"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-2 h-3.5 -mt-2 rounded-full border-2 border-[#2B2D42]/70 bg-[#E2DDD0]" />
                <div className="w-3.5 h-3.5 -mt-1 rounded-full bg-[#DBD5C5] border border-[#2B2D42]/30 shadow-inner" />
              </div>
            ))}
          </div>

          {/* 大学ノートの見出し欄（蛍光ペン付き「マチジカン！」ロゴ） */}
          <header className="mt-1 px-3 py-3 border-t-2 border-b-2 border-[#2B2D42] bg-[#FAF6EB]/90 backdrop-blur-xs">
            <div className="text-center py-1">
              <div className="relative inline-block px-3">
                {/* 黄色い蛍光マーカーのハイライト帯 */}
                <span
                  className="absolute bottom-1 inset-x-0 h-4 sm:h-5 bg-[#FFF275] -rotate-1 rounded-xs -z-10"
                  aria-hidden="true"
                />
                <h1 className="text-4xl sm:text-5xl font-black text-[#2B2D42] tracking-tight transform -rotate-1">
                  マチジカン！
                </h1>
              </div>
            </div>
          </header>
        </div>

        {/* 中央 ノートカードボタン */}
        <div
          className={
            SHOW_EXTRA_MODES
              ? "grid grid-cols-2 gap-x-3.5 gap-y-4 sm:gap-x-4 sm:gap-y-5 my-auto px-1"
              : "flex justify-center my-auto px-3"
          }
        >
          {/* ① 左上: 「1on1」（一時非表示・データ保持） */}
          {SHOW_EXTRA_MODES && (
            <button
              type="button"
              onClick={() => setIsDuelModalOpen(true)}
              className="group relative h-34 sm:h-38 w-full rounded-2xl bg-white border-2 border-[#2B2D42] overflow-hidden text-left flex flex-col justify-between p-3.5 sm:p-4 shadow-[4px_5px_0_#2B2D42] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
              title="2人対戦 (1on1)"
            >
              <div
                className="absolute inset-y-0 right-0 w-[56%] pointer-events-none transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: "#7CE8DC",
                  clipPath: "polygon(42% 0, 100% 0, 100% 100%, 0% 100%)",
                }}
              />
              <span className="relative z-10 inline-flex items-center self-start px-2 py-0.5 rounded-md bg-[#2B2D42] text-white text-[10px] font-black tracking-wide">
                2人でガチ勝負
              </span>
              <div className="relative z-10 mt-auto pr-10">
                <span className="block text-3xl sm:text-4xl font-black text-[#2B2D42] tracking-tight leading-none">
                  1on1
                </span>
                <span className="block text-[10px] font-extrabold text-[#2B2D42]/75 mt-1">
                  3本 / 5本先取バトル
                </span>
              </div>
              <div className="absolute bottom-1 right-1 z-10 pointer-events-none transition-transform duration-200 group-hover:rotate-6 group-hover:scale-105">
                <HomeCardDoodle type="duel_swords" inkColor="#1D4E56" />
              </div>
            </button>
          )}

          {/* ② 右上: 「みんなで遊ぶ」（一時非表示・データ保持） */}
          {SHOW_EXTRA_MODES && (
            <button
              type="button"
              onClick={() => setIsPartyModalOpen(true)}
              className="group relative h-34 sm:h-38 w-full rounded-2xl bg-white border-2 border-[#2B2D42] overflow-hidden text-left flex flex-col justify-between p-3.5 sm:p-4 shadow-[4px_5px_0_#2B2D42] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
              title="多人数対戦 (3〜8人)"
            >
              <div
                className="absolute inset-y-0 right-0 w-[56%] pointer-events-none transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: "#E8F655",
                  clipPath: "polygon(42% 0, 100% 0, 100% 100%, 0% 100%)",
                }}
              />
              <span className="relative z-10 inline-flex items-center self-start px-2 py-0.5 rounded-md bg-[#2B2D42] text-white text-[10px] font-black tracking-wide">
                3〜8人パーティ
              </span>
              <div className="relative z-10 mt-auto pr-10">
                <span className="block text-xl sm:text-2xl font-black text-[#2B2D42] tracking-tight leading-tight">
                  みんなで遊ぶ
                </span>
                <span className="block text-[10px] font-extrabold text-[#2B2D42]/75 mt-1">
                  点数 / 生存 / 最弱王
                </span>
              </div>
              <div className="absolute bottom-1 right-1 z-10 pointer-events-none transition-transform duration-200 group-hover:rotate-6 group-hover:scale-105">
                <HomeCardDoodle type="party_cracker" inkColor="#425214" />
              </div>
            </button>
          )}

          {/* ③ 左下: 「ゲームを作る」（一時非表示・データ保持） */}
          {SHOW_EXTRA_MODES && (
            <button
              type="button"
              onClick={handleOpenCustomCreate}
              className="group relative h-34 sm:h-38 w-full rounded-2xl bg-white border-2 border-[#2B2D42] overflow-hidden text-left flex flex-col justify-between p-3.5 sm:p-4 shadow-[4px_5px_0_#2B2D42] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_2px_0_#2B2D42] transition-all cursor-pointer"
              title="自作ゲームを作成"
            >
              <div
                className="absolute inset-y-0 right-0 w-[56%] pointer-events-none transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: "#FFADAD",
                  clipPath: "polygon(42% 0, 100% 0, 100% 100%, 0% 100%)",
                }}
              />
              <span className="relative z-10 inline-flex items-center self-start px-2 py-0.5 rounded-md bg-[#2B2D42] text-white text-[10px] font-black tracking-wide">
                オリジナル作成
              </span>
              <div className="relative z-10 mt-auto pr-10">
                <span className="block text-xl sm:text-2xl font-black text-[#2B2D42] tracking-tight leading-tight">
                  ゲームを作る
                </span>
                <span className="block text-[10px] font-extrabold text-[#2B2D42]/75 mt-1">
                  {customCount > 0
                    ? `自作 ${customCount}件 登録中`
                    : "お題・タイマー自由自在"}
                </span>
              </div>
              <div className="absolute bottom-1 right-1 z-10 pointer-events-none transition-transform duration-200 group-hover:rotate-6 group-hover:scale-105">
                <HomeCardDoodle type="create_pencil" inkColor="#6E2323" />
              </div>
            </button>
          )}

          {/* ④ メイン表示: 「ゲーム一覧」 */}
          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className={`group relative w-full rounded-3xl bg-white border-[2.5px] border-[#2B2D42] overflow-hidden text-left flex flex-col justify-between p-5 sm:p-6 shadow-[5px_6px_0_#2B2D42] hover:-translate-y-0.5 hover:shadow-[6px_7px_0_#2B2D42] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[2px_3px_0_#2B2D42] transition-all cursor-pointer ${
              SHOW_EXTRA_MODES ? "h-34 sm:h-38" : "max-w-xs h-42 sm:h-46"
            }`}
            title="収録タイトル一覧"
          >
            {/* 右側の斜め蛍光マーカー（ラベンダー） */}
            <div
              className="absolute inset-y-0 right-0 w-[54%] pointer-events-none transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: "#CBC8FA",
                clipPath: "polygon(38% 0, 100% 0, 100% 100%, 0% 100%)",
              }}
            />

            {/* 上部サブラベル */}
            <span className="relative z-10 inline-flex items-center self-start px-2.5 py-0.5 rounded-md bg-[#2B2D42] text-white text-xs font-black tracking-wide">
              全{allGameList.length || 7}タイトル
            </span>

            {/* メインタイトル */}
            <div className="relative z-10 mt-auto pr-12">
              <span className="block text-2xl sm:text-3xl font-black text-[#2B2D42] tracking-tight leading-tight">
                ゲーム一覧
              </span>
              <span className="block text-xs font-extrabold text-[#2B2D42]/75 mt-1">
                あそぶゲームをえらぶ
              </span>
            </div>

            {/* 右下：ノートの落書きスタンプ */}
            <div className="absolute bottom-2 right-2.5 z-10 pointer-events-none transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110">
              <HomeCardDoodle type="catalog_book" inkColor="#3B356E" />
            </div>
          </button>
        </div>

        {/* 下部：文房具あしらい（消しゴム＆蛍光マーカー） */}
        <div className="pt-2 pb-1 flex items-end justify-end px-2 border-t-2 border-dashed border-[#2B2D42]/25">
          <NotebookStationery />
        </div>
      </div>

      {/* 各モーダル */}
      <DuelSetupModal
        isOpen={isDuelModalOpen}
        onClose={() => setIsDuelModalOpen(false)}
      />
      <PartySetupModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
      />
      <CustomGameModal
        isOpen={isCustomModalOpen}
        gameToEdit={gameToEdit}
        onClose={() => setIsCustomModalOpen(false)}
        onSaved={refreshGames}
      />
      <GameCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        allGameList={allGameList}
        onRefresh={refreshGames}
        onEditCustomGame={handleEditCustomGame}
      />
    </main>
  );
}
