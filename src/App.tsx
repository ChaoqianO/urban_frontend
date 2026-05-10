import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AerialFeed } from '@/components/feeds/AerialFeed';
import { GroundFeed } from '@/components/feeds/GroundFeed';
import { CityBirdView } from '@/components/feeds/CityBirdView';
import { FleetStatus } from '@/components/system/FleetStatus';
import { Telemetry } from '@/components/system/Telemetry';
import { EventLog } from '@/components/system/EventLog';
import { CommandPanel } from '@/components/command/CommandPanel';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';
import { useBridge } from '@/hooks/useBridge';

export default function App() {
  useBridge();

  return (
    <ErrorBoundary>
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
            <EventLog />
            <CommandPanel />
          </section>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
