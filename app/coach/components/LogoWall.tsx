// A press-strip of university wordmarks that scrolls gently. We render clean
// serif wordmarks with monogram crests rather than trademarked logo files —
// it keeps the editorial look and avoids shipping copyrighted assets.

const SCHOOLS: { mark: string; name: string }[] = [
  { mark: "MIT", name: "MIT" },
  { mark: "S", name: "Stanford" },
  { mark: "H", name: "Harvard" },
  { mark: "Ox", name: "Oxford" },
  { mark: "Ca", name: "Cambridge" },
  { mark: "IC", name: "Imperial" },
  { mark: "UCL", name: "UCL" },
  { mark: "T", name: "Toronto" },
  { mark: "UBC", name: "UBC" },
  { mark: "McG", name: "McGill" },
  { mark: "NYU", name: "NYU" },
  { mark: "W", name: "Waterloo" },
];

function Crest({ mark, name }: { mark: string; name: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-7">
      <span className="font-display flex h-9 w-9 items-center justify-center rounded-full border border-sand-deep bg-surface text-[11px] font-bold text-sage-deep shadow-soft">
        {mark}
      </span>
      <span className="font-display whitespace-nowrap text-lg font-semibold tracking-tight text-cocoa">
        {name}
      </span>
    </div>
  );
}

export default function LogoWall() {
  return (
    <div className="relative overflow-hidden">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-cream to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-cream to-transparent" />

      <div className="coach-marquee flex w-max items-center py-2">
        {/* Two identical copies for a seamless -50% loop */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {SCHOOLS.map((s) => (
              <Crest key={`${copy}-${s.name}`} {...s} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
