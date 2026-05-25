import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-b from-white to-[#f7f9fc] p-8">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-white/95 to-slate-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-slate-100/55 to-white/85 blur-2xl" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl glass-strong p-3 text-slate-800 font-bold shadow">V</div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">VedaAI</h1>
              <p className="text-sm text-slate-600">Make assessments beautiful, fair, and fast.</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Login</Link>
            <Link href="/register" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow ring-1 ring-slate-200 hover:bg-slate-50">Get started</Link>
          </nav>
        </header>

        <section className="mb-14 grid items-center gap-10 sm:grid-cols-2">
          <div className="space-y-7">
            <h2 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight">Design standards-aligned assessments in minutes, with a cleaner and more editorial interface.</h2>
            <p className="text-lg text-slate-600 max-w-xl">Upload course material or screenshots, let VedaAI extract the key concepts, and generate balanced papers with marking schemes, printable PDFs, and reviewable AI feedback.</p>

            <div className="flex items-center gap-4">
              <Link href="/create" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg">Create an assessment</Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 glass">See features</a>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 text-sm text-slate-600">
              <span className="glass-gray inline-flex items-center gap-2 rounded-full px-3 py-1">AI-generated marking schemes</span>
              <span className="glass-gray inline-flex items-center gap-2 rounded-full px-3 py-1">PDF-ready papers</span>
              <span className="glass-gray inline-flex items-center gap-2 rounded-full px-3 py-1">OCR for screenshots</span>
            </div>
          </div>

          <div className="relative">
            <div className="glass-gray rounded-2xl p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-8 w-40 rounded-full bg-gradient-to-r from-white to-slate-100" />
                  <h3 className="mt-4 text-lg font-semibold">Preview: Generated paper (mock)</h3>
                </div>
                <div className="text-xs text-slate-500">v1.0</div>
              </div>

              <div className="mt-4 border-t pt-4">
                <ol className="space-y-3 text-sm text-slate-700">
                  <li>1. Multiple choice — circuits and conductors</li>
                  <li>2. Short answer — explain closed circuit</li>
                  <li>3. Matching — series vs parallel</li>
                </ol>
              </div>
            </div>

            <div className="absolute -right-6 -bottom-6 hidden md:block">
              <div className="glass-gray flex h-24 w-36 items-center justify-center rounded-xl p-3 text-xs text-slate-600">Export PDF • Share • Review</div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 sm:grid-cols-3">
          <FeatureCard title="Auto-generate Papers" desc="Balanced sections, difficulty distribution, and question variety." />
          <FeatureCard title="OCR + Source Grounding" desc="Extract text from screenshots and PDFs so questions stay specific and relevant." />
          <FeatureCard title="Secure PDF Export" desc="Authenticated downloads, teacher review, and high-fidelity printable layouts." />
        </section>

        <section className="mt-14 grid gap-6 sm:grid-cols-3">
          <StatCard title="Faster Prep" desc="Minutes instead of hours per paper." />
          <StatCard title="Fairness" desc="Automatic difficulty balancing and rubric alignment." />
          <StatCard title="Privacy" desc="Configurable retention and encryption by default." />
        </section>

        <section className="mt-14">
          <h3 className="text-xl font-semibold">Trusted by educators</h3>
          <div className="mt-6 flex items-center gap-6 overflow-x-auto py-4">
            <div className="h-12 w-36 rounded-lg glass-gray" />
            <div className="h-12 w-36 rounded-lg glass-gray" />
            <div className="h-12 w-36 rounded-lg glass-gray" />
            <div className="h-12 w-36 rounded-lg glass-gray" />
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass-gray rounded-lg p-6">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-slate-700">{desc}</p>
    </div>
  );
}

function StatCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass-gray rounded-lg p-4">
      <div className="text-sm font-medium text-slate-800">{title}</div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

// Testimonials intentionally omitted to remove sample/demo content from the UI