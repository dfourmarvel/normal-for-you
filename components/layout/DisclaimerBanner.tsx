export function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-[14px] bg-[#EAF2F8] text-[#3A5F7A] px-4 py-3 mb-5 text-[12.5px] leading-relaxed"
    >
      <span aria-hidden className="text-base leading-none mt-0.5">ℹ️</span>
      <div>
        <strong className="font-semibold">Experimental decision-support.</strong>{" "}
        BioTensor Q-Health is not a clinically validated diagnostic, not autonomous spacecraft
        control, and not a replacement for NASA medical personnel. Biological Entropy Index is{" "}
        <strong className="font-semibold">experimental</strong>.{" "}
        <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-primary-soft text-primary font-semibold text-[10px] tracking-wide align-middle">
          SIMULATED DATA
        </span>
      </div>
    </div>
  );
}
