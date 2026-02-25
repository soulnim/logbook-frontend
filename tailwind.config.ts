import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        bg:      '#08080f',
        surface: '#0e0e1a',
        card:    '#13131f',
        border:  '#1c1c2e',
        hover:   '#1a1a2e',

        // Text
        primary:   '#e2e2f0',
        secondary: '#8888a8',
        muted:     '#44445a',

        // Accent — soft indigo
        accent: {
          DEFAULT: '#818cf8',
          dim:     '#4f56c4',
          glow:    'rgba(129,140,248,0.15)',
        },

        // Heatmap greens (GitHub-inspired but desaturated for dark theme)
        heat: {
          0: '#0e0e1a',
          1: '#1a3a2a',
          2: '#1e5c3a',
          3: '#26a95a',
          4: '#3dd68c',
        },

        // Entry type colours
        note:   '#818cf8',  // indigo
        skill:  '#34d399',  // emerald
        action: '#f59e0b',  // amber
        event:  '#f472b6',  // pink
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