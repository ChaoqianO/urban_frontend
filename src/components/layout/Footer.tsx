import { useMockStore } from '@/store/useMockStore';
import { ArrowUp, ArrowDown, ShieldCheck } from '@phosphor-icons/react';

export function Footer() {
  const net = useMockStore((s) => s.system.net);

  return (
    <footer className="h-7 shrink-0 px-6 flex items-center justify-between border-t border-hairline text-2xs text-fg-3 font-mono uppercase tracking-[0.08em]">
      <div className="flex items-center gap-4">
        <span>UE4 · PIXEL STREAMING</span>
        <span className="text-fg-4">/</span>
        <span>WEBRTC READY</span>
        <span className="text-fg-4">/</span>
        <span>ENGINE v0.1.0</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <ArrowUp size={10} weight="bold" className="text-ok" />
          <span className="tnum text-fg-2">1.2 Gbps</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowDown size={10} weight="bold" className="text-accent" />
          <span className="tnum text-fg-2">748 Mbps</span>
        </span>
        <span className="text-fg-4">·</span>
        <span className="tnum text-fg-3">net {net.toFixed(0)}%</span>
      </div>

      <div className="flex items-center gap-4">
        <span>WGS-84</span>
        <span className="text-fg-4">/</span>
        <span>LOD-5</span>
        <span className="text-fg-4">/</span>
        <span className="flex items-center gap-1.5 text-ok">
          <ShieldCheck size={11} weight="duotone" />
          SAFE MODE
        </span>
      </div>
    </footer>
  );
}
