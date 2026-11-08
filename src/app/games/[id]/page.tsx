"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GameDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/games/${id}/play`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#FAF6EB] text-[#2B2D42] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#2B2D42] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black">ゲーム画面へ移動中...</p>
      </div>
    </div>
  );
}
