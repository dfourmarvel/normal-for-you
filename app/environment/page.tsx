import { MOCK_STORMS } from "@/lib/environment/mock-storm";
import { createStormStatus } from "@/lib/environment/radiation";
import { runStormReplan } from "@/lib/environment/storm-replan";

export default function EnvironmentPage() {
  const events = MOCK_STORMS;

  const storm = createStormStatus("S4");

  const { normalSchedule, stormSchedule } =
    runStormReplan();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-4xl font-bold">
        Environment Monitor
      </h1>

      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-3 text-2xl font-semibold">
          Radiation Status
        </h2>

        <p>
          Current Radiation Level:
          <strong> {storm.level}</strong>
        </p>

        <p>
          Shelter Required:
          <strong>
            {storm.shelterRequired ? " YES" : " NO"}
          </strong>
        </p>
      </section>

      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-3 text-2xl font-semibold">
          Storm Events
        </h2>

        {events.length === 0 ? (
          <p>No events available.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded border p-3"
              >
                <div>
                  <strong>{event.type}</strong>
                </div>

                <div>{event.title}</div>

                <div className="text-sm text-gray-500">
                  {new Date(
                    event.startTime
                  ).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-3 text-2xl font-semibold">
          Normal Schedule
        </h2>

        <div>
          Assignments:{" "}
          {normalSchedule.assignments.length}
        </div>

        <div>
          Hard Breaks:{" "}
          {normalSchedule.hardBreaks}
        </div>

        <div>
          Penalty:{" "}
          {normalSchedule.penalty}
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-2xl font-semibold">
          Storm Replanned Schedule
        </h2>

        <div>
          Assignments:{" "}
          {stormSchedule.assignments.length}
        </div>

        <div>
          Hard Breaks:{" "}
          {stormSchedule.hardBreaks}
        </div>

        <div>
          Penalty:{" "}
          {stormSchedule.penalty}
        </div>
      </section>
    </main>
  );
}