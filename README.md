# BioTensor Q-Health: normal for you, normal for space

Live demo: https://normal-for-you.vercel.app (confirm this is the final submitted URL before judging)

Team HFm's entry for NASA Space Apps 2026, "Create Health Monitoring Software for Astronauts on Space Missions".

The screening engine demonstration evaluates each simulated reading in three contexts: normal for people (reference range or NASA limit), normal for you (own pre-flight baseline, judged with laboratory medicine's reference change value), and normal for this mission phase (sourced phase expectations). It then applies sourced screening rules to choose whether to carry on, re-check, or act. This is not a live monitoring service or a diagnosis.

## What is real and what is simulated

Real:
- NASA OSDR OSD-569 (Inspiration4) blood counts on `/proof`. Two of four crew had changes beyond their personal reference change value the day after landing, while all 16 post-flight values were inside the lab's normal range. The page discloses a repaired shifted data row.
- PhysioNet Fantasia heartbeat intervals on `/proof/heart-rhythm`; sample-entropy calculations are shown with their limitations.

Simulated:
- The three test astronauts A, B and C (`lib/testCrew.ts`). They are made-up people. Day-to-day noise is sized from published within-person variation (sources below); where no figure was found, the code says "demo noise".
- The records in `lib/mock/` and non-proof dashboard fixtures are simulated. `public/data/` contains both the sourced datasets listed above and demo data; each screen identifies simulated inputs.

## Adaptive logic and current limits

- `lib/engine/` evaluates each reading against that astronaut's pre-flight baseline, available population ranges and limits, sourced biological-variation data, and mission phase. Missing evidence is reported as unknown rather than normal.
- The personal baseline is intentionally not recalculated during flight: continually moving it could absorb a gradual adverse change into the definition of normal. In-flight history is still used to check consecutive changes and summarize trends.
- Regional combined drift is an experimental heuristic: an adverse change of at least half an individual reference-change value is counted, and three such indicators raise a regional watch. This joint threshold is not validated for flight medicine and must not be interpreted as a clinical risk score.
- Forecasts, Recommendations, Health Analysis, and Biological State do not generate projections, actions, or state estimates. Available time series and crew/environment records are fixed demo fixtures, not a live, longitudinal data feed; no validated forecasting, intervention-effect, or state-estimation model is included.
- Mission and crew views withhold demo profile findings and data-quality scores. Environment and scenario pages show only preset tabletop inputs and hypothetical solver outputs; they do not represent live monitoring or operational recommendations.

## Prior work

Built during the hackathon. All code in this submission was written from 14 Nov 2026 in a new repository. Before the hackathon, team members read background literature, viewed public NASA OSD-569 data on 5 Nov, and created early demo screens. Ransford's concept screens under “More” started from earlier mock-ups. The app name and URL derive from earlier screens. Confirm the factual details and whether any code was reused before submitting this paragraph.

## Run it

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

This is a static export (`output: "export"`) with no server, database or login.

## Sources and licences

See citations in the source files and `LICENSE`. NASA OSDR OSD-569: https://osdr.nasa.gov/bio/repo/data/studies/OSD-569. PhysioNet Fantasia: https://physionet.org/content/fantasia/1.0.0/. EFLM Biological Variation Database: https://biologicalvariation.eu/. NASA standards and evidence reports are cited in `lib/data/`.

The repository's code is Apache-2.0. Third-party sources and assets retain their own terms; verify and document the specific terms for datasets, model assets, media, and dependencies before submission.

## Use of AI

The concept and the science choices are the team's. The lab-medicine idea (personal baseline plus reference change value) is Daniel's. In Daniel's parts (the engine, the real-data proof pages, the simulated test astronauts, the astronaut screen and the scheduler screen), Claude (Anthropic) wrote most of the code under his direction and helped find and summarise sources, which were then checked. Changes were checked with automated tests and independent AI review, and the published numbers were recomputed separately. Numbers on the proof pages are derived from cited source data; numeric values on simulated screens come from explicit demo fixtures and are not astronaut measurements. AI-made content carries no NASA logos or mission identifiers.

Every claim about specific tool use should be confirmed by the relevant teammate before submission. The demo video uses AI-generated voice-over and AI-assisted assembly; disclose this in the video metadata and host description as well as here.

Teammates, in their own words (15 Nov):

- Obed (DeeCreates; scheduler, environment and solver code): ChatGPT for brainstorming, Gemini for validation, GitHub Copilot for pages.
- Ransford (DevBaba; screens): Grok agent for the UI design, Cursor for the frontend.

- planet-5:
  - **Corrected:** Removed unsupported mission risk cues and fabricated crew-status counts. Withheld fixed forecasts, recommendations, health and biological-state analytics, fictional crew findings, and countermeasures where they were not derived from individual observations or validated models. This prevents simulated outputs from being mistaken for operational assessments.
  - **Corrected:** Changed environmental screening to report missing reference criteria as unknown and to distinguish missing criteria from an invalid reading. This prevents an unsupported normal status and directs users toward the appropriate data correction.
  - **Added:** Clear descriptions of simulated environmental and scenario inputs, unavailable capabilities, and the unvalidated combined-drift heuristic. These disclosures make the evidence and limitations visible while retaining access to the existing personal-baseline demonstration and real-data proof pages. (With Microsoft365 Copilot and VS Code Copilot assistance)

## Team

Team HFm: dfourmarvel (Daniel), DeeCreates (Obed), DevBaba (Ransford), planet-5 (team lead).
