/* ============================================================
   NORTHSHORE STEM CENTER - 3D Print Request App
   Vanilla JS - no frameworks, no build step

   Created by: Nikhil Shah
   Contact:    nikhilkrsha@gmail.com
   ============================================================ */

'use strict';

// ---- Config ------------------------------------------------
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby7acP0ZE98qFnqLKSXHq-t4Gd2ch_-h72ncZZ8YhLfGrd_R0WXmaQJYgfVOozik96KlQ/exec';

// Printer list - add more printers here if the lab expands
const PRINTERS = ['Printer 1', 'Printer 2', 'Printer 3', 'Printer 4'];

// ---- State -------------------------------------------------
let selectionMode = 'single'; // 'single' | 'multi'
let selectedPrinters = new Set();

// ---- DOM refs ----------------------------------------------
const form            = document.getElementById('print-form');
const submitBtn       = document.getElementById('submit-btn');
const submitLabel     = document.getElementById('submit-label');
const successScreen   = document.getElementById('success-screen');
const printerGrid     = document.getElementById('printer-grid');
const printerHint     = document.getElementById('printer-hint');
const btnSingle       = document.getElementById('btn-single');
const btnMulti        = document.getElementById('btn-multi');
const newRequestBtn   = document.getElementById('new-request-btn');
const footerYear      = document.getElementById('footer-year');
const fileEntriesEl   = document.getElementById('file-entries');
const addFileBtnEl    = document.getElementById('add-file-btn');

// ---- Init --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  initFileEntries();
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

// ---- File entries ------------------------------------------
function initFileEntries() {
  fileEntriesEl.innerHTML = '';
  addFileEntry();
}

function addFileEntry() {
  const entry = document.createElement('div');
  entry.className = 'file-entry';

  const printerOptions = PRINTERS.map(p =>
    `<option value="${p}">${p}</option>`
  ).join('');

  entry.innerHTML = `
    <div class="select-wrap file-printer-wrap">
      <select class="file-printer-select">
        <option value="">Printer...</option>
        ${printerOptions}
      </select>
      <svg class="select-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
    </div>
    <input type="text" class="file-name-input" placeholder="filename.stl" autocomplete="off" />
    <button type="button" class="remove-file-btn" aria-label="Remove file">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
    </button>
  `;

  entry.querySelector('.remove-file-btn').addEventListener('click', () => {
    if (fileEntriesEl.querySelectorAll('.file-entry').length > 1) {
      entry.remove();
      updateRemoveBtns();
    }
  });

  fileEntriesEl.appendChild(entry);
  updateRemoveBtns();
}

function updateRemoveBtns() {
  const entries = fileEntriesEl.querySelectorAll('.file-entry');
  entries.forEach(e => {
    const btn = e.querySelector('.remove-file-btn');
    btn.disabled = entries.length === 1;
  });
}

function collectFileEntries() {
  return Array.from(fileEntriesEl.querySelectorAll('.file-entry'))
    .map(entry => ({
      printer:  entry.querySelector('.file-printer-select').value,
      fileName: entry.querySelector('.file-name-input').value.trim(),
    }))
    .filter(f => f.fileName.length > 0);
}

addFileBtnEl.addEventListener('click', addFileEntry);

// ---- Validation --------------------------------------------
const validators = {
  firstName:  v => v.trim().length > 0 || 'First name is required.',
  lastName:   v => v.trim().length > 0 || 'Last name is required.',
  wNumber:    v => !v.trim() || /^[Ww]\d{7,8}$/.test(v.trim()) || 'Enter a valid W Number format (e.g. W12345678).',
  email:      v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
  department: v => v !== '' || 'Please select a department.',
  duration:   v => v !== '' || 'Please select an estimated print time.',
  purpose:    v => v.trim().length >= 8 || 'Description must be at least 8 characters.',
  printDate:  v => v !== '' || 'Date is required.',
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
  clearError('fileName');
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

  // File entries - at least one file name required
  const files = collectFileEntries();
  if (files.length === 0) {
    document.getElementById('err-fileName').textContent = 'At least one file name is required.';
    if (!firstErrorEl) firstErrorEl = fileEntriesEl;
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

  submitBtn.disabled = true;
  submitLabel.textContent = 'Saving...';

  const payload = buildPayload();

  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
    } catch (_) {
      // Intentionally silenced - form works without backend
    }
  }

  showSuccess(payload);
});

function buildPayload() {
  const now = new Date();
  const files = collectFileEntries();
  const fileNameStr = files.map(f =>
    f.printer ? `${f.printer}: ${f.fileName}` : f.fileName
  ).join(', ');

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
    fileName:   fileNameStr,
    duration:   getFieldValue('duration'),
    color:      getFieldValue('filamentColor').trim(),
    purpose:    getFieldValue('purpose').trim(),
  };
}

// ---- Success screen ----------------------------------------
function showSuccess(p) {
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
    <strong>File(s):</strong> ${escHtml(p.fileName)}<br>
    <strong>Est. Duration:</strong> ${escHtml(p.duration)}${p.color ? ' - ' + escHtml(p.color) : ''}<br>
    ${p.department ? `<strong>Dept:</strong> ${escHtml(p.department)}<br>` : ''}
    ${p.instructor ? `<strong>Instructor:</strong> ${escHtml(p.instructor)}<br>` : ''}
    <strong>Submitted:</strong> ${new Date(p.timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}
  `;

  form.classList.add('hidden');
  successScreen.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- New request -------------------------------------------
newRequestBtn.addEventListener('click', resetForm);

function resetForm() {
  form.reset();
  setTodayDate();

  selectedPrinters.clear();
  refreshPrinterCards();
  updateHint();

  setMode('single');

  initFileEntries();

  clearAllErrors();

  submitBtn.disabled = false;
  submitLabel.textContent = 'Submit Print Request';

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
