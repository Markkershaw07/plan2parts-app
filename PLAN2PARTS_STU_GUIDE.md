# Plan2Parts — User Guide

## What it does
Plan2Parts converts cable containment take-offs into a bill of materials (BOM).
Upload an electrical plan, let AI count your tray systems, tweak the numbers, then export a clean BOM.

## 1. First-time setup — create trapeze templates

Before starting a job, create at least one template for your tray system type.

1. Click **Templates** from the home screen.
2. Click **New Template**.
3. Enter a name (e.g. "75mm MGBT"), stick length in metres.
4. Add items **per trapeze**: threaded rod, bracket, fixings — with qty and unit.
5. Add items **per join**: coupler plate, bolts, etc.
6. Click **Save Template**.

## 2. Starting a job

1. From the home screen, click **New Job**.
2. Enter a job name and site.
3. Click **Create Job** — you land on the Setup tab.

## 3. Uploading and analysing a plan

1. Click the **Plan** tab.
2. Drop or click to upload a PDF or image of the plan.
3. The plan renders and AI analyses it automatically.
4. Results appear below — one card per detected tray system.

## 4. Reviewing AI numbers

For each detected system:
- Check the system **name** and rename it if needed.
- Assign a **template** from the dropdown.
- Review and correct: **length (m)**, **trapezes**, **corners**, **tees**, **reducers**.
- Confidence badge (green/amber/red) shows how certain the AI was.

When happy, click **Save to Job** — you return to the Setup tab.

## 5. Reading the BOM

Click the **BOM** tab. The table shows:
- One amber heading row per tray system.
- All items derived from the template (tray length, trapeze items, join items, fittings).
- **How** column shows the calculation behind each quantity.

Use **Copy as Text** to paste into an email or spreadsheet, or **Print** for a hard copy.

## 6. Tips

- Set up templates once — reuse them across all jobs.
- If AI confidence is low, manually correct the numbers before saving.
- You can add or edit systems manually in the **Setup** tab at any time.
- Re-upload a plan to re-run AI analysis (replaces the previous image).
- Set `ANTHROPIC_API_KEY` in Vercel environment variables before deploying.
