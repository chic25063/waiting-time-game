"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllGames } from "@/lib/supabase";
import { Game } from "@/types/game";
import { getAllGamesWithCustom } from "@/lib/customGames";
import DuelSetupModal from "@/components/home/DuelSetupModal";
import PartySetupModal from "@/components/home/PartySetupModal";
import CustomGameModal from "@/components/home/CustomGameModal";
import GameCatalogModal from "@/components/home/GameCatalogModal";
import {
  ChalkOuterFrame,
  ChalkBorder1on1,
  ChalkBorderParty,
  ChalkBorderCustom,
  ChalkBorderCatalog,
  ChalkStars,
  ChalkSingleStar,
  ChalkSparks,
  ChalkCurvedArrow,
  ChalkEraser,
} from "@/components/home/ChalkArtElements";

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
    return () => window.removeEventListener("customGamesUpdated", handleCustomUpdate);
  }, [refreshGames]);

  const handleOpenCustomCreate = () => {
    setGameToEdit(null);
    setIsCustomModalOpen(true);
  };

  const handleEditCustomGame = (game: Game) => {
    setGameToEdit(game);
    setIsCustomModalOpen(true);
  };

  return (
    <main className="min-h-screen chalkboard-bg text-white flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      {/* 黒板キャンバスコンテナ（写真の手描きスケッチ比率） */}
      <div className="relative w-full max-w-md h-[92vh] max-h-[820px] min-h-[600px] flex flex-col justify-between">
        {/* 黒板のチョーク外枠 */}
        <ChalkOuterFrame>
          <div className="h-full flex flex-col justify-between py-6 px-3 sm:px-6">
            
            {/* 上部タイトル: 「マチジカン！」 */}
            <div className="pt-2 sm:pt-4 text-center">
              <h1 className="text-5xl sm:text-6xl font-chalk chalk-text tracking-wider transform -rotate-1 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
                マチジカン！
              </h1>
            </div>

            {/* 中央 2×2 チョークボタン グリッド */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:gap-x-8 sm:gap-y-10 my-auto px-2">
              
              {/* ① 左上: 「1on1」 */}
              <div className="relative">
                {/* スケッチ通りの手描き星（左側） */}
                <div className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChalkStars />
                </div>

                <button
                  type="button"
                  onClick={() => setIsDuelModalOpen(true)}
                  className="chalk-button w-full h-28 sm:h-32 rounded-lg flex items-center justify-center p-2 text-center group cursor-pointer"
                  title="2人対戦 (1on1)"
                >
                  <ChalkBorder1on1 />
                  <span className="text-3xl sm:text-4xl font-chalk chalk-text font-black tracking-wider">
                    1on1
                  </span>
                </button>
              </div>

              {/* ② 右上: 「みんなで遊ぶ」 */}
              <div className="relative">
                {/* スケッチ通りの効果線（右上・左上） */}
                <div className="absolute -top-3.5 -right-3 pointer-events-none">
                  <ChalkSparks />
                </div>
                <div className="absolute -top-3 -left-3 pointer-events-none transform -rotate-45 scale-75">
                  <ChalkSparks />
                </div>

                {/* スケッチ通りの下向きカーブ矢印（右下からゲーム一覧へ） */}
                <div className="absolute -bottom-7 -right-2 pointer-events-none transform rotate-12">
                  <ChalkCurvedArrow direction="down" />
                </div>

                <button
                  type="button"
                  onClick={() => setIsPartyModalOpen(true)}
                  className="chalk-button w-full h-28 sm:h-32 rounded-lg flex items-center justify-center p-2 text-center group cursor-pointer"
                  title="多人数対戦 (3〜8人)"
                >
                  <ChalkBorderParty />
                  <span className="text-2xl sm:text-3xl font-chalk chalk-text font-bold tracking-tight">
                    みんなで遊ぶ
                  </span>
                </button>
              </div>

              {/* ③ 左下: 「ゲームを作る」 */}
              <div className="relative">
                {/* スケッチ通りの上向きカーブ矢印（左側） */}
                <div className="absolute -left-6 sm:-left-7 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChalkCurvedArrow direction="up" />
                </div>

                {/* スケッチ通りの効果線（右上・左下） */}
                <div className="absolute -top-3 -right-2 pointer-events-none transform rotate-45 scale-75">
                  <ChalkSparks />
                </div>

                <button
                  type="button"
                  onClick={handleOpenCustomCreate}
                  className="chalk-button w-full h-28 sm:h-32 rounded-lg flex items-center justify-center p-2 text-center group cursor-pointer"
                  title="自作ゲームを作成"
                >
                  <ChalkBorderCustom />
                  <span className="text-xl sm:text-2xl font-chalk chalk-text font-bold tracking-tight">
                    ゲームを作る
                  </span>
                </button>
              </div>

              {/* ④ 右下: 「ゲーム一覧」 */}
              <div className="relative">
                {/* スケッチ通りの星（左下） */}
                <div className="absolute -bottom-3 -left-3 pointer-events-none">
                  <ChalkSingleStar />
                </div>

                {/* スケッチ通りの効果線（右下） */}
                <div className="absolute -bottom-3.5 -right-2 pointer-events-none transform rotate-180 scale-75">
                  <ChalkSparks />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="chalk-button w-full h-28 sm:h-32 rounded-lg flex items-center justify-center p-2 text-center group cursor-pointer"
                  title="収録タイトル一覧"
                >
                  <ChalkBorderCatalog />
                  <span className="text-xl sm:text-2xl font-chalk chalk-text font-bold tracking-tight">
                    ゲーム一覧
                  </span>
                </button>
              </div>

            </div>

            {/* 下部トレイ & 黒板消し・チョーク（スケッチ写真の右下に忠実） */}
            <div className="pt-2 flex items-end justify-end px-1">
              {/* 写真右下の木製黒板消し */}
              <ChalkEraser />
            </div>

          </div>
        </ChalkOuterFrame>
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
