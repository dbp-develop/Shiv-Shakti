/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/Shiv-Shakti/',
  plugins: [preact()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts?(x)', 'tests/content/**/*.test.ts'],
  },
});
