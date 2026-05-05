/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#2D5A6E',
        secondary: '#8FB9A8',
        tertiary: '#AEC6CF',
        neutral: '#F8FAF9',
      }
    },
    // Disable animations that might trigger reanimated
    animation: {
      'none': 'none',
    },
    transitionProperty: {
      'none': 'none',
    },
  },
  plugins: [],
  // Disable animation utilities
  corePlugins: {
    animation: false,
    transitionProperty: false,
    transitionDuration: false,
    transitionTimingFunction: false,
    transitionDelay: false,
    transform: false,
  }
}

