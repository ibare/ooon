import { pitchClassOf, pitchToMidi } from '@ooon/core';
import type { DrumNode, ScoreNode, SongBar, SongNode } from '@ooon/core';
import {
  calculateKeyboardLayout,
  calculateProgressionSystemLayout,
  calculateDrumSystemLayout,
  deriveKeyboardRange,
  type DrumSystemBar,
  type ProgressionSystemBar,
} from '@ooon/instrument-layouts';
import { calculateScoreLayout, type ScoreLayout } from '@ooon/score-engraving';
import type { SongLayout, SongSystemRow } from './types.js';
import { chooseChordVoicingMidis } from './voicing.js';

export interface SongLayoutOptions {
  width: number;
  /** progression 카드 높이. */
  chordHeight?: number;
  /** drum 트랙 한 줄 높이. */
  drumTrackHeight?: number;
  /** 영역 사이 수직 간격(progression↔score↔drum). */
  gap?: number;
  /** 시스템 사이 수직 간격(시스템 간 줄바꿈 간격). */
  systemGap?: number;
  /** keyboard 흰 건반 한 칸의 px 폭(미지정 시 width 기반 산정). */
  keyboardKeyWidth?: number;
  /** keyboard 흰 건반 높이. */
  keyboardHeight?: number;
}

const DEFAULT_GAP = 4;
const DEFAULT_SYSTEM_GAP = 20;
const DEFAULT_CHORD_HEIGHT = 56;
const DEFAULT_DRUM_TRACK_HEIGHT = 16;
const DEFAULT_KEYBOARD_HEIGHT = 96;
const MIN_KEYBOARD_KEY_WIDTH = 16;
const MAX_KEYBOARD_KEY_WIDTH = 32;
const TARGET_KEYBOARD_KEY_WIDTH = 24;

export function calculateSongLayout(node: SongNode, opts: SongLayoutOptions): SongLayout {
  const width = opts.width;
  const gap = opts.gap ?? DEFAULT_GAP;
  const systemGap = opts.systemGap ?? DEFAULT_SYSTEM_GAP;
  const chordHeight = opts.chordHeight ?? DEFAULT_CHORD_HEIGHT;
  const drumTrackHeight = opts.drumTrackHeight ?? DEFAULT_DRUM_TRACK_HEIGHT;
  const keyboardHeight = opts.keyboardHeight ?? DEFAULT_KEYBOARD_HEIGHT;

  const hasProgression = node.bars.length > 0;
  const hasDrum = !!node.beat && node.bars.some((b) => b.drum);

  // 1) Keyboard 음역 산출 — 필요 음역을 산출 후 컨테이너 폭에 맞춰 옥타브 단위로 좌우 패딩
  const songMidis = collectSongMidis(node);
  const { lowMidi: neededLow, highMidi: neededHigh } = deriveKeyboardRange(songMidis);
  const targetKeyWidth = opts.keyboardKeyWidth ?? TARGET_KEYBOARD_KEY_WIDTH;
  const { lowMidi, highMidi, keyWidth } = fitKeyboardToWidth({
    neededLow,
    neededHigh,
    width,
    targetKeyWidth,
    minKeyWidth: MIN_KEYBOARD_KEY_WIDTH,
    maxKeyWidth: MAX_KEYBOARD_KEY_WIDTH,
  });
  const keyboardLayout = calculateKeyboardLayout({
    lowMidi,
    highMidi,
    whiteKeyWidth: keyWidth,
    whiteKeyHeight: keyboardHeight,
    showLabels: true,
  });

  // 2) Score wrap 그룹 발견용 사전 계산.
  //    여기서 얻는 것은 systems[i].bars[].barNumber 그룹 정보뿐.
  const scoreFullAdapter: ScoreNode = {
    type: 'score',
    timeSignature: node.timeSignature,
    key: node.key,
    bpm: node.bpm,
    bars: node.bars.map((b) => ({ barNumber: b.barNumber, notes: [...b.melody] })),
    warnings: [],
  };
  const scoreFull = calculateScoreLayout(scoreFullAdapter, { width });
  const systemBarGroups: number[][] = scoreFull.systems.map((sys) =>
    sys.bars.map((b) => b.barNumber),
  );

  // 3) 각 system별로 score 단독 레이아웃 + progression/drum 정렬 산출
  const drumResolution = hasDrum ? deriveDrumResolution(node) : 16;
  const beatsPerBar = node.timeSignature.beats;

  const songSystems: SongSystemRow[] = [];
  let cursorY = keyboardHeight + systemGap;

  for (let si = 0; si < systemBarGroups.length; si += 1) {
    const barNumbers = systemBarGroups[si]!;
    const systemBars = barNumbers
      .map((bn) => node.bars.find((b) => b.barNumber === bn))
      .filter((b): b is SongBar => !!b);
    if (systemBars.length === 0) continue;

    const systemScoreAdapter: ScoreNode = {
      type: 'score',
      timeSignature: node.timeSignature,
      key: node.key,
      bpm: node.bpm,
      bars: systemBars.map((b) => ({ barNumber: b.barNumber, notes: [...b.melody] })),
      warnings: [],
    };
    // wrap='none' + system-local 좌표(staffY 기본 40 → system y = 0 부근)
    const systemScoreLayout: ScoreLayout = calculateScoreLayout(systemScoreAdapter, {
      width,
      wrap: 'none',
    });
    const sysScoreSystem = systemScoreLayout.systems[0];
    if (!sysScoreSystem) continue;

    // progression 카드들: systemBars의 chord에 system score의 bar X/너비를 주입
    let progressionBlock: SongSystemRow['progression'] | undefined;
    if (hasProgression) {
      const progressionBars: ProgressionSystemBar[] = systemBars.map((b) => {
        const sb = sysScoreSystem.bars.find((x) => x.barNumber === b.barNumber);
        const x = sb?.x ?? 0;
        const w = sb?.width ?? 0;
        const roman = deriveRomanFromChord(b.chord, node.key);
        return {
          barNumber: b.barNumber,
          x,
          width: w,
          chords: [
            {
              symbol: b.chord.symbol,
              notes: b.chord.notes,
              beats: b.chord.beats,
              ...(roman !== undefined ? { roman } : {}),
            },
          ],
        };
      });
      const prog = calculateProgressionSystemLayout({
        bars: progressionBars,
        cardHeight: chordHeight,
      });
      progressionBlock = { y: 0, height: chordHeight, cards: prog.cards };
    }

    // drum: systemBars의 drum 트랙을 시스템 단위로 슬라이스
    let drumBlock: SongSystemRow['drum'] | undefined;
    if (hasDrum) {
      const drumBars: DrumSystemBar[] = systemBars.map((b) => {
        const sb = sysScoreSystem.bars.find((x) => x.barNumber === b.barNumber);
        return {
          barNumber: b.barNumber,
          x: sb?.x ?? 0,
          width: sb?.width ?? 0,
        };
      });
      const slicedTracks = sliceDrumTracks(systemBars, drumResolution);
      const drumLayout = calculateDrumSystemLayout({
        bars: drumBars,
        tracks: slicedTracks,
        resolution: drumResolution,
        beatsPerBar,
        trackHeight: drumTrackHeight,
      });
      drumBlock = { y: 0, height: drumLayout.height, layout: drumLayout };
    }

    // system 내부 row 적층 (system-local Y)
    let inner = 0;
    if (progressionBlock) {
      progressionBlock = { ...progressionBlock, y: inner };
      inner += progressionBlock.height + gap;
    }
    const scoreInnerY = inner;
    const scoreHeight = systemScoreLayout.height;
    inner += scoreHeight;
    if (drumBlock) {
      inner += gap;
      drumBlock = { ...drumBlock, y: inner };
      inner += drumBlock.height;
    }
    const systemHeight = inner;

    const songSystem: SongSystemRow = {
      systemIndex: si,
      y: cursorY,
      height: systemHeight,
      score: { y: scoreInnerY, height: scoreHeight, layout: systemScoreLayout },
    };
    if (progressionBlock) songSystem.progression = progressionBlock;
    if (drumBlock) songSystem.drum = drumBlock;
    songSystems.push(songSystem);

    cursorY += systemHeight + systemGap;
  }

  const totalHeight = songSystems.length === 0 ? keyboardHeight : cursorY - systemGap;

  return {
    width,
    height: totalHeight,
    keyboard: { y: 0, height: keyboardHeight, layout: keyboardLayout },
    systems: songSystems,
  };
}

function collectSongMidis(node: SongNode): number[] {
  const midis = new Set<number>();
  for (const bar of node.bars) {
    for (const note of bar.melody) {
      if (note.isRest || note.pitches.length === 0) continue;
      for (const p of note.pitches) {
        try {
          midis.add(pitchToMidi(p));
        } catch {
          // ignore unparsable
        }
      }
    }
    for (const m of chooseChordVoicingMidis(bar.chord)) {
      midis.add(m);
    }
  }
  return [...midis];
}

const BLACK_PC: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

function countWhiteKeys(low: number, high: number): number {
  let n = 0;
  for (let m = low; m <= high; m += 1) {
    if (!BLACK_PC.has(((m % 12) + 12) % 12)) n += 1;
  }
  return n;
}

interface FitKeyboardArgs {
  neededLow: number;
  neededHigh: number;
  width: number;
  targetKeyWidth: number;
  minKeyWidth: number;
  maxKeyWidth: number;
}

/**
 * 필요 음역을 중앙에 두고, 컨테이너 폭에 맞춰 좌우로 옥타브 단위 패딩을 추가한다.
 * 결과 keyWidth는 [minKeyWidth, maxKeyWidth] 안에서 width를 정확히 채우는 값.
 * MIDI 0–127 경계로 클램프하며 좌우 비대칭이 생길 수 있음.
 */
function fitKeyboardToWidth(args: FitKeyboardArgs): {
  lowMidi: number;
  highMidi: number;
  keyWidth: number;
} {
  const { neededLow, neededHigh, width, targetKeyWidth, minKeyWidth, maxKeyWidth } = args;
  const neededWhites = countWhiteKeys(neededLow, neededHigh);
  if (width <= 0 || neededWhites === 0) {
    return { lowMidi: neededLow, highMidi: neededHigh, keyWidth: targetKeyWidth };
  }

  // 목표 키 폭 기준으로 컨테이너에 들어갈 흰 건반 총 수
  const targetWhites = Math.max(neededWhites, Math.floor(width / targetKeyWidth));
  const extraOctaves = Math.max(0, Math.floor((targetWhites - neededWhites) / 7));
  const leftOct = Math.floor(extraOctaves / 2);
  const rightOct = extraOctaves - leftOct;

  let lowMidi = Math.max(0, neededLow - leftOct * 12);
  let highMidi = Math.min(127, neededHigh + rightOct * 12);

  // 클램프로 잘린 만큼 반대쪽으로 보정
  if (lowMidi === 0 && neededLow - leftOct * 12 < 0) {
    const lost = leftOct * 12 - neededLow;
    highMidi = Math.min(127, highMidi + Math.floor(lost / 12) * 12);
  }
  if (highMidi === 127 && neededHigh + rightOct * 12 > 127) {
    const lost = neededHigh + rightOct * 12 - 127;
    lowMidi = Math.max(0, lowMidi - Math.floor(lost / 12) * 12);
  }

  const finalWhites = countWhiteKeys(lowMidi, highMidi);
  let keyWidth = width / finalWhites;
  if (keyWidth < minKeyWidth) keyWidth = minKeyWidth;
  if (keyWidth > maxKeyWidth) keyWidth = maxKeyWidth;

  return { lowMidi, highMidi, keyWidth };
}

/**
 * SongChord와 곡의 key로부터 표시용 로마 숫자를 추정한다.
 * 곡이 major 모드라고 가정한 단순 매핑 — 다이어토닉 외 코드(b/# 변이)는 undefined.
 * 결과 문자열은 progression-renderer의 기능 분류(romanFunction) 입력으로 쓰인다.
 */
function deriveRomanFromChord(
  chord: { root: string; quality: string },
  key: string,
): string | undefined {
  let rootPc: number;
  let keyPc: number;
  try {
    rootPc = pitchClassOf(chord.root);
    keyPc = pitchClassOf(key);
  } catch {
    return undefined;
  }
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
  const diff = (rootPc - keyPc + 12) % 12;
  const idx = MAJOR.indexOf(diff);
  if (idx < 0) return undefined;
  let r: string = NUMERALS[idx]!;
  const q = chord.quality;
  const isMinorish = q === 'm' || q === 'm7' || q === 'm7b5' || q === 'm6' || q === 'dim' || q === 'dim7';
  if (isMinorish) r = r.toLowerCase();
  if (q === 'dim' || q === 'dim7' || q === 'm7b5') r += '°';
  return r;
}

function deriveDrumResolution(node: SongNode): number {
  for (const bar of node.bars) {
    if (!bar.drum) continue;
    const first = Object.values(bar.drum)[0];
    if (first) return first.length;
  }
  return 16;
}

function sliceDrumTracks(
  bars: SongBar[],
  resolution: number,
): DrumNode['tracks'] {
  const merged: Partial<Record<'HH' | 'SN' | 'KK' | 'TM' | 'CR' | 'RD', boolean[]>> = {};
  for (const bar of bars) {
    if (!bar.drum) continue;
    for (const [track, cells] of Object.entries(bar.drum)) {
      const k = track as 'HH' | 'SN' | 'KK' | 'TM' | 'CR' | 'RD';
      if (!cells) continue;
      if (!merged[k]) merged[k] = [];
      // 안전하게 resolution 길이로 정규화
      const slice =
        cells.length === resolution
          ? cells
          : cells.length > resolution
          ? cells.slice(0, resolution)
          : [...cells, ...new Array<boolean>(resolution - cells.length).fill(false)];
      merged[k]!.push(...slice);
    }
  }
  return merged;
}
