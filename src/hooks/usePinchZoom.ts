import { useCallback, useRef } from 'react';

function touchDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

interface PinchState {
  active: boolean;
  startDistance: number;
  startZoom: number;
}

/**
 * Pinch-to-zoom on touch devices; calls onZoom when scale changes.
 */
export function usePinchZoom(
  getZoom: () => number,
  onZoom: (scale: number) => void,
) {
  const pinch = useRef<PinchState>({
    active: false,
    startDistance: 0,
    startZoom: 1,
  });

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.current = {
          active: true,
          startDistance: touchDistance(e.touches[0], e.touches[1]),
          startZoom: getZoom(),
        };
      }
    },
    [getZoom],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pinch.current.active || e.touches.length < 2) return;
      e.preventDefault();
      const distance = touchDistance(e.touches[0], e.touches[1]);
      if (pinch.current.startDistance <= 0) return;
      const ratio = distance / pinch.current.startDistance;
      onZoom(pinch.current.startZoom * ratio);
    },
    [onZoom],
  );

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinch.current.active = false;
    }
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
