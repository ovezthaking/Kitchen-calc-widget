import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Tryb 'widget' buduje pojedynczy, autonomiczny plik .js dla stron klientów
  if (mode === 'widget') {
    return {
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        lib: {
          entry: resolve(__dirname, 'src/widget.tsx'),
          name: 'KitchenCalculatorWidget',
          fileName: () => 'kalkulator-mebli.js',
          formats: ['iife'],
        },
        cssCodeSplit: false,
        emptyOutDir: false,
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
        },
      },
    };
  }

  // Domyślny build buduje pełną stronę Demo (pod wysyłkę linku na WhatsApp/SMS)
  return {
    plugins: [react(), tailwindcss()],
  };
});
