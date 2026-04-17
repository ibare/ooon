import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const source = resolve(root, 'node_modules/@vexflow-fonts/bravura/bravura.woff2');
const target = resolve(root, 'public/fonts/Bravura.woff2');

async function main(): Promise<void> {
  try {
    await stat(source);
  } catch {
    throw new Error(
      `Bravura WOFF2 not found at ${source}. Run "pnpm install" in website/ first.`,
    );
  }
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log(`copied Bravura.woff2 -> ${target}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
