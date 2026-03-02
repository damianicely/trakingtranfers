# Traking Transfers - Style Guide

This document outlines the visual design system and styling conventions used throughout the Traking Transfers application.

## Table of Contents

- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Best Practices](#best-practices)

---

## Color Palette

### Primary Colors

| Color Name    | Hex Code  | CSS Variable          | Usage                          |
| ------------- | --------- | --------------------- | ------------------------------ |
| Dark Charcoal | `#1a1a1a` | `--color-primary`     | Headers, primary buttons, text |
| Warm Cream    | `#f5f5f0` | `--color-secondary`   | Section backgrounds, cards     |
| Warm Gold     | `#c4a77d` | `--color-accent`      | CTAs, highlights, icons        |
| Gold Dark     | `#a08960` | `--color-accent-dark` | Hover states                   |

### Neutral Colors

| Color Name   | Hex Code  | Usage                          |
| ------------ | --------- | ------------------------------ |
| White        | `#ffffff` | Card backgrounds, text on dark |
| Text Primary | `#333333` | Body text                      |
| Text Light   | `#666666` | Secondary text, labels         |
| Border       | `#e0e0e0` | Input borders, dividers        |

### Usage Guidelines

- **Primary buttons**: Background `#c4a77d`, text white
- **Secondary buttons**: Transparent with white or dark border
- **Card headers**: Background `#1a1a1a`, icons in `#c4a77d`
- **Section backgrounds**: Alternate between white `#ffffff` and cream `#f5f5f0`
- **Hover states**: Darken gold to `#a08960`, add subtle lift (`translateY(-2px)`)

---

## Typography

### Font Families

```css
--font-heading: 'Playfair Display', serif;
--font-body: 'Inter', sans-serif;
```

### Heading Hierarchy

| Level        | Font             | Size                       | Weight | Usage                       |
| ------------ | ---------------- | -------------------------- | ------ | --------------------------- |
| H1 (Hero)    | Playfair Display | `clamp(2.5rem, 6vw, 5rem)` | 400    | Page titles, hero headlines |
| H2 (Section) | Playfair Display | `clamp(2rem, 4vw, 3rem)`   | 400    | Section titles              |
| H3 (Card)    | Inter            | `1.2rem`                   | 600    | Card headers                |
| H4 (Footer)  | Inter            | `0.75rem`                  | 600    | Footer column titles        |

### Body Text

| Type       | Font  | Size        | Weight | Line Height |
| ---------- | ----- | ----------- | ------ | ----------- | ------------------------- |
| Body Large | Inter | `1.125rem`  | 300    | 1.8         | Hero descriptions         |
| Body       | Inter | `1rem`      | 400    | 1.6         | General content           |
| Body Small | Inter | `0.9375rem` | 400    | 1.6         | Footer links              |
| Label      | Inter | `0.75rem`   | 600    | 1.4         | Section labels, uppercase |

### Section Labels

Section labels follow a specific pattern:

```css
.section-label {
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.3em;
	text-transform: uppercase;
	color: #c4a77d;
	margin-bottom: 1rem;
}
```

---

## Spacing & Layout

### Container

```css
.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 2rem;
}
```

### Section Padding

```css
/* Standard section */
padding: 6rem 2rem;

/* Compact section */
padding: 3rem 2rem;

/* Hero section */
height: 80vh;
min-height: 600px;
```

### Grid Systems

**Two-column layout:**

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
gap: 2rem;
```

**Card grid:**

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 3rem;
```

---

## Components

### Buttons

**Primary Button:**

```css
.btn-primary {
	padding: 1rem 2.5rem;
	background: #c4a77d;
	color: #ffffff;
	font-weight: 500;
	font-size: 0.9375rem;
	letter-spacing: 0.05em;
	border-radius: 2px;
	transition: all 0.3s ease;
}

.btn-primary:hover {
	background: #a08960;
	transform: translateY(-2px);
}
```

**Secondary Button:**

```css
.btn-secondary {
	padding: 1rem 2.5rem;
	background: transparent;
	color: #ffffff;
	border: 1px solid #ffffff;
	font-weight: 500;
	font-size: 0.9375rem;
	letter-spacing: 0.05em;
	border-radius: 2px;
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: #ffffff;
	color: #1a1a1a;
}
```

### Cards

**Standard Card:**

```css
.card {
	background: #ffffff;
	border-radius: 4px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
}

.card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
```

**Card Header:**

```css
.card-header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1.5rem;
	background: #1a1a1a;
	color: #ffffff;
}

.card-icon {
	width: 24px;
	height: 24px;
	stroke: #c4a77d;
}
```

### Hero Section

```css
.hero {
	position: relative;
	height: 80vh;
	min-height: 600px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.hero-bg {
	position: absolute;
	inset: 0;
	background:
		linear-gradient(135deg, rgba(26, 26, 26, 0.5) 0%, rgba(26, 26, 26, 0.7) 100%),
		url('/path/to/image.jpg') center/cover;
	z-index: -1;
}
```

### Form Elements

**Text Input:**

```css
input[type='text'],
input[type='email'],
input[type='tel'] {
	padding: 1rem;
	border: 1px solid #e0e0e0;
	border-radius: 2px;
	font-size: 1rem;
	font-family: 'Inter', sans-serif;
	transition: all 0.3s ease;
}

input:focus {
	outline: none;
	border-color: #c4a77d;
}
```

**Select:**

```css
select {
	padding: 1rem;
	border: 1px solid #e0e0e0;
	border-radius: 2px;
	font-size: 1rem;
	font-family: 'Inter', sans-serif;
	background: #ffffff;
	cursor: pointer;
}
```

---

## Responsive Breakpoints

```css
/* Large screens */
@media (max-width: 1024px) {
	/* Tablet adjustments */
}

/* Medium screens */
@media (max-width: 768px) {
	/* Mobile landscape */
	.hero {
		height: 70vh;
		min-height: 500px;
	}

	.details-grid {
		grid-template-columns: 1fr;
	}

	.action-buttons {
		flex-direction: column;
	}
}

/* Small screens */
@media (max-width: 480px) {
	/* Mobile portrait */
}
```

---

## Best Practices

### 1. Transitions

Always use consistent transitions:

```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Or inline: */
transition: all 0.3s ease;
```

### 2. Hover Effects

- Buttons: `transform: translateY(-2px)` + color change
- Cards: `transform: translateY(-4px)` + shadow increase
- Links: Opacity change or color shift to accent

### 3. Shadows

```css
/* Card shadow */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

/* Elevated shadow */
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);

/* Button shadow */
box-shadow: 0 4px 15px rgba(196, 167, 125, 0.3);
```

### 4. Border Radius

- Cards: `4px`
- Buttons: `2px`
- Badges/Icons: `50%` (circular)

### 5. Accessibility

- Minimum touch target: 44px
- Color contrast ratio: 4.5:1 minimum
- Focus states: Visible outline or border color change

### 6. Image Handling

- Use `object-fit: cover` for consistent image sizing
- Always include `alt` text
- Optimize images (use WebP where possible)
- Add dark overlays (40-60% opacity) for text readability over images

### 7. Z-Index Scale

```css
z-index: 1; /* Content */
z-index: 10; /* Overlays */
z-index: 100; /* Navigation */
z-index: 1000; /* Modals */
```

---

## Files Reference

- **Global styles**: `src/app.css`
- **Landing page styles**: `src/lib/styles/new-landing.css`
- **Component styles**: Inline in `.svelte` files
- **Success page**: `src/routes/booking-success/+page.svelte`
- **Auth pages**: `src/routes/login/+page.svelte`, `src/routes/reset-password/[token]/+page.svelte`

---

## Implementation Notes

1. Always import Google Fonts in the component:

```html
<link
	href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
	rel="stylesheet"
/>
```

2. Use CSS custom properties for maintainability:

```css
:root {
	--color-primary: #1a1a1a;
	--color-secondary: #f5f5f0;
	--color-accent: #c4a77d;
	--font-heading: 'Playfair Display', serif;
	--font-body: 'Inter', sans-serif;
}
```

3. Keep styles scoped to components when possible to avoid conflicts.

4. Use Svelte's reactive statements for dynamic styling:

```svelte
<script>
  let scrolled = $state(false);
</script>

<div class:scrolled={scrolled}>
```

### Login Modal & Auth Pages

Used for login modal, login page (`/login`), and password reset page (`/reset-password/[token]`).

**Card Container:**

```css
.auth-card {
	background: #ffffff;
	width: 100%;
	max-width: 440px;
	border-radius: 16px;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	overflow: hidden;
}
```

**Logo Header:**

```css
.auth-logo {
	font-family: 'Playfair Display', serif;
	font-size: 1.75rem;
	font-weight: 600;
	color: #1a1a1a;
	margin-bottom: 0.5rem;
}

.auth-logo::after {
	content: '';
	display: block;
	width: 40px;
	height: 3px;
	background: #c4a77d;
	margin: 0.75rem auto 0;
	border-radius: 2px;
}
```

---

_Last updated: March 2, 2026_
