import PetalCanvas from "@/components/PetalCanvas";
import Frame from "@/components/Frame";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    /*
     * The bottom padding reserves vertical space for the fixed Footer so:
     *   1. The Frame doesn't extend into the Footer's y-region (overlap fix)
     *   2. The Frame's geometric center sits slightly above the viewport's
     *      geometric center, which puts the *visual* center of the whole
     *      composition (Frame + Footer mass at bottom) at the geometric
     *      midpoint. Without this, the Frame is centered but the Footer
     *      tilts the perceived weight down and the title card reads as
     *      sitting too high.
     *
     * Portrait gets more padding because the Frame is taller in portrait
     * (stacked wordmark + 3-line tagline) and the smaller viewport leaves
     * less margin for error.
     */
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden portrait:pb-20 landscape:pb-12">
      <PetalCanvas />
      <Frame />
      <Footer />
    </div>
  );
}
