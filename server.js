const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const DEFAULT_PETITION_FILE = path.join(__dirname, 'data', 'petitions.json');
const DEFAULT_MEMO_FILE = path.join(__dirname, 'data', 'advocacy-memo.pdf');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@periodtax.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ErMax7';
const PETITION_EMAIL = process.env.PETITION_EMAIL || 'gezahegnzerihun118@gmail.com';
const PETITION_SUBJECT = process.env.PETITION_SUBJECT || 'Tax-Free Periods Petition Signature';
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const requestHistory = new Map();

function ensureStorageFile(filePath = DEFAULT_PETITION_FILE, defaultContents = '[]') {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContents, 'utf8');
  }

  return filePath;
}

function readPetitions(filePath = DEFAULT_PETITION_FILE) {
  ensureStorageFile(filePath);

  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writePetitions(entries, filePath = DEFAULT_PETITION_FILE) {
  ensureStorageFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
}

function sanitizeField(value) {
  return String(value || '').trim();
}

function sanitizePetitionPayload(payload = {}) {
  const name = sanitizeField(payload.name);
  const email = sanitizeField(payload.email).toLowerCase();
  const region = sanitizeField(payload.region);
  const message = sanitizeField(payload.message);

  if (!name || !email || !email.includes('@')) {
    throw new Error('A valid name and email are required.');
  }

  if (message.length > 800) {
    throw new Error('Message is too long. Keep it under 800 characters.');
  }

  return {
    name,
    email,
    region: region || 'Not specified',
    message: message || 'No message provided.',
  };
}

function createPetitionRecord(payload = {}) {
  const clean = sanitizePetitionPayload(payload);

  return {
    ...clean,
    submittedAt: new Date().toISOString(),
    campaign: 'Tax-Free Periods',
  };
}

function buildPetitionPdf(doc, petitions) {
  doc.fontSize(20).text('Tax-Free Periods Petition', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Recorded signatures: ${petitions.length}`);
  doc.moveDown();

  petitions.forEach((entry, index) => {
    doc.fontSize(12).text(`${index + 1}. ${entry.name} <${entry.email}>`);
    doc.fontSize(10).text(`Region: ${entry.region}`);
    doc.fontSize(10).text(`Submitted: ${entry.submittedAt}`);
    doc.fontSize(10).text(`Message: ${entry.message}`);
    doc.moveDown();
  });
}

function buildMemoPdf(filePath) {
  return new Promise((resolve, reject) => {
    try {
      ensureStorageFile(filePath, '');
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(24).text('Tax-Free Periods', { align: 'center' });
      doc.fontSize(18).text('Advocacy Memo', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('A policy pathway to end period poverty and remove the VAT burden on menstrual hygiene products in Ethiopia.', {
        align: 'left',
      });
      doc.moveDown();
      doc.fontSize(13).text('Summary', { underline: true });
      doc.fontSize(11).text('In Ethiopia, menstruation is more than a biological process—it is a barrier to opportunity. More than 70% of women and girls lack access to dignified, affordable menstrual care. The continued tax burden on sanitary products keeps essential health products out of reach for the most vulnerable households.');
      doc.moveDown();
      doc.fontSize(13).text('Policy Recommendation', { underline: true });
      doc.fontSize(11).text('Zero-rate VAT on menstrual hygiene products, remove duties on local raw materials, and create a national public provision plan for schools, clinics, prisons, and displacement camps.');
      doc.moveDown();
      doc.fontSize(13).text('Why it matters', { underline: true });
      doc.fontSize(11).text('Reduced absenteeism, improved health outcomes, stronger female labor participation, and a more resilient economy. Every girl should be able to learn, work, and participate without shame or exclusion.');
      doc.moveDown();
      doc.fontSize(13).text('Call to Action', { underline: true });
      doc.fontSize(11).text('Support zero-rated menstrual hygiene products and invest in dignity, education, and human rights for every woman and girl in Ethiopia.');
      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

function rateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const history = requestHistory.get(ip) || [];
  const recent = history.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please wait a moment and try again.' });
  }

  recent.push(now);
  requestHistory.set(ip, recent);
  return next();
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin area"');
    return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  }

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Admin area"');
    return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
  }

  return next();
}

function validatePetitionBody(req, res, next) {
  const { name, email, region, message } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }
  if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email is required.' });
  }
  if (typeof region !== 'string' && region !== undefined) {
    return res.status(400).json({ success: false, error: 'Region must be a string.' });
  }
  if (typeof message === 'string' && message.length > 800) {
    return res.status(400).json({ success: false, error: 'Message too long.' });
  }
  return next();
}

function buildCsv(entries) {
  const rows = [['Name', 'Email', 'Region', 'Message', 'SubmittedAt', 'Campaign']];

  entries.forEach((entry) => {
    rows.push([
      entry.name || '',
      entry.email || '',
      entry.region || '',
      (entry.message || '').replace(/\n/g, ' '),
      entry.submittedAt || '',
      entry.campaign || 'Tax-Free Periods',
    ]);
  });

  return rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function createApp(options = {}) {
  const petitionFile = options.petitionFile || process.env.PETITION_FILE || DEFAULT_PETITION_FILE;
  const baseUrl = options.baseUrl || process.env.BASE_URL || 'http://localhost:3000';

  const app = express();

  app.use(rateLimit);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, baseUrl, timestamp: new Date().toISOString() });
  });

  app.get('/advocacy-memo.pdf', async (_req, res) => {
    try {
      if (!fs.existsSync(DEFAULT_MEMO_FILE)) {
        await buildMemoPdf(DEFAULT_MEMO_FILE);
      }
      res.download(DEFAULT_MEMO_FILE, 'tax-free-periods-advocacy-memo.pdf');
    } catch (error) {
      res.status(500).json({ success: false, error: 'Unable to generate advocacy memo PDF.' });
    }
  });

  app.get('/api/petitions', (_req, res) => {
    const petitions = readPetitions(petitionFile);
    res.json({ petitions, count: petitions.length });
  });

  app.post('/api/petitions', validatePetitionBody, (req, res) => {
    try {
      const record = createPetitionRecord(req.body || {});
      const entries = readPetitions(petitionFile);
      entries.push(record);
      writePetitions(entries, petitionFile);

      res.status(201).json({
        success: true,
        petition: record,
        count: entries.length,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  });

  app.get('/api/petitions/export.pdf', (_req, res) => {
    const petitions = readPetitions(petitionFile);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tax-free-periods-petitions.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    buildPetitionPdf(doc, petitions);
    doc.end();
  });

  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const petitions = readPetitions(petitionFile);
    const regionSummary = petitions.reduce((acc, entry) => {
      const region = entry.region || 'Not specified';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSignatures: petitions.length,
      regionSummary,
      recent: petitions.slice(-5).reverse(),
    });
  });

  app.get('/api/admin/export.csv', requireAdmin, (_req, res) => {
    const petitions = readPetitions(petitionFile);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tax-free-periods-signatures.csv"');
    res.send(buildCsv(petitions));
  });

  app.get('/admin', requireAdmin, (_req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
  });

  app.use(express.static(__dirname));

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  ensureStorageFile(DEFAULT_PETITION_FILE);
  if (!fs.existsSync(DEFAULT_MEMO_FILE)) {
    buildMemoPdf(DEFAULT_MEMO_FILE).catch((error) => {
      console.error('Unable to generate memo PDF at startup:', error);
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Tax-Free Periods app listening on http://localhost:${port}`);
  });
}

module.exports = app;
module.exports.default = app;
module.exports.createApp = createApp;
module.exports.ensureStorageFile = ensureStorageFile;
module.exports.sanitizePetitionPayload = sanitizePetitionPayload;
module.exports.readPetitions = readPetitions;
module.exports.writePetitions = writePetitions;
module.exports.createPetitionRecord = createPetitionRecord;
module.exports.requireAdmin = requireAdmin;
module.exports.buildCsv = buildCsv;
