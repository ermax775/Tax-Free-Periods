const navLinks = document.querySelector('.nav-links');
const menuButton = document.querySelector('.mobile-toggle');
const heroTitle = document.querySelector('.hero-title');
const revealElems = document.querySelectorAll('.reveal');
const wordFragments = Array.from(document.querySelectorAll('.word-reveal')).map((item) => item.querySelector('span'));

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

if (heroTitle) {
  setTimeout(() => heroTitle.classList.add('is-visible'), 180);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, { threshold: 0.18 });

revealElems.forEach((el) => observer.observe(el));

const slider = document.querySelector('#schoolGapSlider');
const costInput = document.querySelector('#monthlyCost');
const schoolGapLabel = document.querySelector('#schoolGapLabel');
const monthlyCostLabel = document.querySelector('#monthlyCostLabel');
const savedSchools = document.querySelector('#savedSchools');
const incomeGain = document.querySelector('#incomeGain');
const taxSavings = document.querySelector('#taxSavings');

const formatCurrency = (value) => `ETB ${value.toLocaleString()}`;

function updateCalculator() {
  const gapDays = Number(slider?.value || 18);
  const monthlyCost = Number(costInput?.value || 320);

  if (schoolGapLabel) schoolGapLabel.textContent = `${gapDays} days`;
  if (monthlyCostLabel) monthlyCostLabel.textContent = `ETB ${monthlyCost}`;

  const schoolDaysRecovered = Math.round((gapDays * 12 * 0.6));
  const annualSavings = monthlyCost * 12 * (gapDays / 30);
  const modestIncome = Math.round(annualSavings * 0.42);

  if (savedSchools) savedSchools.textContent = `${schoolDaysRecovered}k+`;
  if (incomeGain) incomeGain.textContent = formatCurrency(modestIncome);
  if (taxSavings) taxSavings.textContent = formatCurrency(Math.round(annualSavings));
}

if (slider) {
  slider.addEventListener('input', updateCalculator);
}

if (costInput) {
  costInput.addEventListener('input', updateCalculator);
}

updateCalculator();

const toast = document.querySelector('#toast');
const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('show'), 2200);
};

const petitionForm = document.querySelector('#petition-form');
if (petitionForm) {
  petitionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showToast('Petition signed. Your voice has been recorded.');
    petitionForm.reset();
  });
}

const shareButton = document.querySelector('#share-button');
if (shareButton) {
  shareButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Campaign link copied to clipboard.');
    } catch (error) {
      showToast('Share link ready to copy from your browser.');
    }
  });
}

const memoButton = document.querySelector('#memo-button');
if (memoButton) {
  memoButton.addEventListener('click', () => {
    window.open('advocacy-memo.html', '_blank', 'noopener');
  });
}

wordFragments.forEach((word, index) => {
  word.style.transitionDelay = `${(index + 1) * 90}ms`;
});
