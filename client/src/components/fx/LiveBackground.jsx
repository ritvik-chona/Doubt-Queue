import { useEffect, useRef } from 'react';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Full-screen animated backdrop shared by every page:
// drifting aurora glows, a grid revealed around the cursor, a soft cursor glow,
// and a canvas "constellation" of points that link to each other and to the cursor.
// Purely decorative; sits behind all content and never takes pointer events.
export default function LiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = prefersReducedMotion();
    const mouse = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let points = [];
    let frame = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(85, Math.floor((width * height) / 17000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.3 + 0.5,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const p of points) {
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          // Gentle pull toward the cursor.
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          if (dx * dx + dy * dy < 180 * 180) {
            p.x += dx * 0.0025;
            p.y += dy * 0.0025;
          }
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 115) {
            ctx.strokeStyle = `rgba(165, 180, 252, ${(1 - dist / 115) * 0.16})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const toMouse = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (toMouse < 170) {
          ctx.strokeStyle = `rgba(165, 180, 252, ${(1 - toMouse / 170) * 0.45})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = toMouse < 170 ? 'rgba(199, 210, 254, 0.9)' : 'rgba(165, 180, 252, 0.45)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce && !document.hidden) frame = requestAnimationFrame(draw);
    }

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) draw();
    };
    const onResize = () => {
      resize();
      if (reduce) draw();
    };

    resize();
    draw();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Aurora glows */}
      <div className="animate-aurora absolute -top-1/4 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-accent/25 blur-[120px]" />
      <div className="animate-aurora absolute -right-1/4 -bottom-1/3 h-[60vmax] w-[60vmax] rounded-full bg-emerald-500/12 blur-[120px] [animation-delay:-6s]" />
      <div className="animate-aurora absolute top-1/3 left-1/2 h-[40vmax] w-[40vmax] rounded-full bg-sky-500/10 blur-[110px] [animation-delay:-12s]" />

      {/* Faint grid everywhere, brighter around the cursor */}
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div
        className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(165_180_252/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(165_180_252/0.12)_1px,transparent_1px)] [background-size:40px_40px]"
        style={{
          maskImage: 'radial-gradient(220px circle at var(--cursor-x, -999px) var(--cursor-y, -999px), #000, transparent)',
          WebkitMaskImage:
            'radial-gradient(220px circle at var(--cursor-x, -999px) var(--cursor-y, -999px), #000, transparent)',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Soft light that follows the cursor */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(600px circle at var(--cursor-x, -999px) var(--cursor-y, -999px), rgb(79 70 229 / 0.10), transparent 60%)',
        }}
      />

      {/* Vignette keeps content readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(11_14_20/0.75))]" />
    </div>
  );
}
