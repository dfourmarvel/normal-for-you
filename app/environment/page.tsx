import { runStormReplan } from "@/lib/environment/storm-replan";

export default function EnvironmentPage() {
  const { normalSchedule, stormSchedule } =
    runStormReplan();

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Environment Monitor
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">
          Radiation Event
        </h2>

        <p>
          NOAA Scale: S4
        </p>

        <p>
          Shelter Required: Yes
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">
          Normal Schedule
        </h2>

        <pre>
          {JSON.stringify(
            normalSchedule.assignments,
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Storm Replanned Schedule
        </h2>

        <pre>
          {JSON.stringify(
            stormSchedule.assignments,
            null,
            2
          )}
        </pre>
      </section>
    </main>
  );
}