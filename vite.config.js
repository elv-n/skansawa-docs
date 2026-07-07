import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || '';

  // Parse the Apps Script URL to get target origin and pathname
  let targetOrigin = '';
  let targetPath = '';
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      targetOrigin = parsed.origin;
      targetPath = parsed.pathname;
    } catch {
      console.warn('Invalid VITE_API_URL:', apiUrl);
    }
  }

  return {
    server: {
      proxy: targetOrigin
        ? {
            '/api': {
              target: targetOrigin,
              changeOrigin: true,
              followRedirects: true,
              rewrite: (path) => {
                // /api?action=getClasses&kelas=X → /macros/s/.../exec?action=getClasses&kelas=X
                const queryString = path.includes('?') ? path.split('?')[1] : '';
                return targetPath + (queryString ? '?' + queryString : '');
              },
            },
          }
        : {},
    },
  };
});
