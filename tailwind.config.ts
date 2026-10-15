import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Every bordered element defaults to #e2e8f0 (Figma Neutral/200 border).
      // Tailwind's preflight uses `borderColor.DEFAULT` for `*`, so a bare
      // `border` / `border-x` picks this up without an explicit colour, and a
      // theme can change it in one place via the token.
      borderColor: {
        DEFAULT: 'var(--ds-color-border-default)',
      },
      colors: {
        // ── Existing portal palette ──
        // `primary` + its dark/light ramp are now TOKEN-DRIVEN and resolve to
        // the 7SEERS brand colour (see the "BRAND *IS* PRIMARY" block in
        // index.css). Every existing `bg-primary` / `text-primary` /
        // `border-primary-dark` utility across the app therefore follows
        // --brand, and a per-org override re-themes the product live — without
        // touching any of the 200+ call sites.
        "primary": {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Already full colours (color-mix), so no hsl() wrapper here.
        "primary-dark": 'var(--primary-dark)',
        "primary-light": 'var(--primary-light)',
        // `secondary` keeps its exact existing hex (teal) — the app's teal
        // accents are a separate decision from the brand/primary rebrand.
        "secondary": { DEFAULT: "#0D9488", foreground: "#ffffff" },
        "accent-coral": "#FB7185",
        "accent-teal": "#2DD4BF",
        "accent-yellow": "#FACC15",
        "background-light": "#F3F4F6",
        "surface-light": "#ffffff",
        "text-main": "#111827",
        "text-muted": "#6B7280",
        "border-light": "#E5E7EB",

        // ── 47B Design System tokens (from Ory — same Figma palette) ──
        // Added, non-colliding keys; all driven by the CSS vars in index.css.
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        // 7SEERS brand purple accent (auth/onboarding), overridable per-org.
        brand: { DEFAULT: 'hsl(var(--brand))', foreground: 'hsl(var(--brand-foreground))' },
        // Neutral slate ramp backed by the primitive gray tokens.
        ink: {
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        // Auth hero derived tints.
        'hero-icon': 'var(--hero-icon)',
        'hero-grad-from': 'var(--hero-grad-from)',
        'hero-grad-to': 'var(--hero-grad-to)',
        'hero-subtitle': 'var(--hero-subtitle)',
        // Chart series tokens.
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        // Work Sans — the Figma "Redesign-2026" font (self-hosted via
        // @fontsource/work-sans, imported in main.tsx). Now the app-wide default
        // too: every revamped screen uses it and the legacy screens are being
        // replaced, so `display` / `sans` lead with it as well. `font-work` is
        // kept as an explicit opt-in for anything that needs to state it.
        "work": ["Work Sans", "sans-serif"],
        // System font stack as fallback to prevent OS-level font differences
        "display": ["Work Sans", "sans-serif"],
        // Sans font uses the same stack for consistency
        "sans": ["Work Sans", "sans-serif"]
      },
      // Responsive typography scale
      fontSize: {
        // Mobile-first responsive sizes with consistent line-height and letter-spacing
        "xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        "sm": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.005em" }],
        "base": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0em" }],
        "lg": ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.005em" }],
        "xl": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }],
        "5xl": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.03em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.035em" }],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "24px",
        "full": "9999px"
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(37, 99, 235, 0.3)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cardEntrance: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        modalShake: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.95)' },
          '50%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.02)' },
          '70%': { transform: 'translate(-50%, -50%) scale(0.98)' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)' },
        },
        // OTP caret blink. `tailwindcss-animate` does NOT ship this one —
        // shadcn expects it in the app's own config. Used by InputOTP's caret.
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
        // shadcn accordion (Radix) — used by the ported UI components.
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 150ms ease-out',
        fadeOut: 'fadeOut 150ms ease-in',
        scaleIn: 'scaleIn 150ms ease-out',
        slideInRight: 'slideInRight 300ms ease-out',
        slideOutRight: 'slideOutRight 300ms ease-in',
        slideInUp: 'slideInUp 400ms ease-out',
        cardEntrance: 'cardEntrance 400ms ease-out',
        shake: 'shake 400ms ease-in-out',
        modalShake: 'modalShake 300ms ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
    },
  },
  // Provides `animate-in` / `animate-out` / `fade-in-0` / `zoom-in-95` /
  // `slide-in-from-*` / `animate-caret-blink` — used by the Radix-based UI
  // components for their enter/exit transitions.
  plugins: [tailwindcssAnimate],
}

export default config
