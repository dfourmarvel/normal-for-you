export function CheckScreen() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">BioTensor Q-Health</p>
        <h1 className="mt-2 text-3xl font-bold">Daily self-check</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Normal for people, normal for you, normal for this mission day.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-secondary">Normal for people</div>
          <div className="mt-2 text-lg font-semibold">Lab range / NASA limit</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-secondary">Normal for you</div>
          <div className="mt-2 text-lg font-semibold">Own pre-flight baseline</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-secondary">Normal for today</div>
          <div className="mt-2 text-lg font-semibold">Mission-phase expectation</div>
        </div>
      </section>
    </main>
  );
}

export default CheckScreen;
