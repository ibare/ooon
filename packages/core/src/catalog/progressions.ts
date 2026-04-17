export interface ProgressionEntry {
  id: string;
  name: string;
  mode: 'major' | 'minor';
  romans: readonly string[];
  description: string;
}

export const PROGRESSION_CATALOG: readonly ProgressionEntry[] = [
  {
    id: 'pop-1564',
    name: 'I–V–vi–IV (팝)',
    mode: 'major',
    romans: ['I', 'V', 'vi', 'IV'],
    description: '2000년대 이후 팝 음악의 대표 진행',
  },
  {
    id: 'pop-6415',
    name: 'vi–IV–I–V (감성 팝)',
    mode: 'major',
    romans: ['vi', 'IV', 'I', 'V'],
    description: 'I–V–vi–IV의 회전형',
  },
  {
    id: 'jazz-251',
    name: 'ii–V–I (재즈)',
    mode: 'major',
    romans: ['ii', 'V', 'I'],
    description: '재즈의 기본 해결 진행',
  },
  {
    id: 'circle-1625',
    name: 'I–vi–ii–V (순환)',
    mode: 'major',
    romans: ['I', 'vi', 'ii', 'V'],
    description: '50년대 팝의 순환 진행',
  },
  {
    id: 'epic-minor',
    name: 'i–VI–III–VII (에픽 마이너)',
    mode: 'minor',
    romans: ['i', 'VI', 'III', 'VII'],
    description: '영화·게임 음악의 장엄한 마이너 진행',
  },
  {
    id: 'andalusian',
    name: 'i–VII–VI–V (안달루시안)',
    mode: 'minor',
    romans: ['i', 'VII', 'VI', 'V'],
    description: '플라멩코·프리기안의 하행 진행',
  },
  {
    id: 'pachelbel',
    name: 'I–V–vi–iii–IV–I–IV–V (파헬벨)',
    mode: 'major',
    romans: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    description: '파헬벨의 캐논 진행',
  },
  {
    id: 'doo-wop',
    name: 'I–vi–IV–V (두왑)',
    mode: 'major',
    romans: ['I', 'vi', 'IV', 'V'],
    description: '50년대 두왑의 대표 진행',
  },
  {
    id: 'blues-1451',
    name: 'I–IV–V (블루스 3화음)',
    mode: 'major',
    romans: ['I', 'IV', 'V'],
    description: '블루스·록의 3화음 축',
  },
  {
    id: 'line-cliche',
    name: 'i–i(maj7)–i7–i6 (라인 클리셰)',
    mode: 'minor',
    romans: ['i', 'imaj7', 'i7', 'i6'],
    description: '마이너 라인 클리셰 — 내성이 반음씩 하행',
  },
] as const;

export function findProgression(id: string): ProgressionEntry | undefined {
  return PROGRESSION_CATALOG.find((p) => p.id === id);
}
