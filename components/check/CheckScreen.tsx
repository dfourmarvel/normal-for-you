# BioTensor Q-Health: normal for you, normal for space

Live demo: https://normal-for-you.vercel.app (replace with the final submitted URL before judging)

Team HFm's entry for NASA Space Apps 2026, "Create Health Monitoring Software for Astronauts on Space Missions".

Every reading an astronaut takes gets three answers: normal for people (reference range or NASA limit), normal for you (own pre-flight baseline, judged with laboratory medicine's reference change value), and normal for this day of the mission. Then one next step: carry on, re-check or act.

## What is real and what is simulated

Real:

- NASA OSDR OSD-569 (Inspiration4) blood counts, shown on `/proof`. Two of the four crew changed by more than their personal reference change value the day after landing, while all 16 post-flight values stayed inside the lab's normal range.
- PhysioNet Fantasia heartbeat intervals (20 young and 20 elderly healthy adults) on `/proof/heart-rhythm`. Sample entropy, worked out in the browser: young median 1.406, elderly 1.277; young higher entropy was separated by p = 0.0074.

Simulated:

- The three test astronauts A, B and C (`lib/testCrew.ts`). They are made-up people. Day-to-day noise is sized from published within-person variation (sources below); where no figure was found, the code marks the value as estimated.
- All mock data on the other screens (`lib/mock/`, `public/data/*.json`) and the telemetry, environment and scheduler demos. Screens label this as simulated.

## Prior work

Built during the hackathon. All code in this submission was written from 14 Nov 2026 in a new repository. Before the hackathon, team members read background literature on biological variation and spaceflight immunology, looked at the public NASA OSD-569 blood-count data on 5 Nov, and built early demo screens. Ransford's concept screens under "More" started from his earlier mock-ups. The app name and the BioTensor Q-Health URL come from those earlier screens; every page served here is built from this repository. The Accra Local Lead told the team on 23 Oct that early preparation was allowed.

## Run it

```bash
npm ci
npm run dev      # development server
npm test         # vitest
npm run lint     # eslint
npm run build    # static site in out/
```

There is no server, database or login: `next.config.ts` sets `output: "export"`, so the build is a static site in `out/`.

## Sources and licences

Where a source is cited in the code, the file is given so it can be checked. Codes like "01a", "01b", "01d" in the code refer to the team's internal research notes, which are not in this repo.

### Data sets

1. NASA OSDR OSD-569, Inspiration4 complete blood count: https://osdr.nasa.gov/bio/repo/data/studies/OSD-569 (`app/proof/ProofView.tsx:19`, `lib/data/osd569.ts`). Local copy: `public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv`.
2. PhysioNet Fantasia Database v1.0.0, https://physionet.org/content/fantasia/1.0.0/ (DOI 10.13026/C2RG61), Open Data Commons Attribution License v1.0. Cite: Iyengar et al. 1996 and Goldberger et al. 2000.
3. EFLM Biological Variation Database, within-person variation (CVI) for white cells, haemoglobin, platelets and fasting glucose, read 14 Nov 2026 (`lib/data/variation.ts`, `lib/testCrew.ts`). Licensed and cited as provided by the database.
4. NASA-STD-3001 Vol 2 Rev F (2026-07-14) §6.2.1.3 (`lib/data/limits.ts:12`).
5. NASA-STD-3001 Vol 1 Rev C (2023-09-15) §4.8 (`lib/data/limits.ts:30`).
6. OCHMO-TB-004 Carbon Dioxide Rev D (10 Mar 2026) (`lib/data/limits.ts:21`).
7. NASA HRP Evidence Reports: Cardiovascular 2022, Immune 2021, Nutrition 2020, Sleep (no year in code), Behavioral 2025, Hypoxia/DCS 2024, Muscle/aerobic 2024 (`lib/data/phases.ts`).
8. NOAA solar radiation storm scale (`lib/environment/radiation.ts:4`) and the "DONKI" source tag (`lib/environment/types.ts:14`).

### Papers and guidelines

9. Coskun et al. 2022, model 2 (own variance, 5 or more results) (`lib/data/variation.ts:5`).
10. Quer et al. 2020, PLOS ONE, Fitbit resting heart rate (`lib/data/variation.ts`, `lib/testCrew.ts:36`).
11. Warren et al. 2010, Br J Gen Pract, office blood pressure (`lib/data/variation.ts`).
12. Ohasama study, JAHA 2019 (PMC6761623), home blood pressure (`lib/testCrew.ts:34`).
13. Messman et al. 2022, J Sleep Res 31(6):e13680, actigraphy (`lib/testCrew.ts`).
14. Cheuvront et al. 2004, Int J Sport Nutr Exerc Metab, body mass (`lib/testCrew.ts`).
15. Diamond et al. 2021, PLOS ONE (PMC7857558), oral temperature (`lib/testCrew.ts`).
16. EuBIVAS glucose CVI 4.7% (`lib/data/variation.ts`, glucose row).
17. Spodick 1996, South Med J (`lib/data/ranges.ts:15`).
18. RCP NEWS2 Chart 1 (2017) and BTS oxygen guideline 2017 (`lib/data/ranges.ts`).
19. ACC/AHA 2017 blood pressure guideline, kept in AHA/ACC 2025, via a CDC page reviewed 13 Oct 2026 (`lib/data/ranges.ts:24`).
20. Geneva et al. 2019, Open Forum Infect Dis; CDC fever definition (15 May 2024) (`lib/data/ranges.ts:55`).
21. ADA Standards of Care 2026, Section 2 and Section 6; WHO/IDF 2006 (`lib/data/ranges.ts:66`).
22. Watson et al. 2015, AASM/SRS consensus statement, Sleep (`lib/data/ranges.ts:75`).
23. Barger et al. 2014, Lancet Neurology (`lib/data/phases.ts`).
24. Stahn et al. 2017, Scientific Reports (`lib/data/phases.ts`).
25. Norsk et al. 2015, J Physiol (`lib/data/phases.ts`).
26. Garrett-Bakelman et al. 2019, Science (`lib/data/phases.ts`).
27. Kim et al. 2024, Nature Communications (`lib/data/phases.ts`).

Some rows in `lib/data/phases.ts` are marked "(no source found)" in the code; the app shows them that way.

### 3D anatomy model

- Écorché (https://github.com/Charleeh/ecorche), CC BY-SA 4.0, files `public/models/ecorche.glb`, `ecorche-preview.jpg` and `ecorche.structures.json`.
- Based on BodyParts3D, © The Database Center for Life Science, CC BY 4.0 (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/), and Z-Anatomy by Gauthier Kervyn, CC BY-SA 4.0 (https://www.z-anatomy.com/).
- Full credit text: `public/models/dummy-LICENSE.txt`; it is also shown in the page footer (`components/layout/AppFooter.tsx`).

### npm libraries

Licences read from `package-lock.json`:

- next, react, react-dom, recharts, vitest, tailwindcss, eslint: MIT
- @google/model-viewer, typescript: Apache-2.0
- @tailwindcss/turbopack, @types/*, eslint-config-next: checked and listed in the project dependency metadata

## Use of AI

The concept and the science choices are the team's. The lab-medicine idea (personal baseline plus reference change value) is Daniel's. SI tools were used to build and check it, not to come up with it.

Code: in Daniel's parts (the engine, the real-data proof pages, the simulated test astronauts, astronaut and scheduler screens), Claude (Anthropic) wrote most of the code under his direction and helped find and summarise sources, which we checked against the originals. Changes were checked with automated tests and an independent SI review, and the published numbers were recomputed separately. Obed (scheduler, environment and solver code) used ChatGPT for brainstorming, Gemini to check his work and GitHub Copilot for pages. Ransford (screens) used a Grok agent for the screens' visual layout and Cursor for front-end code.

Data: every number on the real-data pages comes from NASA OSDR OSD-569 or PhysioNet Fantasia, computed by our code. Values on screens marked SIMULATED are made-up demo values.

Video: the voice-over is SI-generated (ElevenLabs text-to-speech) from a script the team wrote; the video was assembled with SI assistance (Claude) from screen captures of our own app. It carries a visible watermark in every frame and the same statement in the file metadata and video description.

## Team and licence

Team HFm: dfourmarvel (Daniel), DeeCreates (Obed), DevBaba (Ransford), planet-5 (team lead).

Code is Apache 2.0 (see `LICENSE`). Third-party data and models keep their own licences, listed above.

Made by dfour (d4) and team HFm.


