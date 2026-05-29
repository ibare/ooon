// @ts-check
/**
 * @ooon/tiptap — rollup 설정.
 *
 * 정책:
 *  - 단일 ESM entry (dist/index.js) + manualChunks 로 의미 분리.
 *  - external: @tiptap/core, @tiptap/pm, smplr — 호스트 단일 인스턴스 공유.
 *  - 내부 @ooon/* workspace 는 모두 번들에 inline.
 *  - .d.ts 는 별도 패스(rollup-plugin-dts, respectExternal:true) 로 단일 dist/index.d.ts.
 *  - Bravura.woff2 는 rollup-plugin-copy 로 dist/font/Bravura.woff2 산출.
 *    호스트는 `@ooon/tiptap/font/Bravura.woff2` 서브패스로 URL 자산을 받아
 *    `OoonRuntime({ bravuraUrl })` 에 주입.
 */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

const external = [
  /^@tiptap\/core$/,
  /^@tiptap\/pm(\/.*)?$/,
  /^smplr$/,
  /^smplr\/.*/,
];

function manualChunks(id) {
  if (/\/packages\/audio-engine-web\//.test(id)) return 'ooon-audio';
  if (/\/packages\/(projector-web|score-engraving|instrument-layouts|composition)\//.test(id)) {
    return 'ooon-render';
  }
  if (/\/packages\/(core|shared|smufl-asset)\//.test(id)) return 'ooon-core';
  return undefined;
}

const jsBundle = {
  input: 'src/index.ts',
  external,
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'index.js',
    chunkFileNames: 'chunks/[name]-[hash].js',
    sourcemap: true,
    generatedCode: 'es2015',
    manualChunks,
  },
  plugins: [
    nodeResolve({
      extensions: ['.ts', '.tsx', '.mjs', '.js'],
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    esbuild({
      target: 'es2022',
      sourceMap: true,
      tsconfig: 'tsconfig.json',
    }),
    copy({
      targets: [
        { src: '../smufl-asset/assets/Bravura.woff2', dest: 'dist/font' },
      ],
    }),
  ],
  onwarn(warning, warn) {
    // workspace 내부 cross-chunk 순환은 정상 동작.
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  },
};

const dtsBundle = {
  input: 'src/index.ts',
  external,
  output: {
    file: 'dist/index.d.ts',
    format: 'es',
  },
  // respectExternal: workspace 패키지 타입 정의를 따라가 단일 d.ts 에 inline.
  plugins: [dts({ respectExternal: true })],
};

export default [jsBundle, dtsBundle];
