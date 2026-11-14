# Parse WFDB (MIT format) beat annotations -> normal-to-normal (NN) intervals in ms.
import sys, os, json, re
raw, out = sys.argv[1], sys.argv[2]
BEATS = {1,2,3,4,5,6,7,8,9,10,11,12,13,25,30,34,35,38,41}
def parse(path):
    b = open(path, 'rb').read(); i = 0; t = 0; anns = []
    while i + 1 < len(b):
        w = b[i] | (b[i+1] << 8); i += 2
        a, inc = w >> 10, w & 0x3FF
        if a == 0 and inc == 0: break
        if a == 59:  # SKIP: 32-bit interval, PDP-11 order
            hi = b[i] | (b[i+1] << 8); lo = b[i+2] | (b[i+3] << 8); i += 4
            v = (hi << 16) | lo
            if v >= 2**31: v -= 2**32
            t += v; continue
        if a in (60, 61, 62): continue
        if a == 63: i += inc + (inc & 1); continue
        t += inc; anns.append((t, a))
    return anns
recs = []
for f in sorted(os.listdir(raw)):
    if not f.endswith('.hea'): continue
    rid = f[:-4]
    hea = open(os.path.join(raw, f), encoding='utf-8').read()
    fs = float(hea.split()[2])
    m = re.search(r'Age:\s*(\d+)\s+Sex:\s*([MF])', hea)
    beats = [(t, a) for t, a in parse(os.path.join(raw, rid + '.ecg')) if a in BEATS]
    nn, dropped = [], 0
    for (t0, a0), (t1, a1) in zip(beats, beats[1:]):
        ms = (t1 - t0) * 1000 / fs
        if a0 == 1 and a1 == 1 and 300 <= ms <= 2000: nn.append(round(ms))
        else: dropped += 1
    recs.append({"id": rid, "group": "elderly" if rid[2] == 'o' else "young", "age": int(m[1]) if m else None, "sex": m[2] if m else None, "beats": len(beats), "dropped": dropped, "nn": nn})
# Same wrapper object as public/data/fantasia-nn.json: lib/data/fantasia.ts parseFantasia rejects a bare list.
META = {
  "source": "PhysioNet Fantasia Database v1.0.0, https://physionet.org/content/fantasia/1.0.0/ (DOI 10.13026/C2RG61)",
  "licence": "Open Data Commons Attribution License v1.0",
  "cite": "Iyengar N, Peng C-K, Morin R, Goldberger AL, Lipsitz LA. Age-related alterations in the fractal scaling of cardiac interbeat interval dynamics. Am J Physiol 1996;271:R1078-R1084. Goldberger AL et al. PhysioBank, PhysioToolkit, and PhysioNet. Circulation 2000;101(23):e215-e220.",
  "method": "Beat annotations (.ecg, 250 Hz) converted to normal-to-normal intervals: consecutive beats both labelled N, interval 300-2000 ms kept, rounded to whole ms. Converter: scripts/fantasia-convert.py."
}
json.dump({**META, "records": recs}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for r in recs: print(r["id"], r["age"], r["sex"], r["beats"], len(r["nn"]), r["dropped"])
