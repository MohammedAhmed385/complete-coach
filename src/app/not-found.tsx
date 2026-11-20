import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-3xl mb-6 shadow-inner">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
        الصفحة غير موجودة
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm">
        عذراً، الصفحة التي تبحث عنها غير متوفرة أو ربما تم نقلها. يمكنك العودة إلى الصفحة الرئيسية لمتابعة الحالات والتمارين.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-600/20"
      >
        <Home className="w-4 h-4" />
        <span>العودة للرئيسية</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}
