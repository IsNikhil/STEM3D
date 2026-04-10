/* ============================================================
   NORTHSHORE STEM CENTER — 3D Print Request App
   Vanilla JS — no frameworks, no build step

   Created by: Nikhil Shah
   Contact:    nikhilkrsha@gmail.com
   ============================================================ */

'use strict';

// ---- Config ------------------------------------------------
const WEBHOOK_URL = ''; // Paste your Google Apps Script Web App URL here

// Printer list — add more printers here if the lab expands
const PRINTERS = ['Printer 1', 'Printer 2', 'Printer 3', 'Printer 4'];

// ---- State -------------------------------------------------
let selectionMode = 'single'; // 'single' | 'multi'
let selectedPrinters = new Set();

// ---- DOM refs ----------------------------------------------
const form          = document.getElementById('print-form');
const submitBtn     = document.getElementById('submit-btn');
const submitLabel   = document.getElementById('submit-label');
const successScreen = document.getElementById('success-screen');
const printerGrid   = document.getElementById('printer-grid');
const printerHint   = document.getElementById('printer-hint');
const btnSingle     = document.getElementById('btn-single');
const btnMulti      = document.getElementById('btn-multi');
const newRequestBtn = document.getElementById('new-request-btn');
const footerYear    = document.getElementById('footer-year');

// ---- Init --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  if (footerYear) footerYear.textContent = new Date().getFullYear();
  updateHint();
});

function setTodayDate() {
  const dateInput = document.getElementById('printDate');
  if (!dateInput) return;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${y}-${m}-${d}`;
}

// ---- Mode toggle -------------------------------------------
btnSingle.addEventListener('click', () => setMode('single'));
btnMulti.addEventListener('click',  () => setMode('multi'));

function setMode(mode) {
  selectionMode = mode;
  btnSingle.classList.toggle('active', mode === 'single');
  btnMulti.classList.toggle('active',  mode === 'multi');

  // When switching to single, keep at most 1 printer
  if (mode === 'single' && selectedPrinters.size > 1) {
    const first = [...selectedPrinters][0];
    selectedPrinters.clear();
    selectedPrinters.add(first);
    refreshPrinterCards();
    updateHint();
  }
}

// ---- Printer cards -----------------------------------------
printerGrid.querySelectorAll('.printer-card').forEach(card => {
  card.addEventListener('click', () => {
    const name = card.dataset.printer;
    if (selectionMode === 'single') {
      selectedPrinters.clear();
      selectedPrinters.add(name);
    } else {
      if (selectedPrinters.has(name)) {
        selectedPrinters.delete(name);
      } else {
        selectedPrinters.add(name);
      }
    }
    refreshPrinterCards();
    updateHint();
    clearError('printer');
  });
});

function refreshPrinterCards() {
  printerGrid.querySelectorAll('.printer-card').forEach(card => {
    const selected = selectedPrinters.has(card.dataset.printer);
    card.setAttribute('aria-pressed', String(selected));
  });
}

function updateHint() {
  if (selectedPrinters.size === 0) {
    printerHint.textContent = 'No printer selected';
    return;
  }
  printerHint.innerHTML = '';
  selectedPrinters.forEach(name => {
    const badge = document.createElement('span');
    badge.className = 'hint-badge';
    badge.textContent = name;
    printerHint.appendChild(badge);
  });
}

// ---- Validation --------------------------------------------
const validators = {
  firstName:  v => v.trim().length > 0       || 'First name is required.',
  lastName:   v => v.trim().length > 0       || 'Last name is required.',
  wNumber:    v => /^[Ww]\d{7,8}$/.test(v.trim()) || 'Enter a valid W Number (e.g. W12345678).',
  email:      v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid SLU email address.',
  department: v => v !== ''                  || 'Please select a department.',
  fileName:   v => v.trim().length > 0       || 'File name is required.',
  duration:   v => v !== ''                  || 'Please select an estimated print time.',
  purpose:    v => v.trim().length >= 8      || 'Description must be at least 8 characters.',
  printDate:  v => v !== ''                  || 'Date is required.',
};

function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setError(fieldId, message) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById(`err-${fieldId}`);
  if (el) el.classList.add('error');
  if (errEl) errEl.textContent = message;
}

function clearError(fieldId) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById(`err-${fieldId}`);
  if (el) el.classList.remove('error');
  if (errEl) errEl.textContent = '';
}

function clearAllErrors() {
  Object.keys(validators).forEach(clearError);
  clearError('printer');
}

function validate() {
  let valid = true;
  let firstErrorEl = null;

  clearAllErrors();

  // Field validators
  Object.entries(validators).forEach(([fieldId, fn]) => {
    const result = fn(getFieldValue(fieldId));
    if (result !== true) {
      setError(fieldId, result);
      if (!firstErrorEl) firstErrorEl = document.getElementById(fieldId);
      valid = false;
    }
  });

  // Printer selection
  if (selectedPrinters.size === 0) {
    document.getElementById('err-printer').textContent = 'Please select at least one printer.';
    if (!firstErrorEl) firstErrorEl = printerGrid;
    valid = false;
  }

  // Agreement checkbox
  const agreed = document.getElementById('agreement').checked;
  if (!agreed) {
    alert('Please read and accept the lab safety agreement before submitting.');
    valid = false;
  }

  if (firstErrorEl) {
    firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

// ---- Submission --------------------------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validate()) return;

  // Disable submit
  submitBtn.disabled = true;
  submitLabel.textContent = 'Saving…';

  const payload = buildPayload();

  // Fire-and-forget to Google Sheet
  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (_) {
      // Intentionally silenced — form works without backend
    }
  }

  showSuccess(payload);
});

function buildPayload() {
  const now = new Date();
  return {
    timestamp:  now.toISOString(),
    date:       getFieldValue('printDate'),
    firstName:  getFieldValue('firstName').trim(),
    lastName:   getFieldValue('lastName').trim(),
    wNumber:    getFieldValue('wNumber').trim().toUpperCase(),
    email:      getFieldValue('email').trim().toLowerCase(),
    department: getFieldValue('department'),
    instructor: getFieldValue('instructor').trim(),
    printers:   [...selectedPrinters].join(', '),
    fileName:   getFieldValue('fileName').trim(),
    duration:   getFieldValue('duration'),
    color:      getFieldValue('filamentColor').trim(),
    purpose:    getFieldValue('purpose').trim(),
  };
}

// ---- Success screen ----------------------------------------
function showSuccess(p) {
  // Populate
  document.getElementById('success-name').textContent =
    `${p.firstName} ${p.lastName}`;

  const badgesEl = document.getElementById('success-badges');
  badgesEl.innerHTML = '';
  [...selectedPrinters].forEach(name => {
    const span = document.createElement('span');
    span.className = 'success-badge';
    span.textContent = name;
    badgesEl.appendChild(span);
  });

  document.getElementById('success-details').innerHTML = `
    <strong>File:</strong> ${escHtml(p.fileName)}<br>
    <strong>Est. Duration:</strong> ${escHtml(p.duration)}${p.color ? ' · ' + escHtml(p.color) : ''}<br>
    ${p.department ? `<strong>Dept:</strong> ${escHtml(p.department)}<br>` : ''}
    ${p.instructor ? `<strong>Instructor:</strong> ${escHtml(p.instructor)}<br>` : ''}
    <strong>Submitted:</strong> ${new Date(p.timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}
  `;

  // Swap views
  form.classList.add('hidden');
  successScreen.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- New request -------------------------------------------
newRequestBtn.addEventListener('click', resetForm);

function resetForm() {
  form.reset();
  setTodayDate();

  // Reset printer state
  selectedPrinters.clear();
  refreshPrinterCards();
  updateHint();

  // Reset mode to single
  setMode('single');

  // Clear validation
  clearAllErrors();

  // Re-enable submit
  submitBtn.disabled = false;
  submitLabel.textContent = 'Submit Print Request';

  // Swap views
  successScreen.classList.add('hidden');
  form.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Utils -------------------------------------------------
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
