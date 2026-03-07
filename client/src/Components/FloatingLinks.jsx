import { useEffect, useRef } from 'react';

/* ── Sample URL strings to float around ── */
const LINK_TEXTS = [
    'web.dev/docs',
    'link.xyz/content',
    'social.media/user',
    'api.service.com',
    'blog.io/post/42',
    'website.io/article/123',
    'example.com/redirect',
    'cloud.store/files',
    'data.portal/v2/api',
    'shop.co/deals',
    'news.daily.com/top',
    'music.stream/play',
    'dev.hub/projects',
    'code.repo/main',
    'photo.gallery/new',
    'travel.guide/explore',
    'edu.learn/courses',
    'health.app/track',
    'finance.io/markets',
    'game.zone/scores',
];

const LINK_COUNT = 20;
const BASE_SPEED = 0.6;
const GRAVITY_RADIUS = 160;
const GRAVITY_STRENGTH = 9000;
const CONSUME_RADIUS = 22;
const FONT_SIZE = 14;
const FONT = `600 ${FONT_SIZE}px 'Inter', system-ui, sans-serif`;

/* ── Portal constants ── */
const PORTAL_BASE_RADIUS = 10;
const PORTAL_MAX_RADIUS = 20;
const PORTAL_SPARK_COUNT = 60;
const PORTAL_RING_COUNT = 3;

/* ── Helper: measure text dimensions (cached) ── */
const textSizeCache = {};
function measureText(ctx, text) {
    if (textSizeCache[text]) return textSizeCache[text];
    ctx.font = FONT;
    const m = ctx.measureText(text);
    const w = m.width;
    const h = FONT_SIZE;
    textSizeCache[text] = { w, h };
    return { w, h };
}

/* ── Create a single link object ── */
function createLink(ctx, canvasW, canvasH, fromEdge = false) {
    const text = LINK_TEXTS[Math.floor(Math.random() * LINK_TEXTS.length)];
    const { w, h } = measureText(ctx, text);
    const angle = Math.random() * Math.PI * 2;
    const speed = BASE_SPEED + Math.random() * 0.4;

    let x, y;
    if (fromEdge) {
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: x = Math.random() * canvasW; y = -h; break;
            case 1: x = canvasW + w; y = Math.random() * canvasH; break;
            case 2: x = Math.random() * canvasW; y = canvasH + h; break;
            default: x = -w; y = Math.random() * canvasH; break;
        }
    } else {
        x = w + Math.random() * (canvasW - w * 2);
        y = h + Math.random() * (canvasH - h * 2);
    }

    return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: (Math.random() - 0.5) * Math.PI * 0.5,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        text, w, h,
        opacity: 0.12 + Math.random() * 0.12,
        scale: fromEdge ? 0.01 : 1,
        consuming: false,
    };
}

/* ── AABB collision check ── */
function linksOverlap(a, b) {
    const pad = 4;
    return (
        a.x - pad < b.x + b.w + pad &&
        a.x + a.w + pad > b.x - pad &&
        a.y - pad < b.y + b.h + pad &&
        a.y + a.h + pad > b.y - pad
    );
}

export default function FloatingLinks() {
    const canvasRef = useRef(null);
    const linksRef = useRef([]);
    const mouseRef = useRef({ x: -9999, y: -9999, active: false });
    const rafRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        /* ── Resize ── */
        function resize() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        /* ── Initialize links ── */
        ctx.font = FONT;
        linksRef.current = [];
        for (let i = 0; i < LINK_COUNT; i++) {
            linksRef.current.push(createLink(ctx, window.innerWidth, window.innerHeight));
        }

        /* ── Mouse tracking ── */
        function onMouseMove(e) {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
            mouseRef.current.active = true;
        }
        function onMouseLeave() {
            mouseRef.current.active = false;
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);

        /* ── Draw the Doctor Strange portal ── */
        function drawPortal(ctx, mx, my, intensity, time) {
            const radius = PORTAL_BASE_RADIUS + (PORTAL_MAX_RADIUS - PORTAL_BASE_RADIUS) * intensity;

            // === Outer distortion glow ===
            const distortR = radius * 3.5;
            const distortGrad = ctx.createRadialGradient(mx, my, radius * 0.3, mx, my, distortR);
            distortGrad.addColorStop(0, `rgba(0, 0, 0, ${0.12 * intensity})`);
            distortGrad.addColorStop(0.3, `rgba(15, 10, 30, ${0.06 * intensity})`);
            distortGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.beginPath();
            ctx.arc(mx, my, distortR, 0, Math.PI * 2);
            ctx.fillStyle = distortGrad;
            ctx.fill();

            // === Dark void center (the black hole) — drawn FIRST so rings overlay it ===
            // Layer 1: wide dark spread
            const voidGrad = ctx.createRadialGradient(mx, my, 0, mx, my, radius * 1.1);
            voidGrad.addColorStop(0, `rgba(0, 0, 0, ${0.95 * intensity})`);
            voidGrad.addColorStop(0.3, `rgba(0, 0, 0, ${0.9 * intensity})`);
            voidGrad.addColorStop(0.55, `rgba(5, 5, 10, ${0.7 * intensity})`);
            voidGrad.addColorStop(0.75, `rgba(10, 10, 15, ${0.35 * intensity})`);
            voidGrad.addColorStop(1, `rgba(15, 15, 20, ${0.05 * intensity})`);
            ctx.beginPath();
            ctx.arc(mx, my, radius * 1.1, 0, Math.PI * 2);
            ctx.fillStyle = voidGrad;
            ctx.fill();

            // Layer 2: pitch-black core
            const coreGrad = ctx.createRadialGradient(mx, my, 0, mx, my, radius * 0.45);
            coreGrad.addColorStop(0, `rgba(0, 0, 0, ${1.0 * intensity})`);
            coreGrad.addColorStop(0.7, `rgba(0, 0, 0, ${0.95 * intensity})`);
            coreGrad.addColorStop(1, `rgba(0, 0, 0, ${0.6 * intensity})`);
            ctx.beginPath();
            ctx.arc(mx, my, radius * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.fill();

            // === Spinning dark spark rings — originating from center outward ===
            for (let ring = 0; ring < PORTAL_RING_COUNT; ring++) {
                const ringRadius = radius * (0.85 + ring * 0.4);
                const ringSpeed = (ring % 2 === 0 ? 1 : -1) * (1.5 - ring * 0.3);
                const sparkCount = PORTAL_SPARK_COUNT - ring * 12;
                const ringAlpha = (1 - ring * 0.2) * intensity;

                ctx.save();
                ctx.translate(mx, my);
                ctx.rotate(time * ringSpeed);

                for (let i = 0; i < sparkCount; i++) {
                    const angle = (Math.PI * 2 * i) / sparkCount;
                    const wobble = Math.sin(time * 3 + i * 1.7) * 3 * intensity;

                    // Spark tip at ring position
                    const sx = Math.cos(angle) * (ringRadius + wobble);
                    const sy = Math.sin(angle) * (ringRadius + wobble);

                    // Origin near center
                    const originDist = ringRadius * 0.3;
                    const ox = Math.cos(angle) * originDist;
                    const oy = Math.sin(angle) * originDist;

                    // Curved control point — offset perpendicular to create spiral bend
                    const midDist = ringRadius * 0.65;
                    const bendAngle = angle + 0.6; // offset creates the curve/spiral
                    const cpx = Math.cos(bendAngle) * midDist;
                    const cpy = Math.sin(bendAngle) * midDist;

                    // Dark spark color
                    const lightness = 5 + Math.sin(i * 0.8 + time * 4) * 5;
                    const sparkAlpha = (0.5 + Math.sin(i * 1.3 + time * 5) * 0.25) * ringAlpha;

                    ctx.beginPath();
                    ctx.moveTo(ox, oy);
                    ctx.quadraticCurveTo(cpx, cpy, sx, sy);
                    ctx.strokeStyle = `rgba(${lightness}, ${lightness}, ${lightness + 5}, ${sparkAlpha})`;
                    ctx.lineWidth = 1.5 - ring * 0.3;
                    ctx.stroke();

                    // Dark spark dot at tip
                    if (i % 3 === 0) {
                        const dotAlpha = (0.6 + Math.sin(i * 2 + time * 6) * 0.3) * ringAlpha;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 2 - ring * 0.4, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(0, 0, 0, ${dotAlpha})`;
                        ctx.fill();
                    }
                }

                ctx.restore();
            }

            // === Dark ring edges ===
            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(time * 0.8);

            // Outer dark ring
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 * intensity})`;
            ctx.lineWidth = 3 * intensity;
            ctx.shadowColor = `rgba(0, 0, 0, ${0.7 * intensity})`;
            ctx.shadowBlur = 20 * intensity;
            ctx.stroke();

            // Inner dark ring
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * intensity})`;
            ctx.lineWidth = 2 * intensity;
            ctx.shadowBlur = 10 * intensity;
            ctx.stroke();

            ctx.restore();

            // === Swirling dark accretion streaks ===
            ctx.save();
            ctx.translate(mx, my);
            const streakCount = 10;
            for (let s = 0; s < streakCount; s++) {
                const sAngle = (Math.PI * 2 * s) / streakCount + time * 2;
                const sRadius = radius * (0.6 + Math.sin(time * 3 + s) * 0.2);
                const sx = Math.cos(sAngle) * sRadius * 0.8;
                const sy = Math.sin(sAngle) * sRadius * 0.8;
                const ex = Math.cos(sAngle + 0.5) * sRadius * 0.2;
                const ey = Math.sin(sAngle + 0.5) * sRadius * 0.2;

                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(
                    Math.cos(sAngle + 0.25) * sRadius * 0.1,
                    Math.sin(sAngle + 0.25) * sRadius * 0.1,
                    ex, ey
                );
                ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 * intensity})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();
        }

        /* ── Animation loop ── */
        function animate() {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const links = linksRef.current;
            const mouse = mouseRef.current;
            timeRef.current += 0.016;
            const time = timeRef.current;

            ctx.clearRect(0, 0, W, H);

            /* ── Update each link ── */
            for (let i = 0; i < links.length; i++) {
                const link = links[i];

                if (link.consuming) {
                    link.scale -= 0.04;
                    const dx = mouse.x - (link.x + link.w / 2);
                    const dy = mouse.y - (link.y + link.h / 2);
                    link.x += dx * 0.15;
                    link.y += dy * 0.15;
                    link.rotationSpeed *= 1.15;
                    link.rotation += link.rotationSpeed;

                    if (link.scale <= 0.01) {
                        links[i] = createLink(ctx, W, H, true);
                        continue;
                    }
                } else {
                    if (mouse.active) {
                        const cx = link.x + link.w / 2;
                        const cy = link.y + link.h / 2;
                        const dx = mouse.x - cx;
                        const dy = mouse.y - cy;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < GRAVITY_RADIUS && dist > 1) {
                            const force = GRAVITY_STRENGTH / (dist * dist);
                            const clampedForce = Math.min(force, 2.5);
                            link.vx += (dx / dist) * clampedForce * 0.016;
                            link.vy += (dy / dist) * clampedForce * 0.016;
                            link.rotationSpeed += (Math.random() - 0.5) * 0.002;
                        }

                        if (dist < CONSUME_RADIUS && !link.consuming) {
                            link.consuming = true;
                        }
                    }

                    link.x += link.vx;
                    link.y += link.vy;

                    const speed = Math.sqrt(link.vx * link.vx + link.vy * link.vy);
                    const maxSpeed = 3;
                    if (speed > maxSpeed) {
                        link.vx = (link.vx / speed) * maxSpeed;
                        link.vy = (link.vy / speed) * maxSpeed;
                    }

                    if (link.x <= 0) { link.x = 0; link.vx = Math.abs(link.vx); link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005; }
                    else if (link.x + link.w >= W) { link.x = W - link.w; link.vx = -Math.abs(link.vx); link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005; }
                    if (link.y <= 0) { link.y = 0; link.vy = Math.abs(link.vy); link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005; }
                    else if (link.y + link.h >= H) { link.y = H - link.h; link.vy = -Math.abs(link.vy); link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005; }

                    for (let j = i + 1; j < links.length; j++) {
                        const other = links[j];
                        if (other.consuming) continue;
                        if (linksOverlap(link, other)) {
                            const tmpVx = link.vx, tmpVy = link.vy;
                            link.vx = other.vx + (Math.random() - 0.5) * 0.3;
                            link.vy = other.vy + (Math.random() - 0.5) * 0.3;
                            other.vx = tmpVx + (Math.random() - 0.5) * 0.3;
                            other.vy = tmpVy + (Math.random() - 0.5) * 0.3;
                            link.rotationSpeed = (Math.random() - 0.5) * 0.015;
                            other.rotationSpeed = (Math.random() - 0.5) * 0.015;
                            const ox = (link.x + link.w / 2) - (other.x + other.w / 2);
                            const oy = (link.y + link.h / 2) - (other.y + other.h / 2);
                            const od = Math.sqrt(ox * ox + oy * oy) || 1;
                            link.x += (ox / od) * 2; link.y += (oy / od) * 2;
                            other.x -= (ox / od) * 2; other.y -= (oy / od) * 2;
                        }
                    }

                    link.rotation += link.rotationSpeed;
                    if (link.scale < 1) link.scale = Math.min(1, link.scale + 0.02);
                }

                /* ── Draw link ── */
                ctx.save();
                const cx = link.x + link.w / 2;
                const cy = link.y + link.h / 2;
                ctx.translate(cx, cy);
                ctx.rotate(link.rotation);
                ctx.scale(link.scale, link.scale);
                ctx.font = FONT;
                ctx.fillStyle = `rgba(51, 65, 85, ${link.opacity * link.scale})`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText(link.text, 0, 0);
                ctx.restore();
            }

            /* ── Draw Doctor Strange portal (black hole) ── */
            if (mouse.active) {
                let nearestDist = Infinity;
                for (const link of links) {
                    const cx = link.x + link.w / 2;
                    const cy = link.y + link.h / 2;
                    const dx = mouse.x - cx;
                    const dy = mouse.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) nearestDist = dist;
                }

                if (nearestDist < GRAVITY_RADIUS) {
                    const intensity = Math.min(1, (1 - nearestDist / GRAVITY_RADIUS) * 1.3);
                    drawPortal(ctx, mouse.x, mouse.y, intensity, time);
                }
            }

            rafRef.current = requestAnimationFrame(animate);
        }

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="floating-links-canvas"
            aria-hidden="true"
        />
    );
}
