"use client";

import React from "react";

// 外枠の二重手描きチョークフレーム
export function ChalkOuterFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full p-3 sm:p-5">
      {/* 外側の手描きチョーク線 */}
      <svg
        className="absolute inset-2 sm:inset-3 w-[calc(100%-16px)] sm:w-[calc(100%-24px)] h-[calc(100%-16px)] sm:h-[calc(100%-24px)] pointer-events-none stroke-white/80"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* 外枠1本目 */}
        <path
          d="M 2 2 Q 50 1.5 98 2 Q 98.5 50 98 98 Q 50 98.5 2 98 Q 1.5 50 2 2"
          strokeWidth="0.8"
          strokeDasharray="99 0.5"
          vectorEffect="non-scaling-stroke"
          filter="url(#chalk-dust)"
        />
        {/* 外枠2本目（かすれ感を出す微細なズレ） */}
        <path
          d="M 2.8 2.6 Q 50 2.2 97.2 2.7 Q 97.6 50 97.3 97.2 Q 50 97.6 2.7 97.4 Q 2.3 50 2.8 2.6"
          strokeWidth="0.5"
          strokeOpacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <filter id="chalk-dust">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
          </filter>
        </defs>
      </svg>

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

// ボタン用の二重手描きチョーク枠
export function ChalkButtonBorder() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none stroke-white/90"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/* メイン枠線 */}
      <path
        d="M 3 3 Q 50 2 97 3 Q 98 50 97 97 Q 50 98 3 97 Q 2 50 3 3"
        strokeWidth="1.8"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* 重なりかすれ線 */}
      <path
        d="M 4 4.5 Q 50 3.8 96 4.2 Q 96.5 50 96 95.5 Q 50 96.2 4 95.8 Q 3.5 50 4 4.5"
        strokeWidth="1.0"
        strokeOpacity="0.75"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// 「1on1」の周りの手描き星マーク
export function ChalkStars() {
  return (
    <svg
      className="w-10 h-10 stroke-white/90 fill-none"
      viewBox="0 0 40 40"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 大きめの星 */}
      <path d="M 12 4 L 14 12 L 22 13 L 16 18 L 18 26 L 11 21 L 5 25 L 7 17 L 2 12 L 10 11 Z" />
      {/* 小さめの星 */}
      <path
        d="M 28 6 L 29 11 L 34 11.5 L 30 15 L 31 20 L 27 17 L 23 19.5 L 24 14.5 L 21 11.5 L 26 11 Z"
        strokeWidth="1.2"
        strokeOpacity="0.8"
      />
      {/* 補助星 */}
      <path d="M 8 30 L 9 33 L 12 33 L 10 35 L 11 38 L 8 36 L 5 38 L 6 35 L 4 33 L 7 33 Z" strokeWidth="1.0" strokeOpacity="0.7" />
    </svg>
  );
}

// 「みんなで遊ぶ」や「ゲーム一覧」の周りの強調線（効果線）
export function ChalkSparks() {
  return (
    <svg
      className="w-8 h-8 stroke-white/85 fill-none"
      viewBox="0 0 30 30"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M 8 18 L 3 13 L 9 10 L 15 4 L 18 10 L 24 7 L 21 14 L 27 19" />
    </svg>
  );
}

// 手描きのカーブ矢印
export function ChalkCurvedArrow({ className = "", direction = "down" }: { className?: string; direction?: "down" | "up" }) {
  return (
    <svg
      className={`w-6 h-8 stroke-white/85 fill-none ${className}`}
      viewBox="0 0 24 32"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "down" ? (
        <>
          <path d="M 16 2 Q 4 10 8 26" />
          <path d="M 3 21 L 8 27 L 14 22" />
        </>
      ) : (
        <>
          <path d="M 8 30 Q 20 20 16 6" />
          <path d="M 10 11 L 16 5 L 21 12" />
        </>
      )}
    </svg>
  );
}

// 写真の右下にある木製黒板消し（ラーフル）風アクセント
export function ChalkEraser() {
  return (
    <div className="flex items-center gap-2 select-none group cursor-pointer" title="チョーク＆黒板消し">
      {/* チョーク（白・黄） */}
      <div className="flex items-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="w-2 h-7 bg-white/95 rounded-t-sm shadow-sm transform -rotate-12" />
        <div className="w-2 h-5 bg-amber-300/90 rounded-t-sm shadow-sm transform rotate-6" />
      </div>

      {/* 黒板消し本体 */}
      <div className="w-16 h-7 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 rounded-md border border-amber-950 shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform">
        {/* プラスチック/木製持ち手 */}
        <div className="absolute top-0 inset-x-0 h-3 bg-amber-900/90 border-b border-amber-950/60" />
        {/* コーデュロイ消し布部分 */}
        <div className="absolute bottom-0 inset-x-0 h-4 bg-blue-950 flex items-center justify-around px-1">
          <div className="w-full h-0.5 bg-blue-900/50" />
        </div>
      </div>
    </div>
  );
}
