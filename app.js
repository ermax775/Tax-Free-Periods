const PETITION_EMAIL = 'gezahegnzerihun118@gmail.com';
const PETITION_SUBJECT = 'Tax-Free Periods Petition Signature';

function sanitizeField(value) {
  return (value || '').trim();
}

function showToast(message) {
  const existing = document.getElementById('toast');
  if (!existing) return;

  existing.textContent = message;
  existing.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => existing.classList.remove('show'), 2600);
}

function shareCurrentPage(message = 'Campaign link copied to clipboard.') {
  const shareUrl = window.location.href;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast(message))
      .catch(() => {
        window.prompt('Copy the campaign link:', shareUrl);
        showToast('Campaign link ready to copy.');
      });
    return;
  }

  window.prompt('Copy the campaign link:', shareUrl);
  showToast('Campaign link ready to copy.');
}

async function submitPetition(formData) {
  const response = await fetch('/api/petitions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Unable to submit the petition.');
  }

  return result;
}

function createPetitionRecord(formData) {
  const name = sanitizeField(formData.name);
  const email = sanitizeField(formData.email);
  const region = sanitizeField(formData.region) || 'Not specified';
  const message = sanitizeField(formData.message) || 'No message provided.';

  const entry = {
    name,
    email,
    region,
    message,
    submittedAt: new Date().toISOString(),
    campaign: 'Tax-Free Periods',
  };

  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `tax-free-periods-petition-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);

  return entry;
}

function buildMailtoLink(formData) {
  const name = sanitizeField(formData.name);
  const email = sanitizeField(formData.email);
  const region = sanitizeField(formData.region) || 'Not specified';
  const message = sanitizeField(formData.message) || 'No message provided.';

  const subject = encodeURIComponent(`${PETITION_SUBJECT}: ${name || 'Supporter'}`);
  const body = encodeURIComponent(
    'Tax-Free Periods Petition Signature\n\n' +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Region: ${region}\n` +
    `Reason: ${message}\n\n` +
    'This signature was submitted through the campaign website.'
  );

  return `mailto:${PETITION_EMAIL}?subject=${subject}&body=${body}`;
}

async function handlePetitionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = {
    name: form.querySelector('#petition-name')?.value || '',
    email: form.querySelector('#petition-email')?.value || '',
    region: form.querySelector('#petition-region')?.value || '',
    message: form.querySelector('#petition-message')?.value || '',
  };

  const name = sanitizeField(formData.name);
  const email = sanitizeField(formData.email);

  if (!name || !email || !email.includes('@')) {
    showToast('Please enter your name and a valid email address.');
    return;
  }

  try {
    const record = createPetitionRecord(formData);
    const result = await submitPetition(formData);
    const mailtoUrl = buildMailtoLink(record);

    window.location.href = mailtoUrl;
    showToast(`Petition submitted successfully. ${result.count} signatures captured.`);
    form.reset();
  } catch (error) {
    showToast(error.message || 'Unable to submit, but a draft is still ready.');
    const fallback = buildMailtoLink(formData);
    window.location.href = fallback;
    form.reset();
  }
}

function attachPetitionHandlers() {
  const form = document.getElementById('petition-form');
  if (form) {
    form.addEventListener('submit', handlePetitionSubmit);
  }

  const shareCampaignButton = document.getElementById('share-campaign');
  if (shareCampaignButton) {
    shareCampaignButton.addEventListener('click', () => shareCurrentPage('Campaign link copied to clipboard.'));
  }

  const sharePetitionButton = document.getElementById('share-petition-button');
  if (sharePetitionButton) {
    sharePetitionButton.addEventListener('click', () => shareCurrentPage('Petition link copied to clipboard.'));
  }

  const downloadButton = document.getElementById('download-memo-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', async () => {
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
    });
  }

  const downloadHeroMemo = document.getElementById('download-memo');
  if (downloadHeroMemo) {
    downloadHeroMemo.addEventListener('click', async () => {
      const pdfResponse = await fetch('/api/petitions/export.pdf');
      if (!pdfResponse.ok) {
        window.location.href = 'advocacy-memo.html';
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
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attachPetitionHandlers();
});
