import { Panel } from '@/components/primitives/Panel';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { NumberFlow } from '@/components/primitives/NumberFlow';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { VideoSurface } from './VideoSurface';
import { CornersOut, Compass } from '@phosphor-icons/react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useFullscreen } from '@/hooks/useFullscreen';

const layers = ['Vehicles', 'Pedestrians', 'Signals', 'Heatmap'] as const;
type Layer = (typeof layers)[number];

const DEFAULT_URL = import.meta.env.VITE_CITY_FEED_URL ?? '';

export function CityBirdView() {
  const city = useTelemetryStore((s) => s.city);
  const [active, setActive] = useState<Layer[]>(['Vehicles', 'Signals']);
  const { toggle: toggleFs } = useFullscreen();

  const toggle = (l: Layer) =>
    setActive((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));

  return (
    <Panel
      id="panel-city"
      tag="MAP-3D"
      title="3D 鸟瞰图"
      subtitle="城市数字孪生"
      state="live"
      variant="feature"
      actions={
        <>
          <Badge tone="accent">UE4 PIXEL STREAM</Badge>
          <Button
            variant="ghost"
            size="sm"
            aria-label="全屏"
            onClick={() => toggleFs('panel-city')}
          >
            <CornersOut size={12} />
          </Button>
        </>
      }
      className="flex-1 min-h-0"
      bodyClassName="relative"
    >
      <div className="absolute inset-0">
        <VideoSurface variant="city" defaultUrl={DEFAULT_URL} />
      </div>

      {/* layer chips */}
      <div className="absolute top-4 right-32 flex gap-1">
        {layers.map((l) => {
          const on = active.includes(l);
          return (
            <button
              key={l}
              onClick={() => toggle(l)}
              className={cn(
                'h-6 px-2 rounded-full font-mono text-2xs uppercase tracking-[0.08em] transition-all duration-140 ease-spring',
                on
                  ? 'bg-accent/12 text-accent border border-accent/30'
                  : 'bg-surface-2/60 text-fg-3 border border-hairline hover:text-fg-1',
              )}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* compass */}
      <div className="absolute top-4 left-4 size-10 glass rounded-full flex items-center justify-center">
        <Compass size={20} weight="duotone" className="text-fg-2" />
      </div>

      {/* mini map */}
      <div className="absolute left-4 bottom-16 w-40 h-40 glass rounded-md p-2">
        <div className="w-full h-full relative bg-canvas/60 rounded-sm overflow-hidden">
          <svg viewBox="0 0 160 160" className="w-full h-full">
            <defs>
              <pattern id="mini-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="rgb(255 255 255 / 0.06)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="160" height="160" fill="url(#mini-grid)" />
            <circle cx="60" cy="80" r="3" fill="rgb(184 148 108)" />
            <circle cx="60" cy="80" r="6" fill="rgb(184 148 108 / 0.18)" />
            <circle cx="100" cy="100" r="3" fill="rgb(174 168 158)" />
            <path
              d="M 60 80 Q 80 70 100 100"
              fill="none"
              stroke="rgb(255 255 255 / 0.16)"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
          </svg>
          <span className="absolute top-1.5 left-1.5 font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
            MINI
          </span>
        </div>
      </div>

      {/* bottom data strip */}
      <div className="absolute inset-x-0 bottom-0 px-6 py-3 bg-gradient-to-t from-canvas via-canvas/90 to-transparent flex items-center gap-8 font-mono">
        <div className="flex items-baseline gap-2">
          <span className="text-2xs uppercase text-fg-3 tracking-[0.08em]">Vehicles</span>
          <span className="text-base text-fg-1 tnum">
            <NumberFlow value={city.vehicles} />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xs uppercase text-fg-3 tracking-[0.08em]">Pedestrians</span>
          <span className="text-base text-fg-1 tnum">
            <NumberFlow value={city.pedestrians} />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xs uppercase text-fg-3 tracking-[0.08em]">AQI</span>
          <span className="text-base text-ok tnum">{city.aqi}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xs uppercase text-fg-3 tracking-[0.08em]">Alerts</span>
          <span className="text-base text-warn tnum">{city.alerts}</span>
        </div>
        <div className="ml-auto text-2xs uppercase tracking-[0.08em] text-fg-3">
          31.2304° N · 121.4737° E
        </div>
      </div>
    </Panel>
  );
}
