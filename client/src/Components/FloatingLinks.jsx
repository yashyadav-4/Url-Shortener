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
const GRAVITY_RADIUS = 150;
const GRAVITY_STRENGTH = 8000;
const CONSUME_RADIUS = 18;
const BLACK_HOLE_VISUAL_RADIUS = 22;
const FONT_SIZE = 14;
const FONT = `600 ${FONT_SIZE}px 'Inter', system-ui, sans-serif`;

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
        // Spawn from a random edge
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: x = Math.random() * canvasW; y = -h; break;         // top
            case 1: x = canvasW + w; y = Math.random() * canvasH; break; // right
            case 2: x = Math.random() * canvasW; y = canvasH + h; break; // bottom
            default: x = -w; y = Math.random() * canvasH; break;         // left
        }
    } else {
        x = w + Math.random() * (canvasW - w * 2);
        y = h + Math.random() * (canvasH - h * 2);
    }

    return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: (Math.random() - 0.5) * Math.PI * 0.5, // initial rotation
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        text,
        w,
        h,
        opacity: 0.12 + Math.random() * 0.12, // 0.12 – 0.24
        scale: fromEdge ? 0.01 : 1, // start tiny if spawning from edge
        alive: true,
        consuming: false,
    };
}

/* ── AABB collision check (axis-aligned, uses rotated bounding ≈ original box) ── */
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

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        /* ── Resize handler ── */
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

        /* ── Animation loop ── */
        function animate() {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const links = linksRef.current;
            const mouse = mouseRef.current;

            ctx.clearRect(0, 0, W, H);

            /* ── Update each link ── */
            for (let i = 0; i < links.length; i++) {
                const link = links[i];

                /* ── Consume animation ── */
                if (link.consuming) {
                    link.scale -= 0.04;
                    // Pull toward cursor while shrinking
                    const dx = mouse.x - (link.x + link.w / 2);
                    const dy = mouse.y - (link.y + link.h / 2);
                    link.x += dx * 0.15;
                    link.y += dy * 0.15;
                    link.rotationSpeed *= 1.15; // spin faster
                    link.rotation += link.rotationSpeed;

                    if (link.scale <= 0.01) {
                        // Respawn from edge
                        links[i] = createLink(ctx, W, H, true);
                        continue;
                    }
                } else {
                    /* ── Gravity toward cursor ── */
                    if (mouse.active) {
                        const cx = link.x + link.w / 2;
                        const cy = link.y + link.h / 2;
                        const dx = mouse.x - cx;
                        const dy = mouse.y - cy;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < GRAVITY_RADIUS && dist > 1) {
                            // Gravitational acceleration: F = G / r²
                            const force = GRAVITY_STRENGTH / (dist * dist);
                            const clampedForce = Math.min(force, 2.5);
                            link.vx += (dx / dist) * clampedForce * 0.016;
                            link.vy += (dy / dist) * clampedForce * 0.016;

                            // Speed up rotation when being pulled
                            link.rotationSpeed += (Math.random() - 0.5) * 0.002;
                        }

                        // Consume when very close
                        if (dist < CONSUME_RADIUS && !link.consuming) {
                            link.consuming = true;
                        }
                    }

                    /* ── Move ── */
                    link.x += link.vx;
                    link.y += link.vy;

                    /* ── Cap speed ── */
                    const speed = Math.sqrt(link.vx * link.vx + link.vy * link.vy);
                    const maxSpeed = 3;
                    if (speed > maxSpeed) {
                        link.vx = (link.vx / speed) * maxSpeed;
                        link.vy = (link.vy / speed) * maxSpeed;
                    }

                    /* ── Edge bounce ── */
                    if (link.x <= 0) {
                        link.x = 0;
                        link.vx = Math.abs(link.vx);
                        link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005;
                    } else if (link.x + link.w >= W) {
                        link.x = W - link.w;
                        link.vx = -Math.abs(link.vx);
                        link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005;
                    }
                    if (link.y <= 0) {
                        link.y = 0;
                        link.vy = Math.abs(link.vy);
                        link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005;
                    } else if (link.y + link.h >= H) {
                        link.y = H - link.h;
                        link.vy = -Math.abs(link.vy);
                        link.rotationSpeed = -link.rotationSpeed + (Math.random() - 0.5) * 0.005;
                    }

                    /* ── Link–link collision ── */
                    for (let j = i + 1; j < links.length; j++) {
                        const other = links[j];
                        if (other.consuming) continue;
                        if (linksOverlap(link, other)) {
                            // Swap velocities + small random perturbation
                            const tmpVx = link.vx;
                            const tmpVy = link.vy;
                            link.vx = other.vx + (Math.random() - 0.5) * 0.3;
                            link.vy = other.vy + (Math.random() - 0.5) * 0.3;
                            other.vx = tmpVx + (Math.random() - 0.5) * 0.3;
                            other.vy = tmpVy + (Math.random() - 0.5) * 0.3;

                            // Change rotation on collision
                            link.rotationSpeed = (Math.random() - 0.5) * 0.015;
                            other.rotationSpeed = (Math.random() - 0.5) * 0.015;

                            // Push apart to prevent sticking
                            const overlapX = (link.x + link.w / 2) - (other.x + other.w / 2);
                            const overlapY = (link.y + link.h / 2) - (other.y + other.h / 2);
                            const overlapDist = Math.sqrt(overlapX * overlapX + overlapY * overlapY) || 1;
                            link.x += (overlapX / overlapDist) * 2;
                            link.y += (overlapY / overlapDist) * 2;
                            other.x -= (overlapX / overlapDist) * 2;
                            other.y -= (overlapY / overlapDist) * 2;
                        }
                    }

                    /* ── Rotation ── */
                    link.rotation += link.rotationSpeed;

                    /* ── Grow scale for newly spawned links ── */
                    if (link.scale < 1) {
                        link.scale = Math.min(1, link.scale + 0.02);
                    }
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

            /* ── Draw black hole cursor ── */
            if (mouse.active) {
                // Check if any link is within gravity radius
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
                    // Intensity based on proximity
                    const intensity = 1 - (nearestDist / GRAVITY_RADIUS);
                    const baseRadius = BLACK_HOLE_VISUAL_RADIUS;
                    const radius = baseRadius * (0.5 + intensity * 0.5);

                    // Outer accretion glow
                    const glowRadius = radius * 3;
                    const glowGrad = ctx.createRadialGradient(
                        mouse.x, mouse.y, radius * 0.5,
                        mouse.x, mouse.y, glowRadius
                    );
                    glowGrad.addColorStop(0, `rgba(80, 60, 120, ${0.08 * intensity})`);
                    glowGrad.addColorStop(0.4, `rgba(60, 40, 100, ${0.04 * intensity})`);
                    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2);
                    ctx.fillStyle = glowGrad;
                    ctx.fill();

                    // Accretion ring
                    const ringGrad = ctx.createRadialGradient(
                        mouse.x, mouse.y, radius * 0.8,
                        mouse.x, mouse.y, radius * 1.8
                    );
                    ringGrad.addColorStop(0, `rgba(100, 80, 140, ${0.12 * intensity})`);
                    ringGrad.addColorStop(0.5, `rgba(60, 40, 90, ${0.06 * intensity})`);
                    ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, radius * 1.8, 0, Math.PI * 2);
                    ctx.fillStyle = ringGrad;
                    ctx.fill();

                    // Dark sphere core
                    const coreGrad = ctx.createRadialGradient(
                        mouse.x - radius * 0.15, mouse.y - radius * 0.15, 0,
                        mouse.x, mouse.y, radius
                    );
                    coreGrad.addColorStop(0, `rgba(10, 10, 15, ${0.85 * intensity})`);
                    coreGrad.addColorStop(0.6, `rgba(15, 15, 25, ${0.75 * intensity})`);
                    coreGrad.addColorStop(0.85, `rgba(30, 25, 50, ${0.5 * intensity})`);
                    coreGrad.addColorStop(1, `rgba(50, 40, 70, ${0.15 * intensity})`);
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = coreGrad;
                    ctx.fill();

                    // Subtle highlight for 3D feel
                    const highlightGrad = ctx.createRadialGradient(
                        mouse.x - radius * 0.3, mouse.y - radius * 0.3, 0,
                        mouse.x, mouse.y, radius * 0.6
                    );
                    highlightGrad.addColorStop(0, `rgba(255, 255, 255, ${0.06 * intensity})`);
                    highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, radius * 0.6, 0, Math.PI * 2);
                    ctx.fillStyle = highlightGrad;
                    ctx.fill();
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
