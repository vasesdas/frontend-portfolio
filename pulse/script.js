const $ = (s) => document.querySelector(s);
const money = (n, d = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// Seeded random so the sample data is the same on every load
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- Theme ---------- */
const root = document.documentElement;
try { if (localStorage.getItem('pulse-theme') === 'dark') root.classList.add('dark'); } catch (e) {}
const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();

$('#theme-toggle').addEventListener('click', () => {
  root.classList.toggle('dark');
  try { localStorage.setItem('pulse-theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch (e) {}
  renderCharts();
});

/* ---------- Mobile sidebar ---------- */
const sidebar = $('#sidebar');
const overlay = $('#overlay');
const burger = $('#burger');
const setSidebar = (open) => {
  sidebar.classList.toggle('open', open);
  overlay.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('no-scroll', open);
};
burger.addEventListener('click', () => setSidebar(true));
overlay.addEventListener('click', () => setSidebar(false));
sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setSidebar(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setSidebar(false); });

/* ---------- Sample data ---------- */
const days = 90;
const series = (base, noise) => Array.from({ length: days * 2 }, (_, i) =>
  Math.round(base * (1 + i / (days * 4)) * (1 + Math.sin(i / 7) * 0.1) * (1 + (rand() - 0.5) * noise)));
const revenueDaily = series(4200, 0.22); // last 180 days: [previous 90 | current 90]
const ordersDaily = revenueDaily.map((r) => Math.round(r / (62 + rand() * 12)));
const visitorsDaily = ordersDaily.map((o) => Math.round(o * (28 + rand() * 8)));

const sum = (a) => a.reduce((s, x) => s + x, 0);
const windowOf = (arr, period, prev = false) => arr.slice(arr.length - period * (prev ? 2 : 1), arr.length - (prev ? period : 0));

/* ---------- KPIs ---------- */
const icons = {
  revenue: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/>',
  aov: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  conv: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
};
let period = 30;

function renderKpis() {
  const cur = (a) => sum(windowOf(a, period));
  const prev = (a) => sum(windowOf(a, period, true));
  const metrics = [
    { key: 'revenue', label: 'Revenue', now: cur(revenueDaily), before: prev(revenueDaily), fmt: (n) => money(n) },
    { key: 'orders', label: 'Orders', now: cur(ordersDaily), before: prev(ordersDaily), fmt: (n) => n.toLocaleString('en-US') },
    { key: 'aov', label: 'Avg. order value', now: cur(revenueDaily) / cur(ordersDaily), before: prev(revenueDaily) / prev(ordersDaily), fmt: (n) => money(n, 2) },
    { key: 'conv', label: 'Conversion rate', now: cur(ordersDaily) / cur(visitorsDaily) * 100, before: prev(ordersDaily) / prev(visitorsDaily) * 100, fmt: (n) => n.toFixed(2) + '%' },
  ];
  $('#kpis').innerHTML = metrics.map((m) => {
    const delta = (m.now / m.before - 1) * 100;
    const up = delta >= 0;
    return `<article class="card kpi">
      <div class="kpi__top">${m.label}<span class="kpi__icon"><svg viewBox="0 0 24 24">${icons[m.key]}</svg></span></div>
      <div class="kpi__value">${m.fmt(m.now)}</div>
      <div class="delta delta--${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}% <span>vs previous ${period} days</span></div>
    </article>`;
  }).join('');
}

$('#period').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  $('#period .is-active').classList.remove('is-active');
  btn.classList.add('is-active');
  period = +btn.dataset.period;
  renderKpis();
  renderCharts();
});

/* ---------- Charts (Chart.js) ---------- */
const channels = [
  { name: 'Online store', value: 48, color: '#4f6bff' },
  { name: 'Marketplace', value: 27, color: '#8b5cf6' },
  { name: 'Social', value: 15, color: '#22c55e' },
  { name: 'Retail', value: 10, color: '#f59e0b' },
];
$('#channels').innerHTML = channels.map((c) => `<li><i style="background:${c.color}"></i>${c.name}<b>${c.value}%</b></li>`).join('');

let revenueChart, channelChart;
function renderCharts() {
  if (!window.Chart) return; // CDN blocked/offline: page still works without charts
  const text = css('--muted'), grid = css('--border'), primary = css('--primary');
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.color = text;

  const labels = Array.from({ length: period }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (period - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const current = windowOf(revenueDaily, period);
  const previous = windowOf(revenueDaily, period, true);
  $('#revenue-sub').textContent = `${money(sum(current))} in the last ${period} days`;

  revenueChart?.destroy();
  const ctx = $('#revenue-chart').getContext('2d');
  const fill = ctx.createLinearGradient(0, 0, 0, 300);
  fill.addColorStop(0, primary + '40');
  fill.addColorStop(1, primary + '00');
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'This period', data: current, borderColor: primary, backgroundColor: fill, fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 },
        { label: 'Previous', data: previous, borderColor: grid, borderDash: [5, 5], tension: 0.4, borderWidth: 2, pointRadius: 0 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${money(c.parsed.y)}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
        y: { grid: { color: grid }, border: { display: false }, ticks: { callback: (v) => '$' + v / 1000 + 'k' } },
      },
    },
  });

  channelChart?.destroy();
  channelChart = new Chart($('#channel-chart'), {
    type: 'doughnut',
    data: { labels: channels.map((c) => c.name), datasets: [{ data: channels.map((c) => c.value), backgroundColor: channels.map((c) => c.color), borderColor: css('--surface'), borderWidth: 3 }] },
    options: { maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}%` } } } },
  });
}

/* ---------- Orders table: search, filter, sort, pagination ---------- */
const names = ['Olivia Brown', 'Liam Smith', 'Emma Wilson', 'Noah Davis', 'Ava Johnson', 'Lucas Martin', 'Mia Garcia', 'Ethan Clark', 'Sophia Lee', 'Mason Walker', 'Isabella King', 'James Wright', 'Amelia Scott', 'Henry Green', 'Harper Adams', 'Leo Baker'];
const statuses = ['Paid', 'Paid', 'Shipped', 'Shipped', 'Pending', 'Refunded'];
const colors = ['#4f6bff', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
const orders = Array.from({ length: 48 }, (_, i) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - Math.floor(i * 0.7 + rand() * 2));
  return {
    id: 'ORD-' + (10480 - i),
    customer: names[Math.floor(rand() * names.length)],
    date,
    status: statuses[Math.floor(rand() * statuses.length)],
    amount: Math.round((40 + rand() * 460) * 100) / 100,
  };
});

const PAGE_SIZE = 8;
const state = { query: '', status: '', sort: 'date', dir: -1, page: 1 };

function filteredOrders() {
  const q = state.query.toLowerCase();
  return orders
    .filter((o) => (!state.status || o.status === state.status) && (!q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)))
    .sort((a, b) => {
      const x = a[state.sort], y = b[state.sort];
      return (x > y ? 1 : x < y ? -1 : 0) * state.dir;
    });
}

function renderTable() {
  const rows = filteredOrders();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  $('#orders-body').innerHTML = pageRows.length ? pageRows.map((o) => {
    const initials = o.customer.split(' ').map((w) => w[0]).join('');
    const color = colors[o.customer.length % colors.length];
    return `<tr>
      <td>${o.id}</td>
      <td><span class="customer"><span class="initials" style="background:${color}">${initials}</span>${o.customer}</span></td>
      <td>${o.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td><span class="status status--${o.status.toLowerCase()}">${o.status}</span></td>
      <td class="num">${money(o.amount, 2)}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="5" class="empty">No orders match your search.</td></tr>';

  $('#orders-count').textContent = `${rows.length} of ${orders.length} orders`;
  $('#page-info').textContent = rows.length ? `Showing ${start + 1}–${start + pageRows.length} of ${rows.length}` : '';
  $('#prev-page').disabled = state.page === 1;
  $('#next-page').disabled = state.page === pages;
  document.querySelectorAll('[data-sort]').forEach((b) => {
    const th = b.parentElement;
    if (b.dataset.sort === state.sort) th.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
    else th.removeAttribute('aria-sort');
  });
}

$('#search').addEventListener('input', (e) => { state.query = e.target.value.trim(); state.page = 1; renderTable(); });
$('#status-filter').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; renderTable(); });
$('#prev-page').addEventListener('click', () => { state.page--; renderTable(); });
$('#next-page').addEventListener('click', () => { state.page++; renderTable(); });
document.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
  state.dir = state.sort === b.dataset.sort ? -state.dir : 1;
  state.sort = b.dataset.sort;
  state.page = 1;
  renderTable();
}));

/* ---------- Top products ---------- */
const products = [
  ['🎧', 'Wireless Headphones', 1240], ['⌚', 'Smart Watch S2', 980], ['👟', 'Running Sneakers', 864],
  ['🎒', 'Urban Backpack', 712], ['☕', 'Ceramic Mug Set', 590], ['🕶️', 'Polarized Sunglasses', 455],
];
const maxSold = products[0][2];
$('#products-list').innerHTML = products.map(([emoji, name, sold]) => `<li class="product">
  <span class="product__emoji">${emoji}</span><b>${name}</b><span class="muted">${sold.toLocaleString('en-US')} sold</span>
  <span class="product__bar"><i style="width:${sold / maxSold * 100}%"></i></span>
</li>`).join('');

renderKpis();
renderTable();
renderCharts();
