import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All colors are CSS variables — values swap on .dark / .light class
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        card:    'var(--color-card)',
        border:  'var(--color-border)',
        hover:   'var(--color-hover)',

        primary:   'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        muted:     'var(--color-muted)',

        accent: {
          DEFAULT: 'var(--color-accent)',
          dim:     'var(--color-accent-dim)',
          glow:    'var(--color-accent-glow)',
        },

        heat: {
          0: 'var(--color-heat-0)',
          1: 'var(--color-heat-1)',
          2: 'var(--color-heat-2)',
          3: 'var(--color-heat-3)',
          4: 'var(--color-heat-4)',
        },

        note:   'var(--color-note)',
        skill:  'var(--color-skill)',
        action: 'var(--color-action)',
        event:  'var(--color-event)',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        'slide-in':   'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':    'fadeIn 0.2s ease-out',
        'scale-in':   'scaleIn 0.15s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(129,140,248,0)' },
          '50%':      { boxShadow: '0 0 12px 2px rgba(129,140,248,0.3)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config