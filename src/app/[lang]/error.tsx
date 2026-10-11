"use client";

export default function ErrorPage({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Something went wrong · Có lỗi xảy ra</h1>
      <button type="button" onClick={() => retry()} className="mt-8 rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
        Retry · Thử lại
      </button>
    </div>
  );
}
