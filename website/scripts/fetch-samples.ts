/**
 * smplr 음원 일회성 다운로드 스크립트.
 *
 * - SplendidGrandPiano: smplr 소스의 LAYERS 정의에서 샘플 이름을 파싱해 ogg를 받는다.
 * - DrumMachine TR-808: dm.json을 받아 그 안의 baseUrl을 로컬 상대 경로로 치환해 저장하고,
 *   참조된 모든 ogg 샘플을 받는다.
 *
 * 결과물은 website/public/samples/ 하위에 저장되며, smplr의 baseUrl/url 옵션으로
 * 런타임에 그대로 주입된다. 기본 호출 포맷은 "ogg" 우선이므로 m4a는 받지 않는다.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const websiteRoot = resolve(__dirname, '..');
const samplesRoot = resolve(websiteRoot, 'public/samples');

const PIANO_SOURCE_URL =
  'https://raw.githubusercontent.com/danigb/smplr/main/src/splendid-grand-piano.ts';
const PIANO_REMOTE_BASE =
  'https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples';
const PIANO_LOCAL_DIR = resolve(samplesRoot, 'splendid-grand-piano');

const TR808_DM_JSON_URL = 'https://smpldsnds.github.io/drum-machines/TR-808/dm.json';
const TR808_LOCAL_DIR = resolve(samplesRoot, 'drum-machines/tr-808');

const CONCURRENCY = 8;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed (${res.status}): ${url}`);
  return await res.text();
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed (${res.status}): ${url}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, dest: string): Promise<number> {
  if (await exists(dest)) {
    const s = await stat(dest);
    return s.size;
  }
  const buf = await fetchBuffer(url);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf.length;
}

async function downloadMany(
  jobs: ReadonlyArray<{ url: string; dest: string }>,
  label: string,
): Promise<number> {
  let total = 0;
  let done = 0;
  let failed = 0;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < jobs.length) {
      const idx = cursor;
      cursor += 1;
      const job = jobs[idx]!;
      try {
        const size = await downloadFile(job.url, job.dest);
        total += size;
      } catch (err) {
        failed += 1;
        console.warn(`  ! ${job.url}: ${(err as Error).message}`);
      }
      done += 1;
      if (done % 25 === 0 || done === jobs.length) {
        process.stdout.write(
          `  [${label}] ${done}/${jobs.length} (${(total / 1024 / 1024).toFixed(1)} MB)\n`,
        );
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, () => worker());
  await Promise.all(workers);
  if (failed > 0) {
    throw new Error(`${label}: ${failed}건 다운로드 실패`);
  }
  return total;
}

function parsePianoSampleNames(src: string): string[] {
  // LAYERS 배열 안의 [midi, "샘플 이름"] 패턴 추출.
  // 샘플 이름은 항상 `<레이어 약어> <피치>` 형태(예: "PP B-1", "MF C#5").
  const re = /"([A-Z]+\s[A-G]#?b?-?\d+)"/g;
  const set = new Set<string>();
  for (const m of src.matchAll(re)) {
    set.add(m[1]!);
  }
  return [...set].sort();
}

async function fetchPiano(): Promise<number> {
  console.log(`[piano] LAYERS 메타데이터 수집: ${PIANO_SOURCE_URL}`);
  const src = await fetchText(PIANO_SOURCE_URL);
  const names = parsePianoSampleNames(src);
  console.log(`[piano] 샘플 ${names.length}건 → ${PIANO_LOCAL_DIR}`);
  const jobs = names.map((name) => ({
    url: `${PIANO_REMOTE_BASE}/${encodeURIComponent(name)}.ogg`,
    dest: resolve(PIANO_LOCAL_DIR, `${name}.ogg`),
  }));
  return await downloadMany(jobs, 'piano');
}

async function fetchTR808(): Promise<number> {
  console.log(`[tr-808] dm.json 수집: ${TR808_DM_JSON_URL}`);
  const dmRaw = await fetchText(TR808_DM_JSON_URL);
  const dm = JSON.parse(dmRaw) as { baseUrl: string; samples: string[]; formats?: string[] };
  // dm.json 안의 baseUrl은 대소문자 오류로 GitHub Pages에서 404를 낸다.
  // dm.json 자체를 받은 URL의 부모 디렉토리를 신뢰한다.
  const remoteBase = TR808_DM_JSON_URL.replace(/\/[^/]+$/, '');
  const samples = dm.samples;
  console.log(`[tr-808] 샘플 ${samples.length}건 → ${TR808_LOCAL_DIR}`);

  // dm.json의 baseUrl을 상대 경로로 치환해 저장.
  const localDm = { ...dm, baseUrl: './' };
  await mkdir(TR808_LOCAL_DIR, { recursive: true });
  await writeFile(resolve(TR808_LOCAL_DIR, 'dm.json'), JSON.stringify(localDm, null, 2));

  const jobs = samples.map((name) => ({
    url: `${remoteBase}/${name}.ogg`,
    dest: resolve(TR808_LOCAL_DIR, `${name}.ogg`),
  }));
  return await downloadMany(jobs, 'tr-808');
}

async function main(): Promise<void> {
  await mkdir(samplesRoot, { recursive: true });
  const t0 = Date.now();
  const pianoBytes = await fetchPiano();
  const drumBytes = await fetchTR808();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const totalMB = ((pianoBytes + drumBytes) / 1024 / 1024).toFixed(1);
  console.log(
    `완료: piano ${(pianoBytes / 1024 / 1024).toFixed(1)} MB + tr-808 ${(drumBytes / 1024).toFixed(0)} KB = ${totalMB} MB (${elapsed}s)`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
