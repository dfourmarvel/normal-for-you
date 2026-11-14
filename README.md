# Normal for you, normal for space

Team HFm's entry for NASA Space Apps 2026, "Create Health Monitoring Software for Astronauts on Space Missions".

Every reading an astronaut takes gets three answers: normal for people (reference range or NASA limit), normal for you (own pre-flight baseline, judged with laboratory medicine's reference change value), and normal for this day of the mission (expected change for the mission phase). Then one next step: carry on, re-check, or act.

Screening, not a diagnosis.

## Run it

```bash
npm install
npm run dev
```

`npm run build` produces a static site in `out/`. There is no server, database or login.

## Working in this repo

- Agree the split in the group first (team spec, section 13).
- Work on your own branch (`yourname/piece`) and open small pull requests.
- Only edit your own folders. Ask in the group before changing `lib/types.ts` or `package.json`.
- Build screens against `lib/mock/` until `lib/engine/` lands.
- Every number on screen is computed by the app or read from a table row with a source. Nothing typed in.
- Test data is labelled "simulated" on every screen. No real mission names, no NASA logos.

## Data and sources

- NASA OSDR OSD-569, Inspiration4 complete blood count (`public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv`): https://osdr.nasa.gov/bio/repo/data/studies/OSD-569
- Full source list: to be completed before submission.

## Use of AI

To be completed before submission. Each team member lists the AI tools they used and for what.

## Licence

Apache 2.0, see `LICENSE`. Third-party data keeps its own terms.
