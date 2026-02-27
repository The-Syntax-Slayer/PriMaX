import { useEffect, useRef } from 'react';

/**
 * ParticleCanvas — Pure canvas-based particles with optional networking lines.
 *
 * Props:
 *   count       – number of particles (default 80)
 *   networking  – whether to draw connection lines between close particles (default true)
 *   color       – base hex color string like '#7c3aed' (default '#7c3aed')
 *   speed       – movement speed multiplier (default 1)
 *   maxDist     – max link distance in px (default 140)
 *   size        – max particle radius (default 1.8)
 *   opacity     – canvas opacity (default 1)
 *   style       – extra style object applied to the canvas wrapper div
 */
export default function ParticleCanvas({
    count = 80,
    networking = true,
    color = '#7c3aed',
    accent = '#00e5ff',
    speed = 1,
    maxDist = 140,
    size = 1.8,
    opacity = 1,
    style = {},
}) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Parse hex to rgb
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };
        const c1 = hexToRgb(color);
        const c2 = hexToRgb(accent);

        let W = canvas.offsetWidth;
        let H = canvas.offsetHeight;
        canvas.width = W;
        canvas.height = H;

        const resize = () => {
            W = canvas.offsetWidth;
            H = canvas.offsetHeight;
            canvas.width = W;
            canvas.height = H;
        };
        window.addEventListener('resize', resize);

        // Create particles
        const particles = Array.from({ length: count }, (_, i) => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.5 * speed,
            vy: (Math.random() - 0.5) * 0.5 * speed,
            r: Math.random() * size + 0.6,
            // alternate between two colors for visual richness
            useAccent: i % 3 === 0,
            pulse: Math.random() * Math.PI * 2, // phase for twinkling
        }));

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            // Update + draw particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.025;
                if (p.x < 0) p.x = W;
                if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H;
                if (p.y > H) p.y = 0;

                const pulseFactor = 0.7 + 0.3 * Math.sin(p.pulse);
                const rgb = p.useAccent ? c2 : c1;
                const alpha = pulseFactor * 0.75;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * pulseFactor, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
                ctx.fill();

                // Glow
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                grd.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.15 * pulseFactor})`);
                grd.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
            });

            // Draw network lines
            if (networking) {
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const a = particles[i];
                        const b = particles[j];
                        const dx = a.x - b.x;
                        const dy = a.y - b.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < maxDist) {
                            const lineOpacity = (1 - dist / maxDist) * 0.35;
                            const rgb = a.useAccent ? c2 : c1;
                            ctx.beginPath();
                            ctx.moveTo(a.x, a.y);
                            ctx.lineTo(b.x, b.y);
                            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${lineOpacity})`;
                            ctx.lineWidth = 0.7;
                            ctx.stroke();
                        }
                    }
                }
            }

            animRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [count, networking, color, accent, speed, maxDist, size]);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity, pointerEvents: 'none', ...style }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
}
