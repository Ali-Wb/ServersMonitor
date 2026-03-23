export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 shadow-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">
          VPS Health Dashboard
        </p>
        <h1 className="text-4xl font-semibold text-[var(--color-card-foreground)]">
          vpsmon-web scaffold is ready.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-muted-foreground)]">
          This Next.js application was initialized as the foundation for the
          monitoring dashboard described in CONTEXT.md, with Tailwind CSS v4,
          TypeScript, ESLint, and the requested runtime dependencies prepared in
          package metadata.
        </p>
      </section>
    </main>
  );
}
