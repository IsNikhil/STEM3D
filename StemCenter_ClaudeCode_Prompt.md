# Claude Code Build Prompt — Southeastern Northshore STEM Center 3D Printer Request App

## Project Overview
Build a single-page web application for the Southeastern Northshore STEM Center at Southeastern Louisiana University. This app will run on an iPad in kiosk mode (Safari + Guided Access) next to 3D printers in the lab. Students fill out the form before every print job. All submissions are saved to a Google Sheet via a Google Apps Script webhook.

---

## Brand & Design

### Colors (use exactly these hex values)
- SLU Green: `#215732`
- Northshore Navy/Blue: `#2D3A8C`
- Green accent (lighter): `#4caf7d`
- Blue accent (lighter): `#6b82e0`
- Gold accent (optional highlights): `#FFC72C`
- Background: deep dark gradient from `#0d2b1a` → `#162f40` → `#0e1f35`

### Logo / Identity
- The STEM Center logo is a half-brain (green, left) + vertical dividing line + half-gear (navy, right)
- Wordmark: "SOUTHEASTERN" in green, "NORTHSHORE" in navy, "STEM CENTER" in white/light below
- Recreate this logo mark in SVG at the top of the page header

### Design Style
- **Glassmorphism**: frosted glass cards using `rgba(255,255,255,0.055)` background + `rgba(255,255,255,0.13)` border + `border-radius: 18px`
- Dark deep background (fixed, gradient)
- All text on dark: white primary, `rgba(255,255,255,0.5)` secondary, `rgba(255,255,255,0.28)` placeholder
- Input fields: `rgba(255,255,255,0.08)` bg, subtle white border, focus ring in blue
- Section headers: small uppercase label with colored dot + fading line
- Submit button: gradient from `#215732` to `#2D3A8C`, full width, white text
- Printer selector boxes: grid of square cards that highlight green when selected
- Success screen: centered check circle with green stroke, confirmation details, "New request" button
- Fully responsive, touch-friendly (minimum 44px tap targets), works great on iPad

---

## File Structure
```
/
├── index.html          # Main form page
├── style.css           # All styles (glassmorphism theme)
├── app.js              # Form logic, validation, submission
└── README.md           # Setup instructions (webhook URL, hosting, iPad kiosk)
```

---

## Form Fields

### Section 1 — Student Info
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| First name | text input | yes | non-empty |
| Last name | text input | yes | non-empty |
| W Number | text input | yes | regex: `/^[Ww]\d{7,8}$/` |
| SLU Email | email input | yes | must contain @ and . |
| Department / Major | select dropdown | yes | see options below |
| Instructor / Supervisor | text input | no | free text |

Department options: Engineering Technology, Computer Science, Biology / Pre-Med, Physics, Chemistry, Architecture, Education, Other

### Section 2 — Printer Selection
- Two toggle buttons at the top: **"Single printer"** vs **"Multiple printers"**
  - Single mode: tapping a printer box deselects any previous selection (radio behavior)
  - Multi mode: tapping toggles selection on/off (checkbox behavior)
- 4 printer boxes displayed in a 2×2 grid (or 4-column row on wider screens)
  - Each box shows a printer icon SVG + label ("Printer 1", "Printer 2", "Printer 3", "Printer 4")
  - Selected state: green background tint + green border + green text
  - Unselected state: subtle white border, muted text
- Below the grid: a hint line showing selected printer(s) by name
- Validation: at least one printer must be selected

### Section 3 — Print Job Details
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| File name | text input | yes | e.g. bracket_v2.stl |
| Material | select | yes | PLA, PETG, ABS, TPU (flexible), Resin, Other |
| Est. print time | select | yes | Under 1 hour / 1–3 hours / 3–6 hours / 6–12 hours / 12+ hours (overnight) |
| Filament color | text input | no | e.g. White, Black |
| Purpose / description | textarea | yes | min 8 chars, describe what and why |

### Section 4 — Date & Agreement
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Date | date input | yes | auto-fill today's date on load |
| Safety agreement | checkbox | yes | "I agree to follow all STEM Center lab safety rules, will monitor my print or arrange coverage, and accept responsibility for materials and printer usage." |

---

## Form Behavior

### Validation
- Validate on submit only (not on blur)
- Highlight errored fields with a red border
- Show inline error message below each invalid field
- If agreement checkbox not checked, show `alert()`
- Scroll to first error after failed submit

### Submission Flow
1. User clicks "Submit Print Request"
2. Button disables immediately (prevent double submit)
3. Show subtle "Saving..." indicator
4. POST JSON payload to `WEBHOOK_URL` using `fetch()` with `mode: 'no-cors'`
5. Whether or not webhook succeeds, show the success screen (the sheet write is fire-and-forget)
6. Success screen shows:
   - Large green checkmark circle
   - "Request logged!"
   - Student's full name
   - Printer tag badges (e.g. "Printer 1" + "Printer 3" if multi)
   - File name · Material · Duration
   - "New request" button that resets everything

### Reset
- "New request" clears all fields
- Date resets to today
- Printer selection clears
- Mode resets to "Single printer"
- Success screen hides, form reappears

---

## Google Apps Script Webhook

### Payload shape (JSON POST body)
```json
{
  "timestamp": "2025-04-10T14:32:00.000Z",
  "date": "2025-04-10",
  "firstName": "Jordan",
  "lastName": "Smith",
  "wNumber": "W12345678",
  "email": "jsmith@selu.edu",
  "department": "Engineering Technology",
  "instructor": "Dr. Jones",
  "printers": "Printer 1, Printer 3",
  "fileName": "bracket_v2.stl",
  "material": "PLA",
  "duration": "1–3 hours",
  "color": "White",
  "purpose": "Senior capstone project enclosure bracket"
}
```

### Webhook URL config
- In `app.js`, define at the top:
  ```js
  const WEBHOOK_URL = ''; // paste Google Apps Script Web App URL here
  ```
- If empty string, skip the fetch silently and still show success screen (so the form works for demos without a backend)

### Google Apps Script (write this as `/google-apps-script/Code.gs`)
The script should:
- Accept `doPost(e)` — parse JSON body, append a row to a sheet named `"Printer Log"`
- Accept `doGet()` — return plain text "Webhook is live." for testing
- On first run, auto-create the `"Printer Log"` sheet with headers:
  `Timestamp, Date, First Name, Last Name, W Number, SLU Email, Department, Instructor, Printer(s), File Name, Material, Est. Duration, Filament Color, Purpose / Description`
- Header row styled: bold, white text, `#215732` green background
- Freeze header row
- Set reasonable column widths
- Timestamps converted to US Central time (`America/Chicago`)
- Optional `sendDailySummary()` function that emails yesterday's rows to the script owner — triggered daily at 8am via Apps Script time trigger

---

## README.md should cover
1. How to create the Google Sheet and deploy the Apps Script
2. Where to paste the webhook URL
3. How to host the HTML (GitHub Pages recommended — free)
4. How to set up iPad Guided Access kiosk mode step by step
5. How to add more printers in the future (change the `PRINTERS` array in `app.js`)
6. How to set up the optional daily email summary trigger

---

## Extra Notes
- No frameworks, no npm — vanilla HTML/CSS/JS only (so it runs from a plain file or GitHub Pages with zero build step)
- No `localStorage` or cookies needed — stateless, each submission is independent
- iPad viewport meta tag must include `maximum-scale=1.0, user-scalable=no` to prevent accidental zoom
- Use `-webkit-tap-highlight-color: transparent` and `user-select: none` on tap targets for clean iPad feel
- All inputs should be large enough for finger taps (min 44px height)
- The page should look great at iPad resolution (768×1024) in portrait mode
