const WHATSAPP_NUMBER = '';

const waLinks = document.querySelectorAll('[data-whatsapp-cta]');
const progress = document.querySelector('#page-progress-bar');
const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
const closeMenuLinks = document.querySelectorAll('[data-close-menu]');
const year = document.querySelector('#year');
const chatChoices = document.querySelector('#chat-choices');
const chatMessages = document.querySelector('#chat-messages');

function setupWhatsAppLinks() {
  waLinks.forEach((link) => {
    if (WHATSAPP_NUMBER.trim()) {
      const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '');
      const message = encodeURIComponent('Hi DigiGuru, I would like to understand how a conversational sales system could work for my business.');
      link.href = `https://wa.me/${cleanNumber}?text=${message}`;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.removeAttribute('aria-disabled');
    } else {
      link.href = '#contact';
      link.removeAttribute('target');
      link.setAttribute('aria-disabled', 'true');
    }
  });
}

function updateProgress() {
  const scrollTop = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${height > 0 ? (scrollTop / height) * 100 : 0}%`;
}

function toggleMenu(force) {
  const open = typeof force === 'boolean' ? force : menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
}

menuButton?.addEventListener('click', () => toggleMenu());
closeMenuLinks.forEach((link) => link.addEventListener('click', () => toggleMenu(false)));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') toggleMenu(false);
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const responseLibrary = {
  'Show me the best options': 'I can narrow them down using the business catalogue and the reason you are buying. Then I can guide you to the right option without making you start over.',
  'Check Saturday availability': 'I can move this conversation toward the calendar, keep the customer context attached, and hand the team the details when a human needs to step in.'
};

chatChoices?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-choice]');
  if (!button) return;
  const choice = button.dataset.choice;
  button.disabled = true;

  const customer = document.createElement('div');
  customer.className = 'chat-message customer';
  customer.innerHTML = `<small>Customer</small><p>${choice}</p>`;
  chatMessages.appendChild(customer);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  window.setTimeout(() => {
    const agent = document.createElement('div');
    agent.className = 'chat-message agent';
    agent.innerHTML = `<small>Concierge</small><p>${responseLibrary[choice] || 'I can guide the customer to the next useful action while keeping the conversation connected to the business.'}</p>`;
    chatMessages.appendChild(agent);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    button.disabled = false;
  }, 520);
});

setupWhatsAppLinks();
updateProgress();
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
if (year) year.textContent = new Date().getFullYear();
