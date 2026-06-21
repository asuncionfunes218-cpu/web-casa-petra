/* ═══════════════════════════════════════════════
   CASA PETRA — JAVASCRIPT PRINCIPAL
   ═══════════════════════════════════════════════ */

/* ─── Nav scroll ──────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
  document.getElementById('backTop').classList.toggle('show', window.scrollY > 400);
}, { passive: true });

/* ─── Burger menu ────────────────────────── */
const burger    = document.getElementById('navBurger');
const navLinks  = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ─── Hero slideshow ──────────────────────── */
const slides = document.querySelectorAll('.hero__slide');
let current = 0;
setInterval(() => {
  slides[current].classList.remove('active');
  current = (current + 1) % slides.length;
  slides[current].classList.add('active');
}, 5500);

/* ─── Scroll reveal ───────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
  .forEach(el => revealObserver.observe(el));

/* ─── Counter animation ───────────────────── */
function animateCount(el) {
  const target = +el.dataset.target;
  const dur    = 1800;
  const step   = 16;
  const inc    = target / (dur / step);
  let count    = 0;
  const timer  = setInterval(() => {
    count = Math.min(count + inc, target);
    el.textContent = Math.floor(count);
    if (count >= target) clearInterval(timer);
  }, step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stats__num').forEach(animateCount);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

/* ─── Menu tabs ───────────────────────────── */
document.querySelectorAll('.menu__tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu__tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const cat = tab.dataset.cat;
    document.querySelectorAll('.menu__card').forEach(card => {
      if (card.dataset.cat === cat) {
        card.style.display = '';
        card.style.animation = 'fadeUp .4s ease both';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

/* ─── Gallery lightbox ────────────────────── */
const lightbox     = document.getElementById('lightbox');
const lightboxImg  = document.getElementById('lightboxImg');
const galleryItems = [...document.querySelectorAll('.gallery__item img')];
let lightboxIndex  = 0;

function openLightbox(idx) {
  lightboxIndex    = idx;
  lightboxImg.src  = galleryItems[idx].src;
  lightboxImg.alt  = galleryItems[idx].alt;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

galleryItems.forEach((img, i) => {
  img.closest('.gallery__item').addEventListener('click', () => openLightbox(i));
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', () => {
  lightboxIndex = (lightboxIndex - 1 + galleryItems.length) % galleryItems.length;
  lightboxImg.src = galleryItems[lightboxIndex].src;
});
document.getElementById('lightboxNext').addEventListener('click', () => {
  lightboxIndex = (lightboxIndex + 1) % galleryItems.length;
  lightboxImg.src = galleryItems[lightboxIndex].src;
});
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  document.getElementById('lightboxPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});

/* ─── Testimonials slider ─────────────────── */
const track  = document.getElementById('testimonialsTrack');
const cards  = [...track.children];
const dotsEl = document.getElementById('testimonialsDots');
let tIndex   = 0;

cards.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'testimonials__dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', `Testimonio ${i + 1}`);
  dot.addEventListener('click', () => goTo(i));
  dotsEl.appendChild(dot);
});

function goTo(n) {
  tIndex = (n + cards.length) % cards.length;
  track.style.transform = `translateX(-${tIndex * 100}%)`;
  document.querySelectorAll('.testimonials__dot').forEach((d, i) => {
    d.classList.toggle('active', i === tIndex);
  });
}

document.getElementById('testimonialPrev').addEventListener('click', () => goTo(tIndex - 1));
document.getElementById('testimonialNext').addEventListener('click', () => goTo(tIndex + 1));

// Auto-advance
let tAuto = setInterval(() => goTo(tIndex + 1), 6000);
track.closest('.testimonials__slider').addEventListener('mouseenter', () => clearInterval(tAuto));
track.closest('.testimonials__slider').addEventListener('mouseleave', () => {
  tAuto = setInterval(() => goTo(tIndex + 1), 6000);
});

// Touch swipe
let touchStartX = 0;
track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
track.addEventListener('touchend',   e => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) goTo(diff > 0 ? tIndex + 1 : tIndex - 1);
});

/* ─── Reservation form ────────────────────── */
const form = document.getElementById('reservaForm');

// Set min date to today
const fechaInput = document.getElementById('fecha');
if (fechaInput) {
  const today = new Date().toISOString().split('T')[0];
  fechaInput.min = today;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Enviando…';
  btn.disabled = true;

  setTimeout(() => {
    form.reset();
    btn.textContent = 'Solicitar reserva';
    btn.disabled = false;
    const success = document.getElementById('formSuccess');
    success.classList.add('show');
    setTimeout(() => success.classList.remove('show'), 5000);
  }, 1600);
});

/* ─── Back to top ─────────────────────────── */
document.getElementById('backTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── Active nav link on scroll ──────────── */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav__links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${e.target.id}`
          ? 'var(--gold-light)' : '';
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navObserver.observe(s));
