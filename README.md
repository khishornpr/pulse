# 🚨 PULSE KPRIET - Real-Time Campus Emergency & Volunteer Grid

> **Hackathon Prototype** | KPR Institute of Engineering and Technology, Coimbatore  
> An autonomous, hyper-local emergency response and triage network connecting students in distress to nearest certified student volunteers, CPR responders, vehicle owners, blood donors, and campus security in under 45 seconds.

---

## ⚡ 2-Minute Judge Evaluation Demo Script

Follow this step-by-step walkthrough in 2 or 3 browser tabs or using the embedded **Demo Controls Drawer**:

1. **Step 1: Student Broadcasts SOS**
   - Navigate to [`/`](http://localhost:5173/) and click **"Try Demo (Instant)"** or switch to **Student (Aravind)**.
   - Tap the giant pulsing red **EMERGENCY SOS** button.
   - Select **Medical Emergency**, choose **Central Library & Reading Hall** (or drop a pin on the map), and tap **Review & Confirm Broadcast**.
   - Confirm the dispatch. Observe the live stopwatch starting and status showing *"Alert sent to matching volunteers within 1.5 km"*.

2. **Step 2: First Responder Receives Audio Alarm & Accepts**
   - Open a 2nd browser tab (or click the bottom **Demo Controls** drawer) and switch to **Volunteer 1 (Priya Dharshini - CPR/First Aid)**.
   - A full-screen urgent modal pops up with a **Web Audio API emergency alarm**.
   - Tap **"ACCEPT & RESPOND"**.
   - The responder immediately receives directions to the victim, a *"Call Victim"* button, and an *"Open in Google Maps"* route.

3. **Step 3: Atomic Race Condition Safeguard**
   - Open a 3rd tab or switch to **Volunteer 2 (Karthik Raja)**.
   - Attempting to accept the same incident cleanly displays: *"Already accepted by another responder or closed"*, preventing duplicate triage collisions.

4. **Step 4: Admin Live Command Room & Claude AI Summary**
   - Switch to **Admin (Dr. S. K. Ramesh - Chief Proctor)** at [`/admin`](http://localhost:5173/admin).
   - View live incident markers and green responder dots updating across KPRIET campus.
   - Switch to the **Risk Heatmap** tab (`leaflet.heat`) and **Analytics** tab (`recharts`).
   - Mark the incident resolved, then click **"Generate AI Summary"** to trigger the AI Post-Mortem generator powered by Claude Sonnet.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, Vite 6, Tailwind CSS, React Router v6, Lucide React Icons.
- **Geospatial & Mapping:** Leaflet, React-Leaflet, `leaflet.heat`, OpenStreetMap Cartography.
- **Backend & Database:** Supabase (PostgreSQL + PostGIS with `extensions` search path), Realtime WebSockets, Row Level Security (RLS).
- **Audio & Triage:** Web Audio API native tone synthesizer (zero external mp3 assets needed).
- **Edge AI:** Supabase Edge Function `summarize-incident` utilizing Anthropic Claude 3.5 Sonnet.
- **PWA Ready:** `manifest.json`, Service Worker caching, and mobile viewport optimization.

---

## 🚀 Setup & Installation Instructions

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd pulse-kpriet
npm install
```

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

2. Copy `scripts/.env.example` to `scripts/.env.local`:
   ```bash
   cp scripts/.env.example scripts/.env.local
   ```
   Fill in your backend service role key (used for database seeding only):
   ```env
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   ```

> 💡 *Note: If `.env` is left empty, Pulse automatically falls back to a high-fidelity in-memory & LocalStorage simulation engine so the demo never crashes.*

---

### 3. Database Migration (`supabase/schema.sql`)

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard) -> **SQL Editor**.
2. Copy and paste the entire contents of [`supabase/schema.sql`](file:///d:/studentActivity/pulse-kpriet/supabase/schema.sql).
3. Click **Run**. The script will:
   - Configure `set search_path = public, extensions;`
   - Create `profiles`, `incidents`, and `incident_alerts` with PostGIS `geography(Point, 4326)`
   - Create the atomic RPCs (`create_incident`, `accept_incident`, `resolve_incident`, `cancel_incident`, `update_my_location`)
   - Create views with pre-extracted lat/lng coordinates (`incidents_with_coords`, `volunteers_with_coords`, `incident_stats`)
   - Set up Row Level Security (RLS) and enable Realtime replication.

---

### 4. Seed Campus Demo Users & Volunteers

Run the idempotent Node.js seed script to provision **12 demo volunteers**, **1 student account**, and **1 admin account** scattered around KPRIET campus:

```bash
npm run seed
```

#### Default Demo Credentials:
| Role | Email | Password | Coordinates / Building |
|---|---|---|---|
| **Admin** | `admin@pulse.demo` | `Demo@12345` | Main Admin Block |
| **Student** | `student@pulse.demo` | `Demo@12345` | CSE & IT Block |
| **Volunteer 1 (CPR / First Aid)** | `volunteer1@pulse.demo` | `Demo@12345` | Central Library |
| **Volunteer 2 (Vehicle Transport)** | `volunteer2@pulse.demo` | `Demo@12345` | Mech Workshop |
| **Volunteer 3 (Blood Donor)** | `volunteer5@pulse.demo` | `Demo@12345` | Girls Hostel |

---

### 5. Running the Application Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 6. Deploying Supabase Edge Function (Optional for Anthropic Claude AI)

```bash
supabase functions deploy summarize-incident --project-ref <your-project-id>
supabase secrets set ANTHROPIC_API_KEY=<your-anthropic-api-key> --project-ref <your-project-id>
```
*(If the Anthropic key is not provided, Pulse automatically provides a structured rule-based post-action report so the demo remains 100% reliable.)*

---

### 7. Deploying to Vercel

1. Push this repository to GitHub.
2. Import project in [Vercel](https://vercel.com).
3. Add Environment Variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## 🛡️ Hackathon Deliverables Checklist
- [x] Full PostGIS Schema with RLS, Atomic RPCs, and Realtime Publications (`supabase/schema.sql`)
- [x] Idempotent Multi-User Seed Script (`scripts/seed.js` / `npm run seed`)
- [x] Giant Pulsing SOS Button with Multi-Fallback Location Picker (GPS + Campus Block Dropdown + Draggable Pin Map)
- [x] Real-time Volunteer Alerting with Web Audio API Siren & Race-Condition Safeguards
- [x] Admin Command Dashboard with Stat Cards, Incident Map, Risk Heatmap (`leaflet.heat`), and Charts (`recharts`)
- [x] AI Post-Mortem Summarizer Edge Function (`supabase/functions/summarize-incident`)
- [x] Mobile-First & PWA Installable (`manifest.json` & Service Worker)
- [x] Demo Control Console for instant testing and presentation
