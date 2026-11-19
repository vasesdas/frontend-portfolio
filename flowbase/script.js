const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle (remembered per browser)
const root = document.documentElement;
const themeBtn = $('#theme-toggle');
const syncThemeLabel = () => themeBtn.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
themeBtn.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  syncThemeLabel();
});
syncThemeLabel();

// Header on scroll
const header = $('#header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 20);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const burger = $('#burger');
const nav = $('#nav');
const setMenu = (open) => {
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('no-scroll', open);
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
$$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Animated counters
const animateCount = (el) => {
  const target = parseFloat(el.dataset.count);
  const decimals = +(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || '';
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  if (reducedMotion) { el.textContent = fmt(target); return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / 1600, 1);
    el.textContent = fmt(target * (1 - Math.pow(1 - t, 3))); // ease-out cubic
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// Reveal on scroll (+ start counters when visible)
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    const counter = $('[data-count]', entry.target);
    if (counter) animateCount(counter);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });
$$('.reveal').forEach((el) => observer.observe(el));

// Pricing toggle
const billing = $('#billing-toggle');
billing.addEventListener('click', () => {
  const yearly = billing.getAttribute('aria-checked') !== 'true';
  billing.setAttribute('aria-checked', yearly);
  $('#label-monthly').classList.toggle('is-active', !yearly);
  $('#label-yearly').classList.toggle('is-active', yearly);
  $$('.price').forEach((p) => {
    p.textContent = '$' + p.dataset[yearly ? 'yearly' : 'monthly'];
    p.classList.remove('bump');
    void p.offsetWidth; // reflow restarts the animation
    p.classList.add('bump');
  });
});

// Testimonials slider
const slider = $('#slider');
const track = $('.slider__track', slider);
const slides = $$('.quote', slider);
const dotsWrap = $('.slider__dots', slider);
let current = 0;
const dots = slides.map((_, i) => {
  const b = document.createElement('button');
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', `Testimonial ${i + 1}`);
  b.addEventListener('click', () => { goTo(i); restart(); });
  dotsWrap.append(b);
  return b;
});
const goTo = (i) => {
  current = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${current * 100}%)`;
  dots.forEach((d, j) => d.setAttribute('aria-selected', j === current));
  slides.forEach((s, j) => s.setAttribute('aria-hidden', j !== current));
};
$$('[data-dir]', slider).forEach((b) => b.addEventListener('click', () => { goTo(current + +b.dataset.dir); restart(); }));
let timer;
const restart = () => { clearInterval(timer); if (!reducedMotion) timer = setInterval(() => goTo(current + 1), 6000); };
slider.addEventListener('mouseenter', () => clearInterval(timer));
slider.addEventListener('mouseleave', restart);
// swipe on touch devices
let startX = null;
slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
slider.addEventListener('touchend', (e) => {
  if (startX === null) return;
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 50) { goTo(current + (dx < 0 ? 1 : -1)); restart(); }
  startX = null;
});
goTo(0);
restart();

// FAQ: only one open at a time (fallback for browsers without <details name>)
$$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) $$('.faq details').forEach((o) => { if (o !== d) o.open = false; });
}));

// CTA form (no backend — demo only)
$('#cta-form').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  $('#cta-success').hidden = false;
});
