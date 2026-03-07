import { useMemo } from 'react';

/**
 * FallingStars
 *
 * Renders soft dark dots that gently fall from the top of the screen,
 * like white stars falling on a clear night — but in dark on a light bg.
 *
 * Each star has a randomized:
 *   - horizontal position
 *   - size (1px – 3px)
 *   - animation duration (8s – 20s)
 *   - animation delay (0s – 15s)
 *   - opacity (0.08 – 0.25)
 */

const TOTAL_STARS = 40;

export default function FallingStars() {
    // Generate random star properties only once (useMemo).
    const stars = useMemo(() => {
        const starArray = [];

        for (let i = 0; i < TOTAL_STARS; i++) {
            const leftPosition = Math.random() * 100;           // 0% to 100%
            const size = 1.5 + Math.random() * 2;               // 1.5px to 3.5px
            const animationDuration = 8 + Math.random() * 12;   // 8s to 20s
            const animationDelay = Math.random() * 15;           // 0s to 15s
            const opacity = 0.08 + Math.random() * 0.17;        // 0.08 to 0.25

            starArray.push({
                id: i,
                leftPosition,
                size,
                animationDuration,
                animationDelay,
                opacity,
            });
        }

        return starArray;
    }, []);

    return (
        <div className="falling-stars-container" aria-hidden="true">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="falling-star"
                    style={{
                        left: star.leftPosition + '%',
                        width: star.size + 'px',
                        height: star.size + 'px',
                        opacity: star.opacity,
                        animationDuration: star.animationDuration + 's',
                        animationDelay: star.animationDelay + 's',
                    }}
                />
            ))}
        </div>
    );
}
