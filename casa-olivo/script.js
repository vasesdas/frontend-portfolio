// 1. Mobile menu: open/close with the burger button
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('no-scroll', open);
}

burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

// 2. Menu tabs: show the panel of the clicked tab, hide the others
const tabs = document.querySelectorAll('.tab');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active);
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
  });
});

// 3. Booking form: no past dates, show a thank-you message (demo — no server)
const dateInput = document.getElementById('date');
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); // local date, not UTC
dateInput.min = today.toISOString().slice(0, 10);

const form = document.getElementById('book');
const success = document.getElementById('form-success');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  success.hidden = false;
  form.reset();
});
