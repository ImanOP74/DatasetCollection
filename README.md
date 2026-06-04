# IRIS Wake Word Dataset Collector

A premium, full-stack Next.js web application designed to collect high-quality voice recordings from contributors to train the custom **IRIS** wake-word machine learning model.

---

## Features

- **Modern Dark-Mode Aesthetic**: Glassmorphism dashboard, glowing gradients, and smooth layout micro-animations.
- **Auto-generated Codes**: Contributors are assigned sequential identifiers (e.g. `P001`, `P002`) instead of low-quality nicknames, maintaining dataset cleanliness and privacy.
- **Comprehensive Metadata**: Logs device type and recording environment (e.g., Laptop + TV Background, Phone + Quiet Room) for audit quality.
- **Phrase Loop Wizard**: Guides users through 10 positive wake-words and 5 hard negative distractors.
- **Audio Quality Validation**: Rejects recordings shorter than 0.3s or longer than 5.0s, showing live, clear status warnings.
- **Secure Admin Panel**: Password-protected `/admin` interface to search, filter, listen, delete recordings, or delete entire participants (with Vercel Blob cleanup).
- **One-Click Dataset Export**: Assembles all recordings and constructs a clean, standardized `metadata.csv` on the client side, compiling them into a downloadable `dataset.zip`.

---

## Tech Stack

- **Next.js** (App Router, TypeScript, React Server Components)
- **Tailwind CSS v4** (Modern utilities and styling)
- **Supabase** (Participant and recording metadata database)
- **Vercel Blob** (Raw audio file cloud bucket storage)
- **JSZip** (Client-side ZIP package generator)

---

## Project Setup

### 1. Database Schema Configuration

Log into your [Supabase Dashboard](https://supabase.com), open the SQL Editor for your project, and execute the following SQL script to create the necessary tables and indexes:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Participants Table
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  participant_code text not null unique, -- E.g., P001, P002
  name text not null, -- Participant's name
  environment text not null, -- E.g., Quiet Room, Fan Running, TV Background
  device_type text not null, -- E.g., Phone, Laptop, Headset, External Microphone
  consent boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Recordings Table
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete cascade not null,
  phrase text not null,
  audio_url text not null,
  duration numeric not null, -- in seconds
  file_format text not null, -- webm, ogg, m4a
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Indexes for Quick Filters
create index if not exists recordings_participant_id_idx on public.recordings(participant_id);
create index if not exists recordings_phrase_idx on public.recordings(phrase);
```

### 2. Environment Variables

Rename the `.env.example` file in the root directory to `.env.local` and fill in your database and storage credentials:

```bash
cp .env.example .env.local
```

- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL (Project Settings > API).
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase public anonymous API key (Project Settings > API).
- **`SUPABASE_SERVICE_ROLE_KEY`**: Your Supabase service role secret key (Project Settings > API). Required for backend write operations and bulk deletes.
- **`BLOB_READ_WRITE_TOKEN`**: Your Vercel Blob read-write access token.
- **`ADMIN_PASSWORD`**: The password to authenticate on the `/admin` dashboard. Defaults to `admin123` if left blank.

### 3. Install Dependencies

Install the project dependencies locally:

```bash
npm install
```

### 4. Running the Development Server

Launch the local development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to access the application. To view the admin panel, navigate to `http://localhost:3000/admin`.

### 5. Production Build

To verify that the application compiles without any TypeScript or Next.js build errors, run:

```bash
npm run build
```

---

## Dataset Export Format

When exporting the dataset via the admin panel, the downloaded `dataset.zip` contains:

```
dataset.zip
├── metadata.csv
├── positive/
│   ├── participant_P001_iris_1625078900000.webm
│   ├── participant_P001_hey_iris_1625078912000.webm
│   └── ...
└── negative/
    ├── participant_P001_irish_1625078922000.webm
    ├── participant_P001_paris_1625078930000.webm
    └── ...
```

The `metadata.csv` file maps recording files to their respective participant attributes and features the columns:
- `participant_id` (Code, e.g., `P001`)
- `phrase`
- `label` (`positive` or `negative`)
- `device_type`
- `environment`
- `audio_file` (Relative path to the file inside the ZIP archive, e.g. `positive/...`)
- `duration` (Audio clip length in seconds)
- `timestamp`
