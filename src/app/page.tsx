import { LOACreatorApp } from "@/components/LOACreatorApp";

export default function Home() {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-100 via-white to-brand-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Porting & Activation
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              LOA Creator
            </h1>
          </div>
          <span className="badge-muted hidden sm:inline-flex">
            AT&T → CallTower
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 rounded-2xl bg-brand-600 px-6 py-5 text-white shadow-lg shadow-brand-600/20">
          <p className="text-sm leading-relaxed text-brand-50">
            Upload your LOA template and up to 30 source documents. AI will
            extract the exact field values and produce a completed Letter of
            Authorization ready for porting review.
          </p>
        </div>
        <LOACreatorApp />
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-6 text-center text-xs text-slate-500">
        LOA Creator · AT&T to CallTower porting automation
      </footer>
    </div>
  );
}
