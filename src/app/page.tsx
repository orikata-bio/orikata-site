import PetalCanvas from "@/components/PetalCanvas";
import Frame from "@/components/Frame";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
      <PetalCanvas />
      <Frame />
      <Footer />
    </div>
  );
}
