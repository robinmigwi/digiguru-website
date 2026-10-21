// Contact configuration. The WhatsApp number lives here and nowhere else in the page logic.
// Digits only, with country code and no plus sign. The structured data in index.html also lists it, because crawlers read that without running JavaScript.
const WHATSAPP_NUMBER = '254181739987';
const WHATSAPP_MESSAGE = 'Hello DigiGuru, I would like to talk about my customer journey.';

document.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
  if (!WHATSAPP_NUMBER) return;
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  link.target = '_blank';
});

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-menu');
const progressBar = document.querySelector('#page-progress-bar');
const year = document.querySelector('#year');

function setMenu(open) {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  mobileNav.hidden = !open;
  document.body.classList.toggle('menu-open', open);
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

function updateProgress() {
  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
}

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

if (year) year.textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Keep the navigation's active section in sync with the customer's position on the page.
const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]')];
const navTargets = [...new Set(navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter((target) => target && target.id && target.id !== 'top'))];

if ('IntersectionObserver' in window && !motionReduced) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
        link.classList.toggle('is-active', active);
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  navTargets.forEach((target) => navObserver.observe(target));

  // The hero diagram highlights each stage as it passes through the visual focus area.
  const flowStages = [...document.querySelectorAll('.hero-art .flow-card, .hero-art .concierge-card, .hero-art .outcome-row')];
  const flowObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        flowStages.forEach((stage) => stage.classList.toggle('is-flow-active', stage === entry.target));
      } else {
        entry.target.classList.remove('is-flow-active');
      }
    });
  }, { rootMargin: '-28% 0px -38% 0px', threshold: 0.15 });
  flowStages.forEach((stage) => flowObserver.observe(stage));
}

const demoResponses = {
  price: {
    customer: 'How much does it cost?',
    reply: 'I can explain the relevant pricing using the business information available, clarify what is included and guide you to a quote or the right person if your needs are more specific.'
  },
  product: {
    customer: 'Which option is right for me?',
    reply: 'Tell me a little about what you need. I can use the business catalogue and service details to narrow down suitable options, explain the differences and help you decide what to do next.'
  },
  book: {
    customer: "I'd like to book.",
    reply: 'I can collect the service you need and your preferred date or time, then guide you through the booking process configured for this business. The team can step in when confirmation is needed.'
  }
};

const demoButtons = document.querySelectorAll('[data-demo]');
const demoCustomer = document.querySelector('#demo-customer-text');
const demoReply = document.querySelector('#demo-reply-text');

demoButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const response = demoResponses[button.dataset.demo];
    if (!response || !demoCustomer || !demoReply) return;
    demoCustomer.textContent = response.customer;
    demoReply.textContent = response.reply;
    [demoCustomer, demoReply].forEach((message) => {
      message.classList.remove('message-swap');
      void message.offsetWidth;
      message.classList.add('message-swap');
    });
    demoButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  });
});

const contactForm = document.querySelector('.contact-form');
contactForm?.querySelectorAll('input, select, textarea').forEach((field) => {
  field.addEventListener('invalid', () => field.setAttribute('aria-invalid', 'true'));
  field.addEventListener('input', () => {
    if (field.checkValidity()) field.removeAttribute('aria-invalid');
  });
});