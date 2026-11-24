import { useEffect, useRef } from 'react';

export function Bubbles() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      layer.current?.querySelectorAll<HTMLElement>('.glow-bubble').forEach(b => {
        const r = b.getBoundingClientRect();
        const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
        const dist = Math.hypot(dx, dy) || 1, reach = r.width / 2 + 160;
        const push = dist < reach ? (reach - dist) * 1.2 : 0;
        const [tx, ty] = (b.dataset['t'] ?? '0,0').split(',').map(Number);
        const nx = push ? (tx ?? 0) + (dx / dist) * push * 0.5 : (tx ?? 0) * 0.98, ny = push ? (ty ?? 0) + (dy / dist) * push * 0.5 : (ty ?? 0) * 0.98;
        const cx = Math.max(-300, Math.min(300, nx)), cy = Math.max(-300, Math.min(300, ny));
        b.dataset['t'] = `${cx},${cy}`; b.style.translate = `${cx}px ${cy}px`;
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return (
    <div ref={layer} className="bubble-layer" aria-hidden>
      {[1, 2, 3, 4, 5, 6].map(n => <span key={n} className={`glow-bubble bubble-${n}`} />)}
    </div>
  );
}
