const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Landfall is a light-only design (see global.css) — no dark: variants.
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        subtle: 'hsl(var(--subtle))',
        well: 'hsl(var(--well))',
        paper: {
          DEFAULT: 'hsl(var(--paper))',
          foreground: 'hsl(var(--paper-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Categorical signals — one per timeline row, never two.
        transit: {
          DEFAULT: 'hsl(var(--transit))',
          muted: 'hsl(var(--transit-muted))',
          strong: 'hsl(var(--transit-strong))',
        },
        stay: {
          DEFAULT: 'hsl(var(--stay))',
          muted: 'hsl(var(--stay-muted))',
        },
        place: {
          DEFAULT: 'hsl(var(--place))',
          muted: 'hsl(var(--place-muted))',
          strong: 'hsl(var(--place-strong))',
        },
        settled: {
          DEFAULT: 'hsl(var(--settled))',
          muted: 'hsl(var(--settled-muted))',
          strong: 'hsl(var(--settled-strong))',
        },
        owed: {
          DEFAULT: 'hsl(var(--owed))',
          muted: 'hsl(var(--owed-muted))',
          strong: 'hsl(var(--owed-strong))',
        },
      },
      fontFamily: {
        display: ['SpaceGrotesk_600SemiBold'],
        'display-medium': ['SpaceGrotesk_500Medium'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
        mono: ['JetBrainsMono_500Medium'],
        hand: ['Caveat_500Medium'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
        '3xl': '22px',
        '4xl': '26px',
        '5xl': '32px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};
