import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AerialFeed } from '@/components/feeds/AerialFeed';
import { GroundFeed } from '@/components/feeds/GroundFeed';
import { CityBirdView } from '@/components/feeds/CityBirdView';
import { FleetStatus } from '@/components/system/FleetStatus';
import { Telemetry } from '@/components/system/Telemetry';
import { CommandPanel } from '@/components/command/CommandPanel';
import { useMockStore } from '@/store/useMockStore';

export default function App() {
  const tick = useMockStore((s) => s.tick);
  useEffect(() => {
    const id = setInterval(tick, 800);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas bg-grain">
      <Header />
      <main
        className="flex-1 min-h-0 grid gap-2 p-2"
        style={{ gridTemplateColumns: '22% 1fr 22%' }}
      >
        <section className="flex flex-col gap-2 min-h-0">
          <AerialFeed />
          <GroundFeed />
        </section>

        <section className="min-h-0 flex flex-col gap-2">
          <CityBirdView />
        </section>

        <section className="flex flex-col gap-2 min-h-0">
          <FleetStatus />
          <Telemetry />
          <CommandPanel />
        </section>
      </main>
      <Footer />
    </div>
  );
}
