import type { TrackMute } from './audio/playback.js';

export type TrackKey = 'chord' | 'melody' | 'drum';
export type PlayState = 'idle' | 'loading' | 'playing';

export interface PlayerLabels {
  play: string;
  stop: string;
  loading?: string;
  chord: string;
  melody: string;
  drum: string;
}

export const DEFAULT_LABELS_EN: PlayerLabels = {
  play: 'Play',
  stop: 'Stop',
  loading: '…',
  chord: 'Chord',
  melody: 'Melody',
  drum: 'Beat',
};

export const DEFAULT_LABELS_KO: PlayerLabels = {
  play: '재생',
  stop: '정지',
  loading: '…',
  chord: '코드',
  melody: '멜로디',
  drum: '비트',
};

export interface ControlsBarOptions {
  labels?: PlayerLabels;
  onPlayToggle(): void;
  onMuteToggle(key: TrackKey): void;
}

export interface ControlsBarHandle {
  setState(state: PlayState): void;
  setMute(mute: TrackMute): void;
  setShowChips(show: boolean): void;
  dispose(): void;
}

const TRACK_KEYS: readonly TrackKey[] = ['chord', 'melody', 'drum'];

function makeButton(textContent: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--outline';
  btn.textContent = textContent;
  return btn;
}

/** 컨트롤 바를 host에 부착하고 핸들 반환. host는 보통 BlockPlayer가 만든 헤더 영역. */
export function createControlsBar(
  host: HTMLElement,
  opts: ControlsBarOptions,
): ControlsBarHandle {
  const labels = opts.labels ?? DEFAULT_LABELS_EN;
  const bar = document.createElement('div');
  bar.className = 'oon-controls';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.gap = '0.5em';
  bar.style.flexWrap = 'wrap';

  const chipWrap = document.createElement('div');
  chipWrap.style.display = 'flex';
  chipWrap.style.alignItems = 'center';
  chipWrap.style.gap = '0.5em';
  chipWrap.style.flexWrap = 'wrap';
  chipWrap.style.display = 'none';

  const chips: Record<TrackKey, HTMLButtonElement> = {
    chord: makeChip(labels.chord),
    melody: makeChip(labels.melody),
    drum: makeChip(labels.drum),
  };
  for (const k of TRACK_KEYS) {
    const chip = chips[k];
    chip.addEventListener('click', () => opts.onMuteToggle(k));
    chipWrap.appendChild(chip);
  }

  const playBtn = makeButton(labels.play);
  playBtn.style.fontSize = '0.85em';
  playBtn.style.padding = '0.3em 0.9em';
  playBtn.setAttribute('aria-label', labels.play);
  playBtn.addEventListener('click', () => opts.onPlayToggle());

  bar.appendChild(chipWrap);
  bar.appendChild(playBtn);
  host.appendChild(bar);

  let currentMute: TrackMute = {};
  applyMuteToChips(chips, currentMute);

  return {
    setState(state) {
      const text =
        state === 'playing' ? labels.stop
        : state === 'loading' ? (labels.loading ?? '…')
        : labels.play;
      playBtn.textContent = text;
      playBtn.setAttribute('aria-label', text);
    },
    setMute(mute) {
      currentMute = mute;
      applyMuteToChips(chips, mute);
    },
    setShowChips(show) {
      chipWrap.style.display = show ? 'flex' : 'none';
    },
    dispose() {
      host.removeChild(bar);
    },
  };
}

function makeChip(label: string): HTMLButtonElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'btn btn--outline';
  chip.textContent = label;
  chip.style.fontSize = '0.75em';
  chip.style.padding = '0.25em 0.7em';
  return chip;
}

function applyMuteToChips(chips: Record<TrackKey, HTMLButtonElement>, mute: TrackMute): void {
  for (const k of TRACK_KEYS) {
    const off = mute[k] === true;
    const chip = chips[k];
    chip.setAttribute('aria-pressed', off ? 'false' : 'true');
    chip.style.opacity = off ? '0.4' : '1';
    chip.style.textDecoration = off ? 'line-through' : 'none';
  }
}
