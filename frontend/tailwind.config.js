export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0E27',
        surface: '#FFFFFF',
        sidebar: '#081024',
        primary: '#6C3BFF',
        secondary: '#8B5CF6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: '#111827',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(108, 59, 255, 0.18)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
