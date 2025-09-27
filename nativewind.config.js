/** @type {import('nativewind').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // Disable animations that require react-native-reanimated
  experimental: {
    // Disable CSS animations that would trigger reanimated
    cssInterop: {
      // Disable transform animations
      disableAnimations: true,
      // Use basic React Native animations instead of reanimated
      useReactNativeAnimations: false,
    }
  }
}