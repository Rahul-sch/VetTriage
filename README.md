# 🐾 VetTriage

**AI-powered veterinary intake assistant** — A production-ready PWA that passively records veterinary conversations, transcribes them in real-time with speaker diarization, analyzes the transcript with AI, and generates structured intake reports downloadable as PDF. Includes an owner platform for pre-visit intake forms and post-visit summary sharing.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://vettriage.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-blueviolet)](https://web.dev/progressive-web-apps/)

---

## ✨ Features

| Feature                    | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| 🎙️ **Voice Recording**     | Real-time transcription using Web Speech API                   |
| 👥 **Speaker Diarization** | Automatically distinguishes Vet vs Owner based on speech turns |
| 🎯 **AI Confidence Scoring** | Transparent confidence levels (high/medium/low) for all fields |
| 🤖 **AI Analysis**         | Groq (Llama 3.3 70B) extracts structured intake data           |
| 📄 **PDF Reports**         | Professional one-page intake reports with jsPDF                |
| ✏️ **Editable Reports**    | Human-in-the-loop editing with change tracking                 |
| 🎵 **Audio Timeline**      | Click transcript segments to jump in audio playback            |
| 📜 **Collapsible Transcript** | Full transcript view with diagnosis/recommendation highlighting |
| 🧪 **Test Transcript**     | Always-available demo button to load mock conversation        |
| 💾 **Session Persistence** | Auto-restore transcript, audio, and report across refreshes   |
| 🔒 **Rate Limiting**       | Global rate limiter prevents API overload and 429 errors      |
| 🔗 **Visit Token System**  | Unique visit tokens for owner-vet communication               |
| 👤 **Owner Platform**      | Owner intake forms and summary viewing via shareable links    |
| 💾 **Supabase Integration** | Visit data persisted in Supabase (replaces localStorage)       |
| 📱 **PWA**                 | Installable, works offline (UI cached)                         |
| 🌐 **Zero Setup**          | Just open the URL — no app store, no downloads                 |

---

## 🎯 Key Features Explained

### 🎯 AI Confidence Scoring

Every field in the AI-generated report includes a confidence score (0.0-1.0) with three levels:

- **🟢 High (0.8-1.0)**: Information explicitly stated in transcript
- **🟡 Medium (0.5-0.79)**: Information implied or partially stated
- **🔴 Low (0.0-0.49)**: Information inferred or unclear

Hover over confidence indicators to see AI's reasoning notes. This transparency builds trust and helps staff identify fields that need human verification.

### 📜 Collapsible Transcript View

After recording completes, a collapsible transcript section appears below the audio player:

- **Hidden by default** — Click "Show Transcript" to expand
- **Full conversation** — Complete transcript with speaker labels (Vet/Owner)
- **Smart highlighting** — Diagnosis/assessment statements highlighted in purple
- **Recommendation highlighting** — Next steps and recommendations highlighted in green
- **Audio sync** — Click any segment to jump to that moment in audio playback
- **Active segment** — Current playback position is visually highlighted

This provides a complete view of the conversation for review and verification.

### 🧪 Test Transcript Feature

A **"🧪 Load Test Transcript (Demo)"** button is always available for testing and demos:

- **Always visible** — Available regardless of app state
- **Full reset** — Clears transcript, report, error, audio, and session
- **Mock conversation** — Loads a comprehensive test scenario covering all report fields
- **Immediate analysis** — Click "Analyze Transcript" to test the full workflow without speaking

Perfect for demos, testing, and development without needing to record actual conversations.

### 🔒 Rate Limiting & Stability

The app includes robust rate limiting to prevent API overload:

- **Global rate limiter** — Ensures minimum 2-second interval between any Groq API calls
- **Single-flight lock** — Prevents duplicate API calls (one click = one request)
- **Cooldown management** — Automatic 15-second cooldown after 429 errors
- **Defensive rendering** — Badges handle invalid data gracefully (no crashes)
- **Error recovery** — App stays stable even when Groq returns unexpected values

### 🔗 Visit Token System

The app uses a visit-centric workflow with unique tokens:

- **Vet creates visit** — Click "Create Visit Link" to generate a unique 12-character token
- **Owner access** — Share the link (`/owner/{visitToken}`) with pet owners
- **Owner intake** — Owners complete intake form (pet name, symptoms, duration, concerns)
- **Vet sees intake** — Owner intake data appears in vet view before recording
- **Share summary** — Vet can share completed report with owner via visit link
- **Supabase persistence** — All visit data stored in Supabase for reliability

### 👤 Owner Platform

Two owner-facing pages accessible via visit token:

- **Owner Intake Page** (`/owner/:visitToken`) — Pre-visit intake form
  - Pet name, symptoms, duration, additional concerns
  - Form validation and error handling
  - Confirmation screen after submission
  
- **Owner Summary Page** (`/owner/:visitToken/summary`) — Post-visit summary
  - Read-only view of intake information
  - Visit status indicators
  - Clinical assessment (when shared by vet)
  - Mobile-first responsive design

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph client [Browser PWA]
        UI[React UI]
        WSA[Web Speech API]
        MR[MediaRecorder]
        SW[Service Worker]
        IDB[(IndexedDB Session)]
    end

    subgraph external [External Services]
        Groq[Groq API]
        Supabase[(Supabase Visits)]
    end

    UI --> WSA
    UI --> MR
    WSA --> UI
    MR --> UI
    UI --> Groq
    Groq --> UI
    SW --> UI
    UI --> IDB
    UI --> Supabase
    Supabase --> UI
```

### Component Architecture

```mermaid
flowchart LR
    subgraph pages [Pages]
        HP[HomePage]
        OIP[OwnerIntakePage]
        OSP[OwnerSummaryPage]
    end

    subgraph components [Components]
        HD[Header]
        RB[RecordButton]
        TD[TranscriptDisplay]
        AP[AudioPlayer]
        RP[ReportPreview]
        EF[EditableField]
        DB[DownloadButton]
        AKM[ApiKeyModal]
        OB[OfflineBanner]
        UP[UrgencyPulse]
        CI[ConfidenceIndicator]
    end

    subgraph hooks [Hooks]
        URS[useRecordingState]
        USR[useSpeechRecognition]
        UAR[useAudioRecorder]
        UER[useEditableReport]
        UOS[useOnlineStatus]
        UUP[useUrgencyPulse]
    end

    subgraph services [Services]
        GS[groq.ts]
        UD[urgencyDetection.ts]
        PDF[pdfGenerator.ts]
        VS[visitStorage.ts]
        SS[sessionStorage.ts]
    end

    HP --> HD
    HP --> RB
    HP --> TD
    HP --> AP
    HP --> RP
    HP --> AKM
    HP --> OB
    HP --> UP

    HP --> URS
    HP --> USR
    HP --> UAR
    HP --> UUP

    RP --> EF
    RP --> DB
    RP --> UER
    RP --> CI

    DB --> PDF
    HP --> GS
    UUP --> UD
    HP --> VS
    OIP --> VS
    OSP --> VS
```

---

## 🔄 User Flow

### Vet Workflow

```mermaid
sequenceDiagram
    participant V as Vet
    participant App as VetTriage
    participant WSA as Web Speech API
    participant MR as MediaRecorder
    participant AI as Groq AI
    participant Supabase as Supabase
    participant PDF as PDF Generator

    V->>App: Open app
    App->>V: Show API key modal (first time)
    V->>App: Enter Groq API key

    V->>App: Click "Create Visit Link"
    App->>Supabase: Create visit with unique token
    Supabase->>App: Return visit token
    App->>V: Display shareable owner URL

    V->>App: Tap Record
    App->>WSA: Start transcription
    App->>MR: Start audio capture

    loop During conversation
        WSA->>App: Interim transcript
        App->>V: Show live text (italic)
        WSA->>App: Final transcript
        App->>V: Show confirmed text with speaker label
    end

    V->>App: Tap Stop
    App->>WSA: Stop transcription
    App->>MR: Stop recording
    App->>AI: Send transcript for analysis
    AI->>App: Return structured JSON
    App->>V: Show editable report with owner intake (if available)

    V->>App: Edit fields (optional)
    V->>App: Click "Share with Owner"
    App->>Supabase: Update visit status to 'shared'
    V->>App: Tap Download PDF
    App->>PDF: Generate report
    PDF->>V: Download file
```

### Owner Workflow

```mermaid
sequenceDiagram
    participant O as Owner
    participant App as VetTriage
    participant Supabase as Supabase

    O->>App: Open visit link (/owner/:visitToken)
    App->>Supabase: Load visit by token
    Supabase->>App: Return visit data

    alt Intake not submitted
        App->>O: Show intake form
        O->>App: Fill form (pet name, symptoms, duration, concerns)
        O->>App: Submit intake
        App->>Supabase: Save intake data, update status
        App->>O: Show confirmation
        O->>App: Click "View Summary"
    end

    App->>O: Show summary page
    alt Status is 'shared'
        App->>O: Display clinical assessment
    else Status is 'intake_complete'
        App->>O: Show "Pending veterinary review"
    end
```

---

## 🛠️ Tech Stack

| Layer             | Technology            | Purpose                          |
| ----------------- | --------------------- | -------------------------------- |
| **Framework**     | React 18 + TypeScript | UI components with type safety   |
| **Build**         | Vite                  | Fast HMR, PWA plugin             |
| **Styling**       | Tailwind CSS          | Mobile-first utility classes     |
| **Routing**       | React Router DOM      | Client-side routing for owner platform |
| **Transcription** | Web Speech API        | Browser-native voice recognition |
| **Audio**         | MediaRecorder API     | Parallel audio capture           |
| **AI**            | Groq (Llama 3.3 70B)  | Structured data extraction       |
| **PDF**           | jsPDF                 | Client-side PDF generation       |
| **Database**      | Supabase              | Visit data persistence           |
| **Session Storage** | IndexedDB          | Client-side session persistence  |
| **PWA**           | vite-plugin-pwa       | Service worker, manifest         |

---

## 📁 Project Structure

```
VetTriage/
├── public/
│   ├── icons/
│   │   └── icon.svg           # PWA app icon
│   └── favicon.svg            # Browser favicon
├── src/
│   ├── components/
│   │   ├── ApiKeyModal.tsx    # First-run API key setup
│   │   ├── AudioPlayer.tsx    # Native audio playback controls
│   │   ├── DownloadButton.tsx # PDF download trigger
│   │   ├── EditableField.tsx  # Inline text editing
│   │   ├── EditableList.tsx   # Inline list editing
│   │   ├── Header.tsx         # App header with status
│   │   ├── OfflineBanner.tsx  # Offline warning banner
│   │   ├── RecordButton.tsx   # Main record/stop button
│   │   ├── ReportPreview.tsx  # Structured report display
│   │   ├── StatusBadge.tsx    # Recording state indicator
│   │   ├── TranscriptDisplay.tsx # Live transcript with speakers
│   │   ├── CollapsibleTranscript.tsx # Full transcript view with highlighting
│   │   ├── UrgencyPulse.tsx   # Real-time urgency indicator (disabled by default)
│   │   ├── ConfidenceIndicator.tsx # AI confidence visual indicators
│   │   └── UnsupportedBrowser.tsx # Browser fallback
│   ├── hooks/
│   │   ├── useAudioRecorder.ts    # MediaRecorder wrapper
│   │   ├── useEditableReport.ts   # Report editing state
│   │   ├── useOnlineStatus.ts     # Network detection
│   │   ├── useRecordingState.ts   # State machine
│   │   ├── useSpeechRecognition.ts # Web Speech API wrapper
│   │   └── useUrgencyPulse.ts    # Real-time urgency analysis
│   ├── pages/
│   │   ├── HomePage.tsx       # Main vet-facing application page
│   │   ├── OwnerIntakePage.tsx # Owner intake form page
│   │   └── OwnerSummaryPage.tsx # Owner summary view page
│   ├── lib/
│   │   └── supabase.ts        # Supabase client configuration
│   ├── prompts/
│   │   ├── veterinary-intake.ts # AI system prompt
│   │   └── urgency-detection.ts # Lightweight urgency prompt
│   ├── services/
│   │   ├── groq.ts            # Groq API client with single-flight lock
│   │   ├── urgencyDetection.ts # Real-time urgency analysis
│   │   ├── rateLimiter.ts     # Global rate limiting for API calls
│   │   ├── pdfGenerator.ts    # jsPDF report builder
│   │   ├── sessionStorage.ts  # IndexedDB session persistence
│   │   └── visitStorage.ts    # Supabase visit data management
│   ├── types/
│   │   ├── report.ts          # IntakeReport interface
│   │   ├── transcript.ts       # Transcript segment types
│   │   ├── urgency.ts          # Urgency level types
│   │   └── visit.ts            # Visit and intake data types
│   ├── utils/
│   │   ├── browserSupport.ts  # Feature detection
│   │   ├── formatters.ts      # Date/time utilities
│   │   ├── highlightDetection.ts # Keyword-based highlighting for transcript
│   │   └── mockTranscript.ts  # Test transcript generator for demos
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   ├── index.css              # Tailwind imports
│   └── vite-env.d.ts          # TypeScript declarations
├── supabase/
│   ├── migrations/
│   │   └── 001_create_visits_table.sql # Supabase visits table migration
│   └── README.md              # Migration instructions
├── index.html                 # HTML template
├── vite.config.ts             # Vite + PWA config
├── tailwind.config.js         # Tailwind config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Groq API key ([get one free](https://console.groq.com/keys))
- Supabase project ([create one free](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Rahul-sch/VetTriage.git
cd VetTriage

# Install dependencies
npm install

# Set up Supabase
# 1. Create a Supabase project at https://supabase.com
# 2. Run the migration: supabase/migrations/001_create_visits_table.sql
# 3. Get your project URL and anon key from Supabase dashboard
# 4. Add them to .env file

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file:

```env
VITE_GROQ_API_KEY=gsk_your_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The Groq API key can also be entered in the app UI on first launch.

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

---

## 📖 Usage

### 1. First Launch

- Open the app in Chrome, Edge, or Safari
- Enter your Groq API key when prompted
- Key is stored in localStorage (never sent anywhere except Groq)

### 2. Recording

- Tap the **Record** button to start
- Speak naturally — the conversation is transcribed in real-time
- Speaker changes are detected automatically (1.5s pause = switch)
- Use **Switch Speaker** button to manually correct
- Interim results appear in italic, final results appear normally

### 3. Analysis

- Tap **Stop** when done
- You'll see "Analyzing Conversation..." with a loading spinner
- AI analyzes the transcript and extracts:
  - Patient info (name, species, breed, age, weight)
  - Owner info
  - **Confidence scores** for each field (hover over colored dots)
  - Chief complaint & symptoms
  - Medical history
  - Severity & urgency levels
  - Clinical assessment
  - Recommended actions

### 4. Review & Edit

- Click any field to edit
- "Edited" badge shows modified fields
- Changes are reflected in the PDF

### 5. Download

- Tap **Download PDF**
- File saved as `VetTriage_YYYY-MM-DD_petname.pdf`

### 6. Audio Playback

- After recording, audio player appears
- Click any transcript segment to jump to that moment
- Active segment is highlighted during playback

### 7. Collapsible Transcript

- After recording completes, a "Show Transcript" button appears
- Click to expand the full conversation transcript
- Diagnosis/assessment statements highlighted in purple
- Recommendations/next steps highlighted in green
- Click any segment to jump to that moment in audio

### 8. Test Transcript (Demo)

- **"🧪 Load Test Transcript (Demo)"** button is always visible
- Click to load a comprehensive mock conversation
- Perfect for testing and demos without recording
- Click "Analyze Transcript" to test the full workflow

### 9. Visit Management (Vet)

- **Create Visit Link** — Click to generate a unique visit token and shareable owner URL
- **View Owner Intake** — Owner intake data appears above report when available
- **Share Summary** — Click "Share with Owner" to make summary visible to owner
- **Copy URL** — One-click copy of owner visit link

### 10. Owner Platform

- **Access via visit token** — Owners use link: `/owner/{visitToken}`
- **Complete intake form** — Submit pet name, symptoms, duration, concerns
- **View summary** — Access summary at `/owner/{visitToken}/summary`
- **Status tracking** — See visit status (Pending Intake, Intake Complete, Shared, etc.)

---

## 🔌 API Reference

### Groq Integration

The app uses Groq's Chat Completions API:

```
POST https://api.groq.com/openai/v1/chat/completions
```

**Model:** `llama-3.3-70b-versatile`

**Request format:**

```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "VET: ... OWNER: ..." }
  ],
  "temperature": 0.1,
  "max_tokens": 2000
}
```

**Response:** Structured JSON matching `IntakeReport` interface.

---

## 📊 Data Structures

### Visit

```typescript
interface Visit {
  id: string; // UUID
  visitToken: string; // 12-character unique token
  status: "pending_intake" | "intake_complete" | "in_progress" | "complete" | "shared";
  intakeData: IntakeData | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

interface IntakeData {
  petName: string;
  symptoms: string;
  duration: string;
  concerns: string;
  submittedAt: string; // ISO timestamp
}
```

### IntakeReport

```typescript
interface IntakeReport {
  patient: {
    name: ConfidentField<string>;
    species: ConfidentField<string>;
    breed: ConfidentField<string>;
    age: ConfidentField<string>;
    weight: ConfidentField<string>;
    sex: ConfidentField<string>;
  };
  owner: {
    name: ConfidentField<string>;
    phone: ConfidentField<string>;
    email: ConfidentField<string>;
  };
  chiefComplaint: ConfidentField<string>;
  symptoms: ConfidentField<string[]>;
  duration: ConfidentField<string>;
  severity: ConfidentField<"mild" | "moderate" | "severe" | "critical">;
  medicalHistory: ConfidentField<string>;
  currentMedications: ConfidentField<string[]>;
  allergies: ConfidentField<string[]>;
  vitalSigns: ConfidentField<string>;
  assessment: ConfidentField<string>;
  recommendedActions: ConfidentField<string[]>;
  urgencyLevel: ConfidentField<1 | 2 | 3 | 4 | 5>;
  notes: ConfidentField<string>;
}

interface ConfidentField<T> {
  value: T;
  confidence: {
    score: number; // 0.0 - 1.0
    level: "high" | "medium" | "low";
    note?: string; // Explanation for confidence or uncertainty
  };
}
```

### TranscriptSegment

```typescript
interface TranscriptSegment {
  speaker: "vet" | "owner";
  text: string;
  timestamp: number; // Absolute time
  relativeTime?: number; // Seconds from recording start
}
```

---

## 🌐 Browser Support

| Browser            | Transcription | Audio Recording | PWA Install |
| ------------------ | ------------- | --------------- | ----------- |
| Chrome             | ✅            | ✅              | ✅          |
| Edge               | ✅            | ✅              | ✅          |
| Safari (iOS 14.5+) | ✅            | ✅              | ✅          |
| Firefox            | ❌            | ✅              | ❌          |

> Firefox users see a fallback message recommending Chrome.

---

## ⚠️ Troubleshooting

### Rate Limit Errors

If you see "Rate limit exceeded" errors:

1. **Wait 15 seconds** — The app automatically sets a cooldown period
2. **Global rate limiter** — Ensures minimum 2-second interval between API calls
3. **Single-flight lock** — Prevents duplicate calls (one click = one request)
4. **Check your Groq usage** — Visit [Groq Console](https://console.groq.com) to monitor API usage
5. **Note:** Real-Time Urgency Pulse is currently disabled by default to prevent rate limits

### Blank Screen During Analysis

- **Fixed!** The app now shows a loading spinner during analysis
- If you still see a blank screen, check the browser console (F12) for errors
- Refresh the page — your session is automatically restored from IndexedDB

### Audio Not Playing

- Ensure you granted microphone permissions
- Check browser console for MediaRecorder errors
- Try refreshing the page — audio is restored from session storage

### Transcription Not Working

- **Chrome/Edge/Safari only** — Firefox doesn't support Web Speech API
- Grant microphone permissions when prompted
- Check browser console for permission errors
- Ensure you're using HTTPS (required for microphone access)

### Session Not Restoring

- Clear browser cache and try again
- Check IndexedDB in DevTools → Application → IndexedDB → `vettriage-session`
- Use "Reset Session" button to clear corrupted data

---

## 🔒 Privacy & Security

- **Minimal backend** — Visit data stored in Supabase, all AI processing in browser
- **API key stored locally** — Never transmitted except to Groq
- **Audio not uploaded** — Recorded audio stays on device
- **Visit tokens** — Unique, unguessable tokens for owner access (no auth required)
- **No analytics** — Zero tracking or telemetry
- **Offline capable** — App shell cached for offline use

---

## 📝 License

MIT License — feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for blazing-fast LLM inference
- [jsPDF](https://github.com/parallax/jsPDF) for client-side PDF generation
- [Vite](https://vitejs.dev) for the excellent build tooling
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling

---

<p align="center">
  Built with ❤️ for veterinary professionals
</p>
