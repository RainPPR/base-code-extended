# Contributing

## Design System

### Pattern

- **Name:** Hero + Features + CTA
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

### Style

- **Name:** Glassmorphism
- **Keywords:** Frosted glass, transparent, blurred background, layered, vibrant background, light source, depth, multi-layer
- **Best For:** Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays, navigation
- **Performance:** ⚠ Good | **Accessibility:** ⚠ Ensure 4.5:1

### Colors

| Role | Hex |
| ---- | --- |
| Primary | #1E293B |
| Secondary | #334155 |
| CTA | #22C55E |
| Background | #0F172A |
| Text | #F8FAFC |

Notes: Code dark + run green

### Typography

- **Heading:** Space Grotesk
- **Body:** DM Sans
- **Mood:** tech, startup, modern, innovative, bold, futuristic
- **Best For:** Tech companies, startups, SaaS, developer tools, AI products
- **Google Fonts:** <https://fonts.google.com/share?selection.family=DM+Sans:wght@400;500;700|Space+Grotesk:wght@400;500;600;700>
- **CSS Import:**

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

### Key Effects

Backdrop blur (10-20px), subtle border (1px solid rgba white 0.2), light reflection, Z-depth

### Avoid (Anti-patterns)

- Excessive animation
- Dark mode by default

### Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
