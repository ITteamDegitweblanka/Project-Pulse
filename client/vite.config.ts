import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
  // Gemini API references removed
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
  // No dev proxy; client will call backend via absolute URL (VITE_API_BASE_URL)
    };
});
