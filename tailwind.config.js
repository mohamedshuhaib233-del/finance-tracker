/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Off-White and Light Surfaces (mapped for 100% component compatibility)
        navy: {
          950: '#F8FAF8', // Soft off-white main background
          900: '#FFFFFF', // Pure white cards & modals
          850: '#F1F5F2', // Subtle off-white card/container
          800: '#E8EFEA', // Input fields & button background
          750: '#DFEAE2', // Hover state for inputs & subtle pills
          700: '#D1E3D6', // Border and separator
          600: '#10B981', // Vibrant emerald
          500: '#059669', // Rich emerald
        },
        // Typography mapped to high-contrast Dark Charcoal & Forest Slate
        pearl: {
          50: '#064E3B',  // Deep forest green for main titles & logos
          100: '#0F172A', // Deep charcoal for main text
          200: '#1E293B', // Dark slate for subheadings
          300: '#334155', // Slate for body text
          400: '#64748B', // Muted slate for captions & labels
          500: '#94A3B8', // Placeholder text
        },
        // Primary Brand Accent: "Nalla Nice Green" (replaces gold tokens)
        gold: {
          300: '#34D399',
          400: '#10B981', // Primary green accent
          500: '#059669', // Primary green button/focus
          600: '#047857', // Hover green
          700: '#064E3B', // Deep forest green
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        crimson: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'pearl': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'gold': '0 4px 14px rgba(5, 150, 105, 0.25)',
        'luxury': '0 10px 30px -5px rgba(6, 78, 59, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
