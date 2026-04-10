// ============================================================
// Northshore STEM Center — 3D Print Request Logger
// Google Apps Script Webhook
// Deploy as: Web App > Execute as: Me > Who has access: Anyone
// ============================================================

var SHEET_NAME = 'Printer Log';

var HEADERS = [
  'Timestamp',
  'Date',
  'First Name',
  'Last Name',
  'W Number',
  'SLU Email',
  'Department',
  'Instructor',
  'Printer(s)',
  'File Name',
  'Material',
  'Est. Duration',
  'Filament Color',
  'Purpose / Description'
];

// ---- doPost: receives form submission -----------------------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    // Convert UTC timestamp to US Central time string
    var ts = new Date(data.timestamp);
    var centralTime = Utilities.formatDate(ts, 'America/Chicago', 'yyyy-MM-dd HH:mm:ss z');

    sheet.appendRow([
      centralTime,
      data.date        || '',
      data.firstName   || '',
      data.lastName    || '',
      data.wNumber     || '',
      data.email       || '',
      data.department  || '',
      data.instructor  || '',
      data.printers    || '',
      data.fileName    || '',
      data.material    || '',
      data.duration    || '',
      data.color       || '',
      data.purpose     || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- doGet: health check -----------------------------------
function doGet() {
  return ContentService.createTextOutput('Webhook is live.');
}

// ---- Helper: get or create the Printer Log sheet -----------
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeaders(sheet);
  }

  return sheet;
}

// ---- Setup headers with SLU green style --------------------
function setupHeaders(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);

  headerRange.setValues([HEADERS]);
  headerRange.setFontWeight('bold');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setBackground('#215732');  // SLU Green
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Set column widths
  var widths = [160, 100, 110, 110, 110, 180, 170, 160, 140, 160, 90, 140, 110, 300];
  widths.forEach(function(w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
}

// ---- Optional: daily email summary at 8 AM -----------------
// Set a time-driven trigger: Triggers > Add trigger > sendDailySummary > Time-driven > Day timer > 8am–9am
function sendDailySummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var targetDate = Utilities.formatDate(yesterday, 'America/Chicago', 'yyyy-MM-dd');

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1).filter(function(row) {
    return String(row[1]) === targetDate;  // col index 1 = Date
  });

  if (rows.length === 0) {
    GmailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      'STEM Center 3D Print Log — ' + targetDate,
      'No print requests were submitted on ' + targetDate + '.'
    );
    return;
  }

  var body = 'Print requests submitted on ' + targetDate + ':\n\n';
  rows.forEach(function(row, i) {
    body += (i + 1) + '. ' +
      row[2] + ' ' + row[3] +       // First + Last Name
      ' (' + row[4] + ')' +          // W Number
      ' — ' + row[8] +               // Printer(s)
      ' — ' + row[9] +               // File Name
      ' — ' + row[10] +              // Material
      ' — ' + row[11] + '\n';        // Duration
  });

  body += '\nTotal: ' + rows.length + ' request(s).\n';
  body += '\nView full log: ' + ss.getUrl();

  GmailApp.sendEmail(
    Session.getEffectiveUser().getEmail(),
    'STEM Center 3D Print Log — ' + targetDate + ' (' + rows.length + ' jobs)',
    body
  );
}
