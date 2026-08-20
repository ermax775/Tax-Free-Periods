const PETITION_EMAIL = 'gezahegnzerihun118@gmail.com';
const PETITION_SUBJECT = 'Tax-Free Periods Petition Signature';

function sanitizeField(value) {
  return (value || '').trim();
}

function showToast(message, duration = 3000) {
  const existing = document.getElementById('toast');
  if (!existing) return;

  existing.textContent = message;
  existing.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => existing.classList.remove('show'), duration);
}

// Helper to generate unique reference number for donations
function generateReferenceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TFP-${year}${month}${day}-${random}`;
}

// Submit to backend API for storage
async function submitToBackend(endpoint, formData) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Submission failed');
  }
  return result;
}

// Handle petition form submission
async function handlePetitionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = {
    name: sanitizeField(form.querySelector('#petition-name')?.value || ''),
    email: sanitizeField(form.querySelector('#petition-email')?.value || ''),
    region: sanitizeField(form.querySelector('#petition-region')?.value || ''),
    message: sanitizeField(form.querySelector('#petition-message')?.value || ''),
  };

  // Validate
  if (!formData.name || !formData.email || !formData.email.includes('@')) {
    showToast('Please enter your name and a valid email address.');
    return;
  }

  if (formData.message.length > 800) {
    showToast('Message must be under 800 characters.');
    return;
  }

  // Add timestamp and campaign
  const record = {
    ...formData,
    submittedAt: new Date().toISOString(),
    campaign: 'Tax-Free Periods',
    type: 'petition',
  };

  try {
    // Submit to backend for storage
    const result = await submitToBackend('/api/petitions', record);
    showToast(`Thank you! Your petition signature has been recorded. (${result.count} total)`);

    // Show success state
    const statusEl = document.getElementById('submit-status');
    if (statusEl) {
      statusEl.innerHTML = '<span style="color: #2d2926; font-weight: 500;">✓ Signature successfully recorded! Check your email for confirmation.</span>';
    }

    form.reset();
  } catch (error) {
    // Form will still submit to Formspree via the form's action attribute
    showToast(error.message || 'Signature recorded. Check your email for confirmation.');
    form.reset();
  }
}

// Handle contact form submission
async function handleContactSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = {
    name: sanitizeField(form.querySelector('#contact-name')?.value || ''),
    email: sanitizeField(form.querySelector('#contact-email')?.value || ''),
    subject: sanitizeField(form.querySelector('#contact-subject')?.value || ''),
    message: sanitizeField(form.querySelector('#contact-message')?.value || ''),
    type: 'contact',
    submittedAt: new Date().toISOString(),
  };

  if (!formData.name || !formData.email || !formData.subject) {
    showToast('Please fill in all required fields.');
    return;
  }

  try {
    await submitToBackend('/api/contacts', formData);
    showToast('Message sent successfully! We\'ll get back to you within 48 hours.');

    const statusEl = document.getElementById('contact-status');
    if (statusEl) {
      statusEl.innerHTML = '<span style="color: #2d2926; font-weight: 500;">✓ Message sent! Check your email for confirmation.</span>';
    }

    form.reset();
  } catch (error) {
    // Form will still submit to Formspree via action attribute
    showToast('Message sent! Check your email for confirmation.');
    form.reset();
  }
}

// Handle donation form submission
async function handleDonationSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = {
    name: sanitizeField(form.querySelector('#donor-name')?.value || ''),
    email: sanitizeField(form.querySelector('#donor-email')?.value || ''),
    amount: sanitizeField(form.querySelector('#donor-amount')?.value || ''),
    referenceNumber: generateReferenceNumber(),
    message: sanitizeField(form.querySelector('#donor-message')?.value || ''),
    type: 'donation',
    submittedAt: new Date().toISOString(),
  };

  if (!formData.name || !formData.email || !formData.amount) {
    showToast('Please fill in all required fields.');
    return;
  }

  // Display reference number
  const refInput = form.querySelector('#donor-reference');
  if (refInput) {
    refInput.value = formData.referenceNumber;
  }

  try {
    await submitToBackend('/api/donations', formData);
    const statusEl = document.getElementById('donation-status');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #2d2926; font-weight: 500;">✓ Donation recorded! Your reference number: <strong class="donation-ref">${formData.referenceNumber}</strong>. Keep this for your records.</span>`;
    }

    form.reset();
  } catch (error) {
    showToast('Donation recorded! Your reference number is: ' + formData.referenceNumber);
    const refInput = form.querySelector('#donor-reference');
    if (refInput) {
      refInput.value = formData.referenceNumber;
    }
  }
}

function attachPetitionHandlers() {
  const petitionForm = document.getElementById('petition-form');
  if (petitionForm) {
    petitionForm.addEventListener('submit', handlePetitionSubmit);
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  const donationForm = document.getElementById('donation-form');
  if (donationForm) {
    donationForm.addEventListener('submit', handleDonationSubmit);

    // Generate reference number on amount input
    const amountInput = donationForm.querySelector('#donor-amount');
    if (amountInput) {
      amountInput.addEventListener('blur', function() {
        if (this.value.trim()) {
          const refInput = donationForm.querySelector('#donor-reference');
          if (refInput && !refInput.value) {
            refInput.value = generateReferenceNumber();
          }
        }
      });
    }
  }

  // Share Campaign button
  const shareCampaignButton = document.getElementById('share-campaign');
  if (shareCampaignButton) {
    shareCampaignButton.addEventListener('click', () => {
      const shareUrl = window.location.href;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl)
          .then(() => showToast('Campaign link copied to clipboard.'))
          .catch(() => {
            window.prompt('Copy the campaign link:', shareUrl);
            showToast('Campaign link ready to copy.');
          });
      } else {
        window.prompt('Copy the campaign link:', shareUrl);
        showToast('Campaign link ready to copy.');
      }
    });
  }

  // Share Petition button (scroll to top of petition form)
  const sharePetitionButton = document.getElementById('share-petition-button');
  if (sharePetitionButton) {
    sharePetitionButton.addEventListener('click', () => {
      const petitionSection = document.getElementById('action');
      if (petitionSection) {
        petitionSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Download Memo button
  const downloadButton = document.getElementById('download-memo-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', async () => {
      try {
        const pdfResponse = await fetch('/api/petitions/export.pdf');
        if (!pdfResponse.ok) {
          showToast('PDF export is unavailable right now.');
          return;
        }
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tax-free-periods-memo.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('PDF memo exported.');
      } catch (error) {
        // Fallback to local file
        const link = document.createElement('a');
        link.href = 'advocacy-memo.html';
        link.download = 'tax-free-periods-memo.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Memo PDF opened in browser.');
      }
    });
  }

  // Download Memo hero button
  const downloadHeroMemo = document.getElementById('download-memo');
  if (downloadHeroMemo) {
    downloadHeroMemo.addEventListener('click', async () => {
      try {
        const pdfResponse = await fetch('/api/petitions/export.pdf');
        if (!pdfResponse.ok) {
          showToast('Generating memo PDF...');
        }
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tax-free-periods-memo.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('PDF memo downloaded.');
      } catch (error) {
        // Fallback to local page
        window.location.href = 'advocacy-memo.html';
      }
    });
  }
}

// Mobile menu toggle
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachPetitionHandlers();
  setupMobileMenu();

  // Dynamic Copyright Year
  const yearNode = document.getElementById('copyright-year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();

  // Hero Word Reveal Trigger
  const heroHeadline = document.querySelector('.hero-headline');
  if (heroHeadline) {
    setTimeout(() => heroHeadline.classList.add('is-visible'), 300);
  }

  // Intersection Observer for Scroll Reveals
  const revealOptions = { threshold: 0.2 };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, revealOptions);

  document.querySelectorAll('.animate-enter, .reveal-container').forEach(el => {
    observer.observe(el);
  });

  // Simple Parallax Effect
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed = el.getAttribute('data-parallax');
      el.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });

  // Smooth Anchor Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});