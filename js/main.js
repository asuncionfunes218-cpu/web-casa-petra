/* Casa Petra — JS */

/* NAV scroll */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
  document.getElementById('backTop').classList.toggle('show', window.scrollY > 400);
}, { passive:true });

/* Burger */
const burger = document.getElementById('burger');
const links  = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  links.classList.toggle('open');
  document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  links.classList.remove('open');
  document.body.style.overflow = '';
}));

/* Hero slideshow */
const slides = document.querySelectorAll('.hero__slide');
let cur = 0;
setInterval(() => {
  slides[cur].classList.remove('active');
  cur = (cur + 1) % slides.length;
  slides[cur].classList.add('active');
}, 5500);

/* Scroll reveal */
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => ro.observe(el));

/* TABS */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const cat = tab.dataset.cat;
    document.querySelectorAll('.dish-card, .dish-list').forEach(el => {
      if (el.dataset.cat === cat) {
        el.style.display = '';
        el.style.animation = 'fu .4s ease both';
      } else {
        el.style.display = 'none';
      }
    });
  });
});

/* Gallery lightbox */
const lb     = document.getElementById('lb');
const lbImg  = document.getElementById('lbImg');
const items  = [...document.querySelectorAll('.gallery__item')];
let lbIdx    = 0;

function openLb(i) {
  lbIdx = i;
  lbImg.src = items[i].dataset.src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }

items.forEach((el, i) => el.addEventListener('click', () => openLb(i)));
document.getElementById('lbClose').addEventListener('click', closeLb);
document.getElementById('lbPrev').addEventListener('click', () => { lbIdx = (lbIdx - 1 + items.length) % items.length; lbImg.src = items[lbIdx].dataset.src; });
document.getElementById('lbNext').addEventListener('click', () => { lbIdx = (lbIdx + 1) % items.length; lbImg.src = items[lbIdx].dataset.src; });
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLb();
  if (e.key === 'ArrowLeft')  document.getElementById('lbPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lbNext').click();
});

/* Reservation form */
document.getElementById('fFecha').min = new Date().toISOString().split('T')[0];
document.getElementById('rForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Enviando…'; btn.disabled = true;
  setTimeout(() => {
    e.target.reset(); btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Solicitar reserva'; btn.disabled = false;
    const ok = document.getElementById('fOk');
    ok.classList.add('show');
    setTimeout(() => ok.classList.remove('show'), 5000);
  }, 1500);
});

/* Back to top */
document.getElementById('backTop').addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
