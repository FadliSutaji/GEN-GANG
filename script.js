/* ============================================
   UNDER CONSTRUCTION — SCRIPT
   Cursor Star Trail & Visitor Counter
   ============================================ */

// ---- Color palette matching the website ----
const trailColors = [
    '#FFD700', // Gold (main star color)
    '#FFEC80', // Light yellow
    '#E8A0E8', // Light purple
    '#D06BD0', // Medium purple
    '#FFB347', // Soft orange-gold
    '#FFF59D', // Pale yellow
];

// ---- SVG Star shape (matches the hand-drawn star style) ----
function createStarSVG(color) {
    return `<svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>`;
}

// ---- Cursor Star Trail ----
let lastTrailTime = 0;
const trailThrottle = 40; // ms between stars (lower = more stars)

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrailTime < trailThrottle) return;
    lastTrailTime = now;

    createTrailStar(e.clientX, e.clientY);
});

// Also support touch devices
document.addEventListener('touchmove', (e) => {
    const now = Date.now();
    if (now - lastTrailTime < trailThrottle) return;
    lastTrailTime = now;

    const touch = e.touches[0];
    createTrailStar(touch.clientX, touch.clientY);
}, { passive: true });

function createTrailStar(x, y) {
    const star = document.createElement('div');
    star.classList.add('trail-star');

    // Pick a random color from the palette
    const color = trailColors[Math.floor(Math.random() * trailColors.length)];
    star.innerHTML = createStarSVG(color);
    star.style.color = color;

    // Random size variation
    const size = 8 + Math.random() * 18; // 8px to 26px
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    // Slight random offset so it doesn't look robotic
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    star.style.left = `${x + offsetX}px`;
    star.style.top = `${y + offsetY}px`;

    document.body.appendChild(star);

    // Clean up after animation ends
    star.addEventListener('animationend', () => {
        star.remove();
    });
}

// ---- Click still produces a burst (bonus!) ----
document.addEventListener('click', (e) => {
    const numStars = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numStars; i++) {
        setTimeout(() => {
            const offsetX = (Math.random() - 0.5) * 80;
            const offsetY = (Math.random() - 0.5) * 80;
            createTrailStar(e.clientX + offsetX, e.clientY + offsetY);
        }, i * 30);
    }
});

// ---- Visitor Counter ----
// Using localStorage-based counter for demo.
// For production, replace with a real hit counter API.

(function initVisitorCounter() {
    const countEl = document.getElementById('visitor-count');
    if (!countEl) return;

    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const storageKey = 'uc_visitor_count';
    const storageDateKey = 'uc_visitor_date';

    let savedDate = localStorage.getItem(storageDateKey);
    let count = parseInt(localStorage.getItem(storageKey), 10) || 0;

    // Reset if it's a new day
    if (savedDate !== today) {
        count = 0;
        localStorage.setItem(storageDateKey, today);
    }

    // Increment on this visit
    count += 1;
    localStorage.setItem(storageKey, count.toString());

    // Animate the number counting up
    animateCount(countEl, count);
})();

function animateCount(element, target) {
    let current = 0;
    const duration = 1200;
    const startTime = performance.now();

    function step(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.floor(eased * target);

        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = target.toLocaleString();
        }
    }

    requestAnimationFrame(step);
}

// ---- Easter Egg: Logo Click ----
const logo = document.querySelector('.logo');
if (logo) {
    let clickCount = 0;
    logo.addEventListener('click', (e) => {
        e.stopPropagation();
        clickCount++;

        // Spin the logo!
        logo.style.transition = 'transform 0.6s ease';
        logo.style.transform = `rotate(${clickCount * 360}deg) scale(1.2)`;

        setTimeout(() => {
            logo.style.transform = '';
            logo.style.transition = '';
        }, 700);

        // After 5 clicks, trigger a mega burst
        if (clickCount % 5 === 0) {
            for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                    const rect = logo.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const offsetX = (Math.random() - 0.5) * 160;
                    const offsetY = (Math.random() - 0.5) * 160;
                    createTrailStar(cx + offsetX, cy + offsetY);
                }, i * 25);
            }
        }
    });
}
