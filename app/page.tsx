<<<<<<< HEAD
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/mission");
=======
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Normal for you, normal for space</h1>
      <p className="mt-4 text-lg">Every reading gets three answers:</p>
      <ol className="mt-2 list-decimal space-y-1 pl-6">
        <li>Normal for people?</li>
        <li>Normal for you?</li>
        <li>Normal for this day of the mission?</li>
      </ol>
      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Team HFm · NASA Space Apps 2026 · Work in progress. Screening, not a diagnosis.
      </p>
    </main>
  );
>>>>>>> 3abde7629b6cfeb66c0ae4db3ad9c4033cace3a1
}
