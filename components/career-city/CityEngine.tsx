'use client';

import { useEffect } from 'react';

// Mounts the imperative three.js engine after hydration. The engine module is loaded with a
// dynamic import, so three.js never runs on the server and ships as its own chunk.
export default function CityEngine() {
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('@/lib/three/engine').then(({ mountCareerCity }) => {
      if (!cancelled) dispose = mountCareerCity();
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return null;
}
