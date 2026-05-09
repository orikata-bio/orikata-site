/**
 * Footer — pinned elements at the bottom of the viewport.
 *   left:    © 2026 orikata bio
 *   right:   info@orikata.ai mailto
 */
export default function Footer() {
  return (
    <>
      <div className="fixed left-5 landscape:left-10 bottom-9 z-[2] font-yuji font-light text-[9px] landscape:text-[11px] tracking-footer text-wisteria-600">
        © 2026 orikata bio
      </div>

      <div className="fixed right-5 landscape:right-10 bottom-9 z-[2] font-yuji font-light text-[9px] landscape:text-[11px] tracking-footer text-wisteria-600">
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
