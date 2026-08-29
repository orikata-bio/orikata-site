/**
 * Footer — pinned elements at the bottom of the viewport.
 *   left:    Orikata Bio attribution and Megure Labs link
 *   right:   info@orikata.ai mailto
 */
export default function Footer() {
  return (
    <>
      <div className="orikata-footer-brand fixed bottom-9 left-5 z-[2] flex flex-col whitespace-nowrap font-brand text-[9px] font-light leading-[1.45] tracking-footer text-wisteria-600 landscape:left-10 landscape:text-[11px]">
        <span>© Orikata Bio 2026</span>
        <a
          href="https://megure.ai"
          className="text-wisteria-600 no-underline transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-wisteria-700"
        >
          by Megure Labs
        </a>
      </div>

      <div className="orikata-footer-contact fixed bottom-9 right-5 z-[2] font-brand text-[9px] font-light tracking-footer text-wisteria-600 landscape:right-10 landscape:text-[11px]">
        <a
          href="mailto:info@orikata.ai"
          className="text-wisteria-600 no-underline transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-wisteria-700"
        >
          info@orikata.ai
        </a>
      </div>
    </>
  );
}
