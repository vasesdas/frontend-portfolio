// Header background on scroll
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('no-scroll', open);
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Project filtering
const projects = [...document.querySelectorAll('.project')];
document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter.is-active').classList.remove('is-active');
    btn.classList.add('is-active');
    const f = btn.dataset.filter;
    projects.forEach((p) => {
      const show = f === 'all' || p.dataset.category === f;
      p.classList.toggle('is-hidden', !show);
      p.classList.remove('fade-in');
      if (show) { void p.offsetWidth; p.classList.add('fade-in', 'visible'); } // reflow restarts the animation
    });
  });
});

// Lightbox (navigates only through currently visible projects)
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbCaption = document.getElementById('lightbox-caption');
let current = [];
let index = 0;
let lastFocus = null;

const show = (i) => {
  index = (i + current.length) % current.length;
  const p = current[index];
  const img = p.querySelector('img');
  lbImg.src = img.src.replace(/w=\d+/, 'w=2400');
  lbImg.alt = img.alt;
  lbCaption.textContent = `${p.querySelector('.project__title').textContent} — ${p.querySelector('.project__meta').textContent}`;
};
const openLightbox = (project) => {
  current = projects.filter((p) => !p.classList.contains('is-hidden'));
  lastFocus = document.activeElement;
  show(current.indexOf(project));
  lightbox.hidden = false;
  document.body.classList.add('no-scroll');
  lightbox.querySelector('.lightbox__close').focus();
};
const closeLightbox = () => {
  lightbox.hidden = true;
  document.body.classList.remove('no-scroll');
  lastFocus?.focus();
};

projects.forEach((p) => p.querySelector('.project__img').addEventListener('click', () => openLightbox(p)));
lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) {
    if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false);
    return;
  }
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') show(index - 1);
  if (e.key === 'ArrowRight') show(index + 1);
});

// Contact form (no backend — demo only)
const form = document.getElementById('contact-form');
const success = document.getElementById('form-success');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  success.hidden = false;
  form.reset();
  setTimeout(() => { success.hidden = true; }, 5000);
});
