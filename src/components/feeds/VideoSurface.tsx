import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { PlaceholderScene } from './PlaceholderScene';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Plug, X } from '@phosphor-icons/react';

export type VideoMode = 'placeholder' | 'mjpeg' | 'local';

interface Props {
  variant: 'aerial' | 'ground' | 'city';
  label?: string;
  className?: string;
  /** Optional default URL (env-provided). */
  defaultUrl?: string;
}

export function VideoSurface({ variant, label, className, defaultUrl }: Props) {
  const [mode, setMode] = useState<VideoMode>(defaultUrl ? 'mjpeg' : 'placeholder');
  const [url, setUrl] = useState(defaultUrl ?? '');
  const [draftUrl, setDraftUrl] = useState('');
  const [showInput, setShowInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mode === 'local' && videoRef.current && url) {
      videoRef.current.src = url;
      videoRef.current.play().catch(() => {});
    }
  }, [mode, url]);

  const connect = (next: string) => {
    if (!next) return;
    setUrl(next);
    setMode('mjpeg');
    setShowInput(false);
  };

  const reset = () => {
    if (mode === 'local' && url.startsWith('blob:')) URL.revokeObjectURL(url);
    setUrl('');
    setMode('placeholder');
  };

  return (
    <div className={cn('relative w-full h-full bg-canvas overflow-hidden', className)}>
      {mode === 'placeholder' && <PlaceholderScene variant={variant} label={label} />}

      {mode === 'mjpeg' && (
        <img
          src={url}
          alt={label ?? variant}
          className="w-full h-full object-cover"
          onError={() => {
            // gracefully fall back if the stream fails
            setMode('placeholder');
          }}
        />
      )}

      {mode === 'local' && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover bg-black"
        />
      )}

      {/* Connection chip — only when something is loaded */}
      {mode !== 'placeholder' && (
        <button
          onClick={reset}
          className="absolute top-3 right-3 inline-flex items-center gap-1 h-6 px-2 rounded-full glass text-2xs font-mono uppercase tracking-[0.08em] text-fg-2 hover:text-fg-1 transition-colors duration-140"
        >
          <span className="size-1.5 rounded-full bg-ok animate-breathe" />
          {mode === 'mjpeg' ? 'MJPEG' : 'LOCAL'}
          <X size={10} className="ml-1 opacity-60" />
        </button>
      )}

      {/* Connect popover */}
      {mode === 'placeholder' && (
        <div className="absolute right-3 top-3">
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full glass text-2xs font-mono uppercase tracking-[0.08em] text-fg-2 hover:text-fg-1 transition-colors duration-140"
            >
              <Plug size={10} />
              CONNECT
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1.5 rounded-md glass w-[280px]">
              <Input
                placeholder="MJPEG URL · /video_feed"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') connect(draftUrl);
                  if (e.key === 'Escape') setShowInput(false);
                }}
                className="h-7 text-xs"
                autoFocus
              />
              <Button variant="primary" size="sm" onClick={() => connect(draftUrl)}>
                连接
              </Button>
              <input
                type="file"
                accept="video/*"
                hidden
                id={`local-${variant}`}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const objUrl = URL.createObjectURL(f);
                  setUrl(objUrl);
                  setMode('local');
                  setShowInput(false);
                }}
              />
              <label
                htmlFor={`local-${variant}`}
                className="cursor-pointer h-7 px-2 inline-flex items-center rounded text-xs text-fg-3 hover:text-fg-1 hover:bg-surface-3 transition-colors duration-140"
                title="本地视频"
              >
                ⇪
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
