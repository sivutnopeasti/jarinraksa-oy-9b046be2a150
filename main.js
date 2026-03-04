'use strict';

/* =============================================
   1. NAVIGAATIO – HAMBURGER & SCROLL
   ============================================= */
const header = document.getElementById('site-header');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) {
    mobileMenu.classList.add('open');
    mobileMenu.style.display = 'flex';
  } else {
    mobileMenu.classList.remove('open');
    // Piilotetaan display-muutoksella transition-jälkeen
    mobileMenu.addEventListener('transitionend', () => {
      if (!mobileMenu.classList.contains('open')) {
        mobileMenu.style.display = 'none';
      }
    }, { once: true });
  }
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.addEventListener('transitionend', () => {
      if (!mobileMenu.classList.contains('open')) {
        mobileMenu.style.display = 'none';
      }
    }, { once: true });
  });
});

// Suljetaan valikko myös mobile-cta-napista
const mobileCta = mobileMenu.querySelector('.mobile-cta');
if (mobileCta) {
  mobileCta.addEventListener('click', () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (!mobileMenu.classList.contains('open')) {
        mobileMenu.style.display = 'none';
      }
    }, 350);
  });
}

// ESC sulkee valikon
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (!mobileMenu.classList.contains('open')) {
        mobileMenu.style.display = 'none';
      }
    }, 350);
    hamburger.focus();
  }
});

// Header-varjo scrollatessa
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* =============================================
   2. HERO-OTSIKON KIRJAINTEN PUTOAMINEN
   ============================================= */
function animateHeroTitle() {
  const title = document.getElementById('hero-title');
  if (!title) return;

  const text = title.textContent.trim();
  title.textContent = '';
  title.setAttribute('aria-label', text);

  // Pilkotaan kirjaimiin, välilyönnit säilytetään
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.classList.add('char');
    span.textContent = char === ' ' ? '\u00A0' : char;
    // Stagger 0.05s per kirjain, aloitus 0.3s viiveellä
    span.style.animationDelay = `${0.3 + i * 0.05}s`;
    title.appendChild(span);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animateHeroTitle);
} else {
  animateHeroTitle();
}

/* =============================================
   3. SCROLL-SISÄÄNTULO (reveal-left)
   IntersectionObserver: translateX(-40px)→0, opacity 0→1
   ============================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal-left').forEach(el => {
  revealObserver.observe(el);
});

/* =============================================
   4. STATS-LUKUJEN ANIMAATIO
   0 → loppuarvo, easeOutQuart, 1.8s
   ============================================= */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function animateNumber(el, target, suffix, duration) {
  const start = performance.now();
  const isDecimal = !Number.isInteger(target);

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const current = isDecimal
      ? (eased * target).toFixed(1)
      : Math.round(eased * target);

    el.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-number').forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        if (!isNaN(target)) {
          animateNumber(el, target, suffix, 1800);
        }
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

/* =============================================
   5. RIPPLE-EFEKTI NAPEISSA
   Ympyrä lähtee klikkauspisteestä
   ============================================= */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
    `;

    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });
});

/* =============================================
   6. KORTTIEN PERSPEKTIIVIEFEKTI (±8deg)
   mousemove → rotateX/Y, mouseleave → reset
   ============================================= */
function addTiltEffect(selector) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener('mousemove', (e) => {
      // Ei tilt-efektiä kosketuslaitteilla
      if (window.matchMedia('(hover: none)').matches) return;

      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = (-dy * 8).toFixed(2);
      const rotY = (dx * 8).toFixed(2);

      card.style.transform =
        `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform =
        'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      card.style.transition = 'transform 0.35s ease, box-shadow 0.25s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow 0.25s ease';
    });
  });
}

addTiltEffect('.palvelu-kortti');
addTiltEffect('.takuu-kortti');
addTiltEffect('.arvostelu-kortti');
addTiltEffect('.materiaali-kortti');

/* =============================================
   7. LINKKIEN HOVER – TRANSLATEY-TRUKKI
   Vanha teksti nousee ylös, uusi tulee alta
   ============================================= */
function wrapLinkText(selector) {
  document.querySelectorAll(selector).forEach(link => {
    // Ei sovelleta jos linkki sisältää kuvan tai jo käsitelty
    if (link.querySelector('img') || link.querySelector('.link-inner')) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const original = link.textContent.trim();
    if (!original) return;

    link.setAttribute('aria-label', original);

    const wrap = document.createElement('span');
    wrap.style.cssText =
      'display:inline-block; overflow:hidden; position:relative; height:1.2em; vertical-align:bottom;';

    const inner = document.createElement('span');
    inner.classList.add('link-inner');
    inner.textContent = original;
    inner.style.cssText =
      'display:block; transition:transform 0.25s ease;';

    const shadow = document.createElement('span');
    shadow.classList.add('link-shadow');
    shadow.textContent = original;
    shadow.style.cssText =
      'display:block; position:absolute; top:100%; left:0; transition:transform 0.25s ease;';

    wrap.appendChild(inner);
    wrap.appendChild(shadow);

    link.textContent = '';
    link.appendChild(wrap);

    link.addEventListener('mouseenter', () => {
      inner.style.transform = 'translateY(-100%)';
      shadow.style.transform = 'translateY(-100%)';
    });

    link.addEventListener('mouseleave', () => {
      inner.style.transform = 'translateY(0)';
      shadow.style.transform = 'translateY(0)';
    });
  });
}

// Ajetaan DOMContentLoaded jälkeen jotta footer-linkit ovat valmiina
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => wrapLinkText('.footer-links a'));
} else {
  wrapLinkText('.footer-links a');
}

/* =============================================
   8. FLOATING LABEL – AUTOFILL-TUKI
   CSS hoitaa :not(:placeholder-shown),
   JS varmistaa selaimen autofill-tapaukset
   ============================================= */
document.querySelectorAll('.form-input').forEach(input => {
  // Tarkistetaan arvo heti (selaimen muistama tieto)
  function checkFilled() {
    if (input.value.length > 0) {
      input.setAttribute('placeholder', '\u200B'); // zero-width space aktivoi :not(:placeholder-shown)
    } else {
      input.setAttribute('placeholder', ' ');
    }
  }

  // Placeholder-arvo täytyy olla tyhjä merkki jotta CSS-selektori toimii
  input.setAttribute('placeholder', ' ');

  input.addEventListener('input', checkFilled);
  input.addEventListener('change', checkFilled);

  // Autofill-animaatio-haku (Chrome)
  input.addEventListener('animationstart', (e) => {
    if (e.animationName === 'onAutoFillStart') {
      input.setAttribute('placeholder', '\u200B');
    }
  });

  // Tarkista heti sivun latautuessa
  setTimeout(checkFilled, 100);
});

/* =============================================
   9. YHTEYDENOTTOLOMAKE – SUBMIT + VALIDOINTI
   ============================================= */
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

if (contactForm && formStatus && submitBtn) {
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Perusvalidointi
    const nimiInput = document.getElementById('nimi');
    const puhelinInput = document.getElementById('puhelin');
    const emailInput = document.getElementById('email');

    if (!nimiInput.value.trim()) {
      showStatus('Kirjoita nimesi ennen lähetystä.', 'error');
      nimiInput.focus();
      return;
    }

    // Vähintään puhelin tai sähköposti
    if (!puhelinInput.value.trim() && !emailInput.value.trim()) {
      showStatus('Anna puhelinnumero tai sähköposti yhteydenottoa varten.', 'error');
      puhelinInput.focus();
      return;
    }

    // Sähköpostimuodon tarkistus jos annettu
    if (emailInput.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
      showStatus('Tarkista sähköpostiosoitteen muoto.', 'error');
      emailInput.focus();
      return;
    }

    // Lähetys-tila
    setLoading(true);
    showStatus('', '');

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        showStatus('Tarjouspyyntö lähetetty. Palaamme asiaan pian.', 'success');
        contactForm.reset();
        // Nollataan floating labelit
        document.querySelectorAll('.form-input').forEach(input => {
          input.setAttribute('placeholder', ' ');
        });
      } else {
        const data = await response.json().catch(() => ({}));
        const msg = data?.errors?.[0]?.message || 'Lähetys epäonnistui. Yritä uudelleen tai soita: 040 0450902';
        showStatus(msg, 'error');
      }
    } catch {
      showStatus('Verkkovirhe. Soita suoraan: 040 0450902', 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (btnText) btnText.style.display = loading ? 'none' : 'inline';
    if (btnSpinner) btnSpinner.style.display = loading ? 'inline' : 'none';
  }

  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form-status' + (type ? ` ${type}` : '');
    if (message) {
      formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

/* =============================================
   10. SMOOTH SCROLL ANKKURILINKEILLE
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Päivitetään URL ilman sivun hyppäystä
    if (history.pushState) {
      history.pushState(null, '', href);
    }
  });
});

/* =============================================
   11. GALLERIA – KUVAN SUURENNUS (LIGHTBOX)
   ============================================= */
function buildLightbox() {
  const overlay = document.createElement('div');
  overlay.id = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Kuvan suurennus');
  overlay.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(10, 16, 10, 0.92);
    z-index: 9000;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    cursor: zoom-out;
  `;

  const img = document.createElement('img');
  img.id = 'lightbox-img';
  img.style.cssText = `
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    cursor: default;
    transition: opacity 0.25s ease;
  `;

  const caption = document.createElement('p');
  caption.id = 'lightbox-caption';
  caption.style.cssText = `
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255,255,255,0.85);
    font-family: 'Libre Baskerville', serif;
    font-size: 1rem;
    text-align: center;
    pointer-events: none;
    white-space: nowrap;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Sulje');
  closeBtn.style.cssText = `
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    font-size: 1.6rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    line-height: 1;
  `;
  closeBtn.textContent = '×';
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(255,255,255,0.28)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(255,255,255,0.15)';
  });

  overlay.appendChild(img);
  overlay.appendChild(caption);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  function openLightbox(src, alt, captionText) {
    img.src = src;
    img.alt = alt || '';
    caption.textContent = captionText || '';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    overlay.style.display = 'none';
    img.src = '';
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  closeBtn.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      closeLightbox();
    }
  });

  // Liitetään galleriakohteiden klikkaukseen
  document.querySelectorAll('.galleria-item').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');

    const imgEl = item.querySelector('img');
    const captionEl = item.querySelector('.galleria-caption-text');

    const handler = () => {
      if (imgEl) {
        openLightbox(
          imgEl.src,
          imgEl.alt,
          captionEl ? captionEl.textContent : ''
        );
      }
    };

    item.addEventListener('click', handler);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildLightbox);
} else {
  buildLightbox();
}

/* =============================================
   12. HEADER ACTIVE-LINK SCROLLATESSA
   Korostetaan aktiivinen navigaatiolinkki
   ============================================= */
const sections = document.querySelectorAll('main section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');

const activeLinkObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinksAll.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${id}`) {
          link.style.color = 'var(--color-accent)';
        } else {
          link.style.color = '';
        }
      });
    }
  });
}, {
  threshold: 0.4,
  rootMargin: '-72px 0px -40% 0px'
});

sections.forEach(section => activeLinkObserver.observe(section));