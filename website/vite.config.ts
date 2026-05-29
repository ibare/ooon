import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ooon/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // workspace 패키지(@ooon/*)는 prebundle 캐시에 잡히면 dist 변경이 dev에 반영되지 않는다.
  // exclude로 vite가 매번 워크스페이스 dist를 그대로 따라가도록 한다.
  optimizeDeps: {
    exclude: [
      '@ooon/composition',
      '@ooon/core',
      '@ooon/editor-core',
      '@ooon/editor-web',
      '@ooon/instrument-layouts',
      '@ooon/player-web',
      '@ooon/projector-web',
      '@ooon/score-engraving',
      '@ooon/shared',
      '@ooon/smufl-asset',
      '@ooon/tiptap',
    ],
  },
  // 모노레포 외부(상위 디렉터리) 파일을 dev 서버가 읽을 수 있게 허용 — workspace dist 접근.
  server: {
    fs: { allow: ['..'] },
  },
});
