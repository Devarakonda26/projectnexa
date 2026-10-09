"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">We could not load this page. Please try again.</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">Try again</button>
    </main>
  );
}
