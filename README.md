# BioTensor Q-Health: normal for you, normal for space

Live demo: https://normal-for-you.vercel.app (confirm this is the final submitted URL before judging)

Team HFm's entry for NASA Space Apps 2026, "Create Health Monitoring Software for Astronauts on Space Missions".

Every reading gets three answers: normal for people, normal for you, and normal for this day of the mission. Then one next step: carry on, re-check or act. This is screening, not diagnosis.

## What is real and what is simulated

Real:
- NASA OSDR OSD-569 (Inspiration4) blood counts on `/proof`. Two of four crew had changes beyond their personal reference change value the day after landing, while all 16 post-flight values were inside the lab's normal range. The page discloses a repaired shifted data row.
- PhysioNet Fantasia heartbeat intervals on `/proof/heart-rhythm`; sample-entropy calculations are shown with their limitations.

Simulated:
- Test astronauts A, B and C in `lib/testCrew.ts` are made-up people.
- Other telemetry, environment and scheduler demonstrations use simulated values, labelled in the app.

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

The team's concept and science choices are human-authored. Daniel proposed applying personal baselines and laboratory medicine's reference change value. SI tools assisted with code, source discovery and checking. Every claim about specific tool use should be confirmed by the relevant teammate before submission. The demo video uses AI-generated voice-over and AI-assisted assembly; disclose this in the video metadata and host description as well as here.

## Team

Team HFm: dfourmarvel (Daniel), DeeCreates (Obed), DevBaba (Ransford), planet-5 (team lead).
