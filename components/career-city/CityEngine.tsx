'use client';

import { useEffect } from 'react';

// Mounts the imperative three.js engine after hydration. The engine module is loaded with a
// dynamic import, so three.js never runs on the server and ships as its own chunk.
export default function CityEngine() {
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('@/lib/three/engine').then(({ mountCareerCity }) => {
      if (cancelled) return;
      dispose = mountCareerCity();
      // The engine shortens chapters on phones after load, which moves anchors: re-jump to the hash
      // (e.g. #contact when coming back from /roots). ?from= stays in the URL so GA can attribute the visit.
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView();
      requestAnimationFrame(() => document.documentElement.classList.remove('from-roots'));
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return null;
}
