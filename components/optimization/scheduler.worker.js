// Runs the solvers off the main thread so the page stays responsive while they work.
// Plain JS on purpose: Next copies the raw worker source into out/, and a .ts copy there breaks the next tsc run.
import { runJob } from "./realSchedule";

self.onmessage = (e) => {
  const { runId, job } = e.data;
  self.postMessage({ runId, job, result: runJob(job) });
};
