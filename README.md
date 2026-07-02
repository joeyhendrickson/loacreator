# LOA Creator

AI-powered Letter of Authorization (LOA) form filler for **AT&T to CallTower** porting and activation.

Upload a blank LOA template plus up to 30 source documents (invoices, account summaries, CSR records, etc.). The app extracts exact field values and produces a completed LOA ready for review.

## Features

- **Template upload** — PDF, Word, TXT, or image LOA forms
- **Bulk context documents** — up to 30 supporting files (PDF, Word, Excel, CSV, TXT, images)
- **Vision support** — image-based documents are sent to the model for OCR-style extraction
- **Structured output** — field-by-field mapping with source document attribution
- **Evidence tracking** — per-field decision rationale, source excerpts, and confidence levels (high / medium / low / none)
- **Download** — export completed LOA as a Word document (`.doc`) or structured `.json`

## Setup

```bash
npm install
cp .env.example .env.local
# Add your OpenAI API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-5.5` | Model used for LOA generation |

## How It Works

1. User uploads the LOA template form.
2. User uploads 1–30 context documents containing porting data.
3. Documents are parsed server-side (PDF text extraction, Word parsing, etc.).
4. OpenAI receives the specialist porting prompt, template content, and all source material.
5. The model returns a completed LOA, extracted fields with sources, notes, and any missing fields.

## Supported File Types

- PDF (`.pdf`) — parsed with `unpdf` (serverless-safe, no worker setup)
- Word (`.doc`, `.docx`)
- Plain text / CSV (`.txt`, `.csv`)
- Excel (`.xls`, `.xlsx`)
- Images (`.png`, `.jpg`, `.jpeg`, `.webp`)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (structured JSON output)
