import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1500, // Phaser besar; wajar
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'] },
});
