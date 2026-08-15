import React, { useEffect, useRef, useCallback } from 'react';
import createGlobe, { COBEOptions } from 'cobe';

/* ─────────────────────────────────────────────────────────
   Half-Globe component.
   Renders only the top hemisphere (dome) by making the
   canvas twice as tall as the visible container, then
   clipping the bottom half via overflow:hidden on the
   wrapper. This gives the exact flat-bottom dome look
   from the Cloudflare / Magic UI "half · labels" reference.
───────────────────────────────────────────────────────── */

interface GlobeProps {
  className?: string;
  config?: Partial<COBEOptions>;
}

export const Globe: React.FC<GlobeProps> = ({ className = '', config = {} }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const pointerInteracting = useRef<number | null>(null);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? 'grabbing' : 'grab';
    }
  };

  const updateMovement = useCallback((clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteracting.current = clientX;
      phiRef.current += delta / 400;
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Globe diameter = container width so hemisphere fills the box
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const size = containerWidth * pixelRatio;

    const mergedConfig: COBEOptions = {
      width: size,
      height: size,
      devicePixelRatio: pixelRatio,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.0,
      mapSamples: 24000,
      mapBrightness: 2.8,
      baseColor: [0.15, 0.17, 0.2],
      markerColor: [0.75, 0.95, 0.0],
      glowColor: [0.08, 0.1, 0.02],
      markers: [
        { location: [40.7128, -74.006], size: 0.06 },
        { location: [37.7749, -122.4194], size: 0.06 },
        { location: [51.5074, -0.1278], size: 0.05 },
        { location: [35.6762, 139.6503], size: 0.06 },
        { location: [1.3521, 103.8198], size: 0.04 },
        { location: [19.076, 72.8777], size: 0.06 },
        { location: [-33.8688, 151.2093], size: 0.04 },
        { location: [52.52, 13.405], size: 0.05 },
        { location: [48.8566, 2.3522], size: 0.04 },
        { location: [-23.5505, -46.6333], size: 0.05 },
      ],
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phiRef.current += 0.003;
        }
        state.phi = phiRef.current;
      },
      ...config,
    };

    const globe = createGlobe(canvasRef.current, mergedConfig);

    // Fade in
    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = '1';
    }, 100);

    return () => globe.destroy();
  }, [config]);

  return (
    /* Outer wrapper: visible height = half the globe diameter.
       overflow:hidden clips the bottom hemisphere.
       This gives us the exact flat-bottom dome. */
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio: '2 / 1' }} /* width:height = 2:1 for a half-circle */
    >
      {/* Canvas is a full circle (aspect 1:1) placed so its
          top half is visible and bottom half is clipped. */}
      <canvas
        ref={canvasRef}
        className="opacity-0 transition-opacity duration-700 cursor-grab"
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '1 / 1', /* full sphere */
        }}
        onPointerDown={(e) => updatePointerInteraction(e.clientX)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  );
};
