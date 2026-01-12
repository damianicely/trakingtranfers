# TrakingTransfers.pt

A modern web application built with SvelteKit 5 and Paraglide for internationalization.

## Features

- 🌍 Portuguese/English language switching
- 🎨 Modern, responsive landing page
- 📱 Mobile-friendly design
- ⚡ Built with SvelteKit 5

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

- `src/routes/+page.svelte` - Main landing page with hero section
- `src/routes/+layout.svelte` - Layout with language toggle
- `messages/` - Translation files for English and Portuguese
- `project.inlang/` - Paraglide configuration

## Adding a Hero Image

Replace the placeholder in `src/routes/+page.svelte` with your actual hero image:

```svelte
<div class="hero-image">
  <img src="/path/to/your/hero-image.jpg" alt="Hero" />
</div>
```

## Building for Production

```bash
npm run build
npm run preview
```
