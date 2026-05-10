import { Panel } from '@/components/primitives/Panel';
import { Stat } from '@/components/primitives/Stat';
import { Button } from '@/components/primitives/Button';
import { useMockStore } from '@/store/useMockStore';
import { PlaceholderScene } from './PlaceholderScene';
import { CornersOut } from '@phosphor-icons/react';

export function AerialFeed() {
  const uav = useMockStore((s) => s.uav);

  return (
    <Panel
      tag="AERIAL"
      title="无人机视角"
      subtitle={uav.id}
      state="live"
      collapsible
      actions={
        <Button variant="ghost" size="sm" aria-label="全屏">
          <CornersOut size={12} />
        </Button>
      }
      bodyClassName="flex flex-col"
      className="flex-1 min-h-0"
    >
      <div className="relative flex-1 min-h-0">
        <PlaceholderScene variant="aerial" label={uav.id} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas/95 to-transparent" />
      </div>
      <div className="grid grid-cols-4 gap-3 px-4 py-3 border-t border-hairline">
        <Stat label="ALT" value={uav.altitude.toFixed(1)} unit="m" size="sm" />
        <Stat label="SPD" value={uav.speed.toFixed(1)} unit="km/h" size="sm" />
        <Stat
          label="BAT"
          value={uav.battery.toFixed(0)}
          unit="%"
          size="sm"
          tone={uav.battery < 25 ? 'warn' : 'default'}
        />
        <Stat
          label="LINK"
          value={uav.link.latency.toFixed(0)}
          unit="ms"
          size="sm"
          tone={uav.link.latency > 40 ? 'warn' : 'ok'}
        />
      </div>
    </Panel>
  );
}
