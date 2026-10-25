"use client";

import React from "react";

// チョーク共通のザラつきフィルター定義
export function ChalkFilterDef() {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        <filter id="chalk-roughness">
          {/* チョークの粉の微細な凹凸とブレ */}
          <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
        </filter>
        <filter id="chalk-subtle">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" />
        </filter>
      </defs>
    </svg>
  );
}

// ① 全体を囲む二重チョーク外枠（四隅の突き抜け＆手描きのたわみ）
export function ChalkOuterFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full p-2.5 sm:p-4">
      <ChalkFilterDef />
      
      {/* 写真の黒板外枠を忠実に再現：四隅が少しクロスしてはみ出た手描き線 */}
      <svg
        className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none stroke-white/85"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* 上辺（左から右へ、少し上に突き抜け） */}
        <path d="M 2 2.5 L 98.5 2.2" strokeWidth="1.2" strokeLinecap="round" filter="url(#chalk-roughness)" />
        {/* 右辺（上から下へ、少しはみ出し） */}
        <path d="M 98 1.5 L 98.2 98.8" strokeWidth="1.1" strokeLinecap="round" filter="url(#chalk-roughness)" />
        {/* 下辺（右から左へ、角でクロス） */}
        <path d="M 99 98.2 L 1.5 98.5" strokeWidth="1.2" strokeLinecap="round" filter="url(#chalk-roughness)" />
        {/* 左辺（下から上へ、角でクロス） */}
        <path d="M 2.2 99.2 L 1.8 1.8" strokeWidth="1.1" strokeLinecap="round" filter="url(#chalk-roughness)" />

        {/* チョークのかすれた二度書き線（微細なズレで生々しい筆跡を表現） */}
        <path d="M 2.5 3.2 Q 50 2.8 97.5 3.0" strokeWidth="0.6" strokeOpacity="0.6" strokeLinecap="round" />
        <path d="M 97.2 2.5 Q 97.5 50 97.3 97.5" strokeWidth="0.6" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M 97.5 97.5 Q 50 97.8 2.8 97.6" strokeWidth="0.6" strokeOpacity="0.6" strokeLinecap="round" />
        <path d="M 2.8 97.5 Q 2.6 50 2.9 2.5" strokeWidth="0.6" strokeOpacity="0.5" strokeLinecap="round" />
      </svg>

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

// ②-1: 左上「1on1」専用の手描きチョーク枠
// 写真の特徴：左上の縦線と上の横線が突き抜け、二重線の内側が重なっている
export function ChalkBorder1on1() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none stroke-white/90"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/* メイン手描き四角（角が少し突き抜ける手描き感） */}
      <path
        d="M 2 5 L 98 4.2 L 97 96.5 L 3.5 97 L 2 5"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#chalk-subtle)"
      />
      {/* 角のはみ出し線 */}
      <path d="M 1 4.5 L 14 4.3" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 3.2 1.5 L 3.0 12" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 94 96.5 L 99 96.6" strokeWidth="1.4" strokeLinecap="round" />
      
      {/* 内側の重ね描きかすれ線 */}
      <path
        d="M 5 6.5 Q 50 5.8 95 6.2 Q 95.5 50 95.2 94.5 Q 50 95 5.5 94.8 Q 4.8 50 5 6.5"
        strokeWidth="0.9"
        strokeOpacity="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ②-2: 右上「みんなで遊ぶ」専用の手描きチョーク枠
// 写真の特徴：横長、右上の角が少し開き、下辺がわずかに湾曲
export function ChalkBorderParty() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none stroke-white/90"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/* メイン線 */}
      <path
        d="M 3 4 Q 50 3 96.5 4.5 Q 98 50 96.8 96 Q 50 97.2 3.8 95.8 Q 2.2 50 3 4"
        strokeWidth="1.8"
        strokeLinecap="round"
        filter="url(#chalk-subtle)"
      />
      {/* 右上の角の突き抜け */}
      <path d="M 92 4.2 L 99 4.8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 97 1.5 L 96.8 10" strokeWidth="1.5" strokeLinecap="round" />

      {/* かすれ二重線 */}
      <path
        d="M 4.5 5.5 L 95 6 L 95.5 94.5 L 5 94 Z"
        strokeWidth="0.8"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ②-3: 左下「ゲームを作る」専用の手描きチョーク枠
// 写真の特徴：左辺がやや太く、左下と右上の角が交差
export function ChalkBorderCustom() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none stroke-white/90"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/* メイン線 */}
      <path
        d="M 3.5 3.5 L 97.2 4 L 96 96.5 L 2.8 96 L 3.5 3.5"
        strokeWidth="1.8"
        strokeLinecap="round"
        filter="url(#chalk-subtle)"
      />
      {/* 左下の突き抜け線 */}
      <path d="M 1 96 L 12 96.2" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 3.2 88 L 3.0 99" strokeWidth="1.5" strokeLinecap="round" />

      {/* 二重書きのかすれ */}
      <path
        d="M 5 5.5 Q 50 4.8 95 5.2 Q 94.5 50 94.2 94.5 Q 50 95.2 4.8 94.5 Q 4.2 50 5 5.5"
        strokeWidth="0.9"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ②-4: 右下「ゲーム一覧」専用の手描きチョーク枠
// 写真の特徴：右下が少しすぼまり、角がそれぞれラフに重なる
export function ChalkBorderCatalog() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none stroke-white/90"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/* メイン線 */}
      <path
        d="M 4 3 L 96.5 4.2 L 95.8 96 L 3 96.5 L 4 3"
        strokeWidth="1.8"
        strokeLinecap="round"
        filter="url(#chalk-subtle)"
      />
      {/* 右上の突き抜け */}
      <path d="M 91 4.2 L 98.5 4.5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 96.5 1.5 L 96.2 9" strokeWidth="1.4" strokeLinecap="round" />

      {/* かすれ線 */}
      <path
        d="M 5.5 5 L 94.5 6 L 94 94.5 L 4.5 94.5 Z"
        strokeWidth="0.8"
        strokeOpacity="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ③ 「1on1」の横の一筆書き手描き星マーク群（写真通りのリアルな星落書き）
export function ChalkStars() {
  return (
    <svg
      className="w-9 h-14 stroke-white/90 fill-none"
      viewBox="0 0 36 56"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#chalk-subtle)"
    >
      {/* 上の大きめの一筆書き五芒星 */}
      <path d="M 12 18 L 18 2 L 24 18 L 9 8 L 27 8 Z" strokeWidth="1.7" />
      
      {/* 右の小さな一筆書き星 */}
      <path d="M 27 23 L 30 16 L 33 23 L 25 18 L 35 18 Z" strokeWidth="1.3" strokeOpacity="0.85" />
      
      {/* 下の星 */}
      <path d="M 10 46 L 14 34 L 18 46 L 7 38 L 21 38 Z" strokeWidth="1.4" strokeOpacity="0.8" />
    </svg>
  );
}

// ④ 単独の小さな一筆書き星（「ゲーム一覧」の左下用）
export function ChalkSingleStar() {
  return (
    <svg
      className="w-5 h-5 stroke-white/85 fill-none"
      viewBox="0 0 24 24"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#chalk-subtle)"
    >
      <path d="M 12 21 L 16 7 L 20 21 L 9 12 L 23 12 Z" />
    </svg>
  );
}

// ⑤ 写真通りのチョーク効果線（サッサッと走る手描き線）
export function ChalkSparks({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-7 h-7 stroke-white/85 fill-none ${className}`}
      viewBox="0 0 28 28"
      strokeWidth="1.7"
      strokeLinecap="round"
      filter="url(#chalk-subtle)"
    >
      {/* チョークで勢いよく引いた3本の効果線 */}
      <path d="M 4 20 L 10 14" />
      <path d="M 8 10 L 17 5" />
      <path d="M 16 16 L 24 10" />
    </svg>
  );
}

// ⑥ 写真通りの手描き矢印
export function ChalkCurvedArrow({
  className = "",
  direction = "down",
}: {
  className?: string;
  direction?: "down" | "up";
}) {
  return (
    <svg
      className={`w-7 h-9 stroke-white/85 fill-none ${className}`}
      viewBox="0 0 28 36"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#chalk-subtle)"
    >
      {direction === "down" ? (
        <>
          {/* 下向きのしなる矢印 */}
          <path d="M 18 3 Q 6 12 9 29" />
          <path d="M 4 23 L 9 30 L 16 25" />
        </>
      ) : (
        <>
          {/* 上向きのしなる矢印 */}
          <path d="M 8 32 Q 22 22 17 6" />
          <path d="M 11 11 L 17 5 L 23 12" />
        </>
      )}
    </svg>
  );
}

// ⑦ 写真右下の木製黒板消し（ラーフル）風アクセント
export function ChalkEraser() {
  return (
    <div className="flex items-end gap-2 select-none group cursor-pointer" title="チョーク＆黒板消し">
      {/* 転がっている白・黄チョーク */}
      <div className="flex items-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity pb-0.5">
        <div className="w-2 h-6 bg-white/90 rounded-t-sm transform -rotate-12" />
        <div className="w-2 h-4.5 bg-amber-300/85 rounded-t-sm transform rotate-6" />
      </div>

      {/* 黒板消し本体（木目調） */}
      <div className="w-16 h-7 bg-amber-800 rounded-sm border border-amber-950 shadow-md relative overflow-hidden group-hover:brightness-105 transition-all">
        {/* 木製持ち手 */}
        <div className="absolute top-0 inset-x-0 h-3 bg-amber-900 border-b border-amber-950/70" />
        {/* 消し布コーデュロイ */}
        <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-900 flex items-center justify-around px-1">
          <div className="w-full h-0.5 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
