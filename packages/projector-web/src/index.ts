export { CanvasProjector } from './canvas-projector.js';
export type { CanvasProjectorOptions } from './canvas-projector.js';

export { loadBravura, isBravuraLoaded, resetBravuraLoader, FontLoadError } from './font-loader.js';
export type { LoadBravuraOptions } from './font-loader.js';

export { SmplrAudioEngine } from './smplr-audio-engine.js';
export type { SmplrAudioEngineOptions } from './smplr-audio-engine.js';

export { hitTest, canvasPointFromEvent } from './interactions/hit-testing.js';

export { THEME, FONT, METRICS } from './theme.js';
export type { ThemeKey, FontKey } from './theme.js';

export { renderKeyboard } from './renderers/keyboard-renderer.js';
export type { KeyboardRenderOptions } from './renderers/keyboard-renderer.js';
export { renderChord } from './renderers/chord-renderer.js';
export type { ChordRenderOptions } from './renderers/chord-renderer.js';
export { renderScale } from './renderers/scale-renderer.js';
export type { ScaleRenderOptions } from './renderers/scale-renderer.js';
export { renderNote } from './renderers/note-renderer.js';
export type { NoteRenderOptions } from './renderers/note-renderer.js';
export { renderScore } from './renderers/score-renderer.js';
export type { ScoreRenderOptions } from './renderers/score-renderer.js';
export { renderDrum } from './renderers/drum-renderer.js';
export type { DrumRenderOptions } from './renderers/drum-renderer.js';
export { renderFretboard } from './renderers/fretboard-renderer.js';
export type { FretboardRenderOptions } from './renderers/fretboard-renderer.js';
export { renderProgression } from './renderers/progression-renderer.js';
export type { ProgressionRenderOptions } from './renderers/progression-renderer.js';
export { renderSong } from './renderers/song-renderer.js';
export type { SongRenderOptions } from './renderers/song-renderer.js';
export { drawSongPlayheadOverlay } from './renderers/playhead-overlay.js';
export type { SongPlayheadOverlayOptions } from './renderers/playhead-overlay.js';
export { drawKeyboardHighlights } from './renderers/keyboard-highlights.js';
export type {
  KeyboardHighlightInput,
  KeyboardHighlightOptions,
} from './renderers/keyboard-highlights.js';
