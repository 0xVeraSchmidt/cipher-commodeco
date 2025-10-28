import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [react()],
  define: {
    global: 'globalThis',  // Critical for FHE SDK compatibility
    'process.env': {}, // Prevent ethereum injection conflicts
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    include: [
      '@zama-fhe/relayer-sdk/bundle',  // Pre-build FHE SDK
      'react',
      'react-dom',
      'react/jsx-runtime',
      'ua-parser-js',
      'eventemitter3'
    ],
    exclude: [
      '@rainbow-me/rainbowkit',
      'ua-parser-js/src/ua-parser.js'
    ],
    force: true  // Force re-optimization
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react/jsx-runtime": "react/jsx-runtime",
      "react/jsx-dev-runtime": "react/jsx-dev-runtime",
      "ua-parser-js": "ua-parser-js/dist/ua-parser.min.js"
    },
    dedupe: ['eventemitter3', 'react', 'react-dom', 'ua-parser-js']  // Dedupe to avoid conflicts
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Prevent ethereum conflicts during build
        if (id.includes('ethereum') || id.includes('window.ethereum')) {
          return false;
        }
        return false;
      }
    }
  }
}));
