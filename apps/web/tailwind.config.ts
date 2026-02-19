import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#F5B94B',
          light: '#f9d07c',
          dark: '#d4981f',
        },
        page: '#08090d',
        surface: '#0d0f14',
      },
      borderRadius: {
        'glass': '20px',
      },
      boxShadow: {
        'glass': 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.12)',
        'glass-hover': 'inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 55px rgba(0,0,0,0.34), 0 0 0 6px rgba(245,185,75,0.10)',
        'btn': '0 14px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
        'btn-hover': '0 18px 55px rgba(0,0,0,0.34), 0 0 0 6px rgba(245,185,75,0.12), inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
