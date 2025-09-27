/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
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

