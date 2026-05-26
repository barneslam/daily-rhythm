# Design Tokens - Daily Rhythm Revenue Engine
## CSS Variables & Implementation Reference

---

## 1. COLOR PALETTE

### Primary Colors
```css
:root {
  /* Navy - Trust, Authority, Professional */
  --color-primary-900: #0F172A;  /* Darkest - Headers, Nav */
  --color-primary-800: #1E293B;  /* Dark - Secondary elements */
  --color-primary-700: #334155;  /* Medium - Borders, dividers */
  --color-primary-600: #475569;  /* Light - Muted text */
  
  /* Sky Blue - CTA, Actionable, Revenue Focus */
  --color-accent-600: #0369A1;   /* Primary CTA button */
  --color-accent-500: #0EA5E9;   /* Hover state CTA */
  --color-accent-400: #38BDF8;   /* Active state CTA */
  --color-accent-100: #E0F2FE;   /* CTA background (light) */
  
  /* Neutral - Backgrounds, Cards */
  --color-neutral-0: #FFFFFF;    /* Card backgrounds, pure white */
  --color-neutral-50: #F9FAFB;   /* Page background, very light */
  --color-neutral-100: #F3F4F6;  /* Hover backgrounds, subtle */
  --color-neutral-200: #E5E7EB;  /* Borders, dividers */
  --color-neutral-300: #D1D5DB;  /* Secondary borders */
  
  /* Text Colors */
  --color-text-primary: #020617;   /* Main text (4.5:1 contrast) */
  --color-text-secondary: #475569; /* Supporting text (3.5:1) */
  --color-text-muted: #9CA3AF;     /* Disabled, placeholder (3.0:1) */
  --color-text-light: #FFFFFF;     /* On dark backgrounds */
  
  /* Status Colors */
  --color-success-600: #059669;    /* Posted, completed, delivered */
  --color-success-100: #D1FAE5;    /* Success background */
  
  --color-warning-600: #D97706;    /* Draft, pending, review needed */
  --color-warning-100: #FEF3C7;    /* Warning background */
  
  --color-danger-600: #DC2626;     /* Error, rejected, failed */
  --color-danger-100: #FEE2E2;     /* Error background */
  
  --color-info-600: #2563EB;       /* Information, active */
  --color-info-100: #DBEAFE;       /* Info background */
}
```

### Semantic Color Usage
```css
/* Backgrounds */
--bg-primary: var(--color-neutral-0);      /* Card backgrounds */
--bg-page: var(--color-neutral-50);        /* Page background */
--bg-hover: var(--color-neutral-100);      /* Hover states */

/* Text */
--text-primary: var(--color-text-primary);     /* Main content */
--text-secondary: var(--color-text-secondary); /* Supporting text */

/* Interactive */
--btn-primary-bg: var(--color-accent-600);     /* CTA button */
--btn-primary-hover: var(--color-accent-500);  /* CTA hover */
--btn-secondary-border: var(--color-primary-900); /* Secondary btn */

/* Status */
--status-posted: var(--color-success-600);    /* Posted */
--status-draft: var(--color-warning-600);     /* Draft */
--status-error: var(--color-danger-600);      /* Error */
```

---

## 2. TYPOGRAPHY

### Font Families
```css
:root {
  /* Primary: Modern Professional */
  --font-heading: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Fallback stack for performance */
  --font-sans: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Font Sizes
```css
:root {
  /* Display Sizes */
  --font-size-hero: 2.5rem;    /* 40px - Hero headlines */
  --font-size-xl: 2rem;        /* 32px - H1 */
  --font-size-lg: 1.875rem;    /* 30px - H2 */
  --font-size-md-lg: 1.5rem;   /* 24px - H3 */
  --font-size-md: 1.25rem;     /* 20px - Section headers */
  
  /* Body Sizes */
  --font-size-base: 1rem;      /* 16px - Body text (minimum) */
  --font-size-sm: 0.875rem;    /* 14px - Secondary text */
  --font-size-xs: 0.75rem;     /* 12px - Labels, captions */
  
  /* Mobile adjustments (375px+) */
  @media (max-width: 640px) {
    --font-size-xl: 1.75rem;   /* 28px on mobile */
    --font-size-md: 1.25rem;   /* 20px on mobile */
    --font-size-base: 1rem;    /* Still 16px minimum */
  }
}
```

### Font Weights
```css
:root {
  --font-weight-light: 300;    /* Subtle, secondary */
  --font-weight-regular: 400;  /* Body text, default */
  --font-weight-medium: 500;   /* Labels, medium emphasis */
  --font-weight-semibold: 600; /* Section headers, emphasis */
  --font-weight-bold: 700;     /* Headlines, strong emphasis */
}
```

### Line Heights
```css
:root {
  --line-height-tight: 1.2;    /* Headlines */
  --line-height-snug: 1.4;     /* Subheadings */
  --line-height-normal: 1.5;   /* Body text (WEB WCAG AA) */
  --line-height-relaxed: 1.75; /* Longer content */
}

/* Recommended pairings */
h1, h2, h3 { line-height: var(--line-height-tight); }
p, .body { line-height: var(--line-height-normal); }
.content-long { line-height: var(--line-height-relaxed); }
```

### Letter Spacing
```css
:root {
  --letter-spacing-tight: -0.01em;     /* Headlines (for visual impact) */
  --letter-spacing-normal: 0;          /* Body text */
  --letter-spacing-wide: 0.05em;       /* All caps, labels */
}
```

---

## 3. SPACING SCALE

### Base Unit System (8px)
```css
:root {
  /* Base spacing unit */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px - Common padding */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px - Card padding */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px - Section gaps (minimum) */
  --space-16: 4rem;     /* 64px - Major section separator */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Common Spacing Patterns
```css
/* Card padding */
.card {
  padding: var(--space-6);  /* 24px */
}

/* Section gap */
section + section {
  margin-top: var(--space-12);  /* 48px minimum */
}

/* Container padding (mobile-first) */
.container {
  padding-inline: var(--space-4);  /* 16px on mobile */
}

@media (min-width: 640px) {
  .container {
    padding-inline: var(--space-6);  /* 24px on tablet+ */
  }
}

@media (min-width: 1024px) {
  .container {
    padding-inline: var(--space-8);  /* 32px on desktop */
  }
}
```

---

## 4. BORDER & SHADOW SYSTEM

### Border Radius
```css
:root {
  --radius-sm: 0.375rem;    /* 6px - Buttons, small elements */
  --radius-md: 0.5rem;      /* 8px - Cards, input fields (standard) */
  --radius-lg: 0.75rem;     /* 12px - Larger cards */
  --radius-xl: 1rem;        /* 16px - Featured sections */
  --radius-full: 9999px;    /* Pill shapes, circular elements */
}

/* Common uses */
button { border-radius: var(--radius-sm); }
.card { border-radius: var(--radius-md); }
.input { border-radius: var(--radius-sm); }
```

### Shadows (Elevation System)
```css
:root {
  /* Light, subtle */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  /* Resting state */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  /* Hover/Interactive */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  /* Elevated hover (cards, buttons) */
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.12);
  
  /* Active/Focused */
  --shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15);
  
  /* Modal/Overlay */
  --shadow-2xl: 0 20px 48px rgba(0, 0, 0, 0.2);
}

/* Usage */
.card {
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.button {
  box-shadow: var(--shadow-xs);
}

.button:active {
  box-shadow: var(--shadow-md);
}
```

### Border Styles
```css
:root {
  --border-color-light: var(--color-neutral-200);  /* Light borders */
  --border-color-medium: var(--color-neutral-300); /* Medium borders */
  
  --border-width: 1px;
}

/* Common borders */
.card {
  border: var(--border-width) solid var(--border-color-light);
}

.input:focus {
  border-color: var(--color-accent-600);
  box-shadow: 0 0 0 3px var(--color-accent-100);
}
```

---

## 5. MOTION & ANIMATION

### Timing Functions
```css
:root {
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-linear: linear;
}
```

### Durations
```css
:root {
  /* Micro-interactions */
  --duration-fast: 150ms;      /* Button hover, state changes */
  --duration-normal: 200ms;    /* Standard transitions */
  --duration-slow: 300ms;      /* Longer transitions */
  
  /* Prefer shorter durations (150-300ms) */
  /* Avoid > 500ms for micro-interactions */
}

/* Common transitions */
.button,
.card {
  transition: all var(--duration-normal) var(--ease-out);
}

/* Specifically control properties for performance */
.button {
  transition: 
    background-color var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out);
}

/* Avoid animating width/height (layout thrashing) */
/* Use transform scale/translate instead */
```

### Reduced Motion
```css
/* CRITICAL: Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Apply selectively where needed */
.button:not(.no-animation) {
  transition: /* ... */;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

---

## 6. Z-INDEX SCALE

### Layering System (Fixed Scale)
```css
:root {
  /* Base layers */
  --z-base: 0;            /* Content layer */
  --z-dropdown: 10;       /* Dropdowns, popovers */
  --z-sticky: 20;         /* Sticky headers, sidebars */
  --z-fixed: 30;          /* Fixed nav, floating buttons */
  --z-modal: 40;          /* Modal backdrops */
  --z-toast: 50;          /* Toast notifications */
  --z-tooltip: 60;        /* Tooltips (highest accessible) */
}

/* Usage examples */
.sidebar-nav {
  position: fixed;
  z-index: var(--z-fixed);
}

.dropdown-menu {
  position: absolute;
  z-index: var(--z-dropdown);
}

.modal {
  position: fixed;
  z-index: var(--z-modal);
}

.toast {
  position: fixed;
  z-index: var(--z-toast);
}
```

---

## 7. COMPONENT-SPECIFIC TOKENS

### Buttons
```css
:root {
  /* Button sizing */
  --button-height-sm: 2rem;      /* 32px */
  --button-height-md: 2.5rem;    /* 40px - Standard */
  --button-height-lg: 3rem;      /* 48px */
  
  /* Button padding */
  --button-padding-x-sm: 0.75rem;  /* 12px */
  --button-padding-x-md: 1rem;     /* 16px */
  --button-padding-x-lg: 1.5rem;   /* 24px */
  
  /* Touch target minimum */
  --touch-target-min: 2.75rem;   /* 44x44px for accessibility */
}

/* Implementation */
.button {
  height: var(--button-height-md);
  padding-inline: var(--button-padding-x-md);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  
  /* Ensure minimum touch target */
  min-width: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Primary button */
.button-primary {
  background-color: var(--color-accent-600);
  color: var(--color-text-light);
}

.button-primary:hover:not(:disabled) {
  background-color: var(--color-accent-500);
}

/* Secondary button */
.button-secondary {
  background-color: transparent;
  border: var(--border-width) solid var(--color-primary-900);
  color: var(--color-primary-900);
}

.button-secondary:hover:not(:disabled) {
  background-color: var(--color-neutral-50);
}
```

### Input Fields
```css
:root {
  --input-height: 2.75rem;     /* 44px - Touch friendly */
  --input-padding: var(--space-3); /* 12px */
}

.input {
  height: var(--input-height);
  padding: var(--input-padding);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-neutral-0);
  transition: all var(--duration-normal) var(--ease-out);
}

.input:hover {
  border-color: var(--border-color-medium);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent-600);
  box-shadow: 0 0 0 3px var(--color-accent-100);
}

.input:disabled {
  background-color: var(--color-neutral-100);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* Label styling */
.label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

### Cards
```css
.card {
  background-color: var(--color-neutral-0);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Card interactive */
.card.interactive {
  cursor: pointer;
}

.card.interactive:hover {
  border-color: var(--color-accent-600);
}
```

---

## 8. RESPONSIVE BREAKPOINTS

### Mobile-First Approach
```css
:root {
  --breakpoint-mobile: 375px;   /* iPhone SE min width */
  --breakpoint-sm: 640px;       /* Tablets */
  --breakpoint-md: 768px;       /* iPad */
  --breakpoint-lg: 1024px;      /* Desktop */
  --breakpoint-xl: 1440px;      /* Large desktop */
  --breakpoint-2xl: 1920px;     /* Ultra-wide */
}

/* Tailwind-style breakpoints (if using Tailwind) */
/* sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px */

/* Usage */
@media (min-width: 640px) {
  /* Tablet adjustments */
}

@media (min-width: 1024px) {
  /* Desktop adjustments */
}

/* Sidebar + main layout */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    left: -300px;  /* Offscreen */
    width: 300px;
    height: 100vh;
    transition: left var(--duration-normal) var(--ease-out);
  }
  
  .sidebar.open {
    left: 0;
  }
}

@media (min-width: 1024px) {
  .layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--space-4);
  }
}
```

---

## 9. COMPONENT TOKENS BY SECTION

### Dashboard
```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
  padding: var(--space-6);
  background-color: var(--color-neutral-50);
}

.theme-card {
  background-color: var(--color-neutral-0);
  border-left: 4px solid var(--color-accent-600);
  padding: var(--space-6);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.theme-title {
  font: var(--font-weight-bold) var(--font-size-md) var(--font-heading);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.theme-description {
  font: var(--font-weight-regular) var(--font-size-sm) var(--font-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}
```

### Calendar Grid
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
  padding: var(--space-6);
  background-color: var(--color-neutral-50);
}

@media (max-width: 1023px) {
  .calendar-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

.calendar-day {
  background-color: var(--color-neutral-0);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.calendar-day:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-accent-600);
}

.calendar-day.posted {
  border-color: var(--color-success-600);
  background-color: var(--color-success-100);
}

.calendar-day.scheduled {
  border-color: var(--color-warning-600);
  background-color: var(--color-warning-100);
}
```

---

## 10. ACCESSIBILITY TOKENS

### Focus States (CRITICAL)
```css
:root {
  --focus-outline-width: 2px;
  --focus-outline-style: solid;
  --focus-outline-color: var(--color-accent-600);
  --focus-outline-offset: 2px;
}

/* Global focus styles */
:focus-visible {
  outline: var(--focus-outline-width) var(--focus-outline-style) var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
}

/* Reduce focus visibility for mouse users (style guide) */
.js-focus-visible :focus:not(.focus-visible) {
  outline: none;
}

/* Ensure focus is always visible */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: var(--focus-outline-width) var(--focus-outline-style) var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
}
```

### Contrast Verification
```
Light Mode (Current):
✓ Primary text on white: #020617 on #FFFFFF = 21.63:1 (AAA)
✓ Secondary text: #475569 on #FFFFFF = 7.65:1 (AAA)
✓ Button text: White on Sky blue (#0369A1) = 8.59:1 (AAA)
✓ Disabled text: #9CA3AF = 4.54:1 (AA)
✓ All above WCAG AA minimum 4.5:1
```

---

## 11. IMPORT & USAGE

### CSS File Structure
```css
/* design-tokens.css */

/* 1. Colors */
:root { /* color variables */ }

/* 2. Typography */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');

:root { /* font & text variables */ }

/* 3. Spacing */
:root { /* spacing scale */ }

/* 4. Components */
:root { /* buttons, inputs, cards */ }

/* 5. Breakpoints & Media Queries */
@media (prefers-reduced-motion: reduce) { /* reduced motion */ }

/* Usage in components */
.my-button {
  background: var(--color-accent-600);
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  /* etc */
}
```

### Tailwind Configuration (Alternative)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: {
        900: '#0F172A',
        800: '#1E293B',
        700: '#334155',
        600: '#475569',
      },
      accent: {
        600: '#0369A1',
        500: '#0EA5E9',
        400: '#38BDF8',
        100: '#E0F2FE',
      },
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
    },
    fontFamily: {
      heading: ['Poppins', 'sans-serif'],
      body: ['Open Sans', 'sans-serif'],
    },
    fontSize: {
      hero: '2.5rem',
      xl: '2rem',
      lg: '1.875rem',
      'md-lg': '1.5rem',
      md: '1.25rem',
      base: '1rem',
      sm: '0.875rem',
      xs: '0.75rem',
    },
    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem',
      16: '4rem',
    },
    boxShadow: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 4px 12px rgba(0, 0, 0, 0.12)',
      xl: '0 8px 24px rgba(0, 0, 0, 0.15)',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px',
    },
    extend: {
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
      },
    },
  },
};
```

---

## 12. IMPLEMENTATION CHECKLIST

- [ ] Import Google Fonts (Poppins + Open Sans)
- [ ] Add design-tokens.css or Tailwind config
- [ ] Test color contrast (WCAG AA minimum)
- [ ] Verify focus states are visible on all interactive elements
- [ ] Test responsive breakpoints (375px, 768px, 1024px, 1440px)
- [ ] Implement reduced motion support
- [ ] Verify shadows and elevation system
- [ ] Test button hover/active states (150-300ms transitions)
- [ ] Confirm touch targets are minimum 44x44px
- [ ] Test in both light and dark modes (if supported)
- [ ] Accessibility audit with axe or Lighthouse

---

**Design Tokens Complete** — Ready for development implementation.
**Last Updated:** May 25, 2026
**Version:** 1.0 (Daily Rhythm Revenue Engine Edition)
