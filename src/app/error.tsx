"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">حدث خطأ غير متوقع</h2>
      <p className="text-slate-500 max-w-md mb-6 text-sm">
        نعتذر، واجه النظام خطأ أثناء تحميل هذه الصفحة. يرجى إعادة المحاولة.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-md"
      >
        <RotateCcw className="w-4 h-4" />
        <span>إعادة المحاولة</span>
      </button>
    </div>
  );
}
