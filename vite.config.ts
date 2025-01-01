/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, 'src/**/types'],
    },
  },
});
