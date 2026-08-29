/**
 * Frame — the Orikata Bio brand lockup in a solid rounded card.
 *
 * Mirrors the pitch-deck "brand close": origami mark on top → OrikataBio
 * wordmark → tagline, monochrome in the per-load palette (wisteria by
 * default, sakura under the .palette-sakura roll set in layout.tsx).
 *
 * Everything is written with `*-wisteria-N` utilities — globals.css swaps
 * those to the sakura scale under `.palette-sakura`, so the card border,
 * wordmark, and tagline all follow the random pick. The origami mark has a
 * sakura + a wisteria SVG; globals.css shows the matching one.
 *
 * (The earlier generative sumi-e brushstroke border has been retired in
 * favour of the deck's solid rounded-card chrome.)
 */
export default function Frame() {
  return (
    <main className="relative z-[2] flex max-w-[calc(100vw-24px)] flex-col items-center gap-[14px] rounded-[26px] border-[5px] border-wisteria-400 bg-rice-50 px-[42px] py-[50px] text-center shadow-[0_10px_46px_rgba(91,71,80,0.10)] sm:px-[68px] landscape:px-[112px] landscape:py-[58px] [@media(max-height:500px)]:gap-[8px] [@media(max-height:500px)]:py-[20px]">
      {/* Origami mark — palette-matched variant shown, the other hidden via globals.css */}
      <img
        src="/mark-wisteria.svg"
        alt=""
        className="mark-wisteria block h-[110px] w-auto landscape:h-[148px] [@media(max-height:500px)]:h-[90px]"
      />
      <img
        src="/mark-sakura.svg"
        alt=""
        className="mark-sakura h-[110px] w-auto landscape:h-[148px] [@media(max-height:500px)]:h-[90px]"
      />

      {/* OrikataBio wordmark — "Bio" at half size, baseline-aligned */}
      <h1 className="mt-[6px] font-brand font-medium leading-none tracking-[0.005em] text-wisteria-600 text-[clamp(38px,8vw,62px)] [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:text-[44px]">
        Orikata
        <span className="ml-[0.04em] align-baseline text-[0.5em] font-bold text-wisteria-500">
          Bio
        </span>
      </h1>

      {/* Tagline */}
      <p className="mt-[10px] font-brand font-medium text-wisteria-600 text-[clamp(15px,3.4vw,25px)] [@media(max-height:500px)]:mt-[2px] [@media(max-height:500px)]:text-[18px]">
        Mastering the art of folding proteins
      </p>
    </main>
  );
}
