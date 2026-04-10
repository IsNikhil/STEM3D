# Northshore STEM Center — 3D Print Request App

A kiosk-mode web app for the iPad next to the 3D printers. Students fill out this form before every print job. Submissions are saved to a Google Sheet via Google Apps Script.

---

## Quick Links
- **STEM Center website:** https://www.southeastern.edu/college-of-science-and-technology/northshore-regional-stem-center/
- **Contact / issues:** stemcenter@selu.edu

---

## 1. Create the Google Sheet & Deploy the Apps Script

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
   Name it something like **"STEM Center 3D Print Log"**.

2. Open **Extensions → Apps Script**.

3. Delete any default code in the editor and paste the contents of `google-apps-script/Code.gs`.

4. Click **Save** (💾), then click **Deploy → New deployment**.

5. Settings:
   - **Type:** Web App
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone

6. Click **Deploy**. Authorize when prompted.

7. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/.../exec`).

---

## 2. Paste the Webhook URL

Open `app.js` and find line 6:

```js
const WEBHOOK_URL = ''; // Paste your Google Apps Script Web App URL here
```

Replace the empty string with your URL:

```js
const WEBHOOK_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

Save the file and redeploy to GitHub Pages (or refresh the local file).

> **Note:** If `WEBHOOK_URL` is left empty, the form still works — it just won't write to the sheet. Useful for demos.

---

## 3. Hosting on GitHub Pages (Free)

1. Push the project folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to `main` branch, `/ (root)` folder.
4. GitHub will give you a URL like `https://yourusername.github.io/stem3d/`.
5. Open that URL on the iPad — done.

**Files that must be in the repo root:**
```
index.html
style.css
app.js
images/
  logo.png
  2.png
```

---

## 4. iPad Kiosk Mode (Guided Access)

1. Open **Settings → Accessibility → Guided Access**. Toggle **ON**.
2. Set a passcode under **Passcode Settings** (staff-only passcode).
3. Open **Safari** and navigate to your GitHub Pages URL.
4. Triple-click the **Side button** (or Home button on older iPads) to start Guided Access.
5. Tap **Start** in the top-right corner.

The iPad is now locked to that single page. Students cannot navigate away.

**To exit Guided Access:** Triple-click the Side button and enter the passcode.

---

## 5. Adding More Printers

Open `app.js` and find the `PRINTERS` array near the top:

```js
const PRINTERS = ['Printer 1', 'Printer 2', 'Printer 3', 'Printer 4'];
```

Add a new entry:

```js
const PRINTERS = ['Printer 1', 'Printer 2', 'Printer 3', 'Printer 4', 'Printer 5'];
```

Then update `index.html` to add a matching `.printer-card` button inside `#printer-grid`, copying the pattern of the existing four cards and changing `data-printer` and the label.

---

## 6. Daily Email Summary (Optional)

1. In the Apps Script editor, go to **Triggers** (clock icon on the left sidebar).
2. Click **+ Add Trigger**.
3. Configure:
   - **Function to run:** `sendDailySummary`
   - **Event source:** Time-driven
   - **Type:** Day timer
   - **Time of day:** 8am – 9am
4. Save.

You'll receive a daily email each morning with a summary of the previous day's print jobs.

---

## Project Structure

```
/
├── index.html                      — Main form (iPad kiosk page)
├── style.css                       — Glassmorphism dark theme
├── app.js                          — Form logic, validation, webhook
├── images/
│   ├── logo.png                    — Full STEM Center logo (with wordmark)
│   └── 2.png                       — Icon-only mark (used in header)
├── google-apps-script/
│   └── Code.gs                     — Google Apps Script webhook
└── README.md                       — This file
```

---

## Payload Shape (Google Sheet columns)

| Column | Field |
|--------|-------|
| Timestamp | ISO timestamp converted to US Central time |
| Date | Print date (YYYY-MM-DD) |
| First Name | |
| Last Name | |
| W Number | e.g. W12345678 |
| SLU Email | |
| Department | |
| Instructor | Optional |
| Printer(s) | Comma-separated if multiple |
| File Name | e.g. bracket_v2.stl |
| Material | PLA, PETG, ABS, TPU, Resin, Other |
| Est. Duration | |
| Filament Color | Optional |
| Purpose / Description | |
