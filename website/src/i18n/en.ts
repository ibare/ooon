import type { Dictionary } from './types';

export const en: Dictionary = {
  nav: {
    home: 'Home',
    examples: 'Examples',
    showcase: 'Showcase',
    syntax: 'Syntax',
    playground: 'Playground',
    github: 'GitHub',
  },
  hero: {
    headline: 'Write music as plain text. See the score as you type.',
    sub: 'Oon is a lightweight library for writing music notation as a concise DSL and rendering it to Canvas in the browser. Score, drums, progressions, fretboard, and song structure — all in one text grammar.',
    cta_start: 'Get started',
    cta_github: 'GitHub',
  },
  problem: {
    title: 'Why Oon',
    sub: 'How Oon compares to existing notation tools',
    current_title: 'Limits of existing formats',
    current_items: [
      'MusicXML/MEI are hard for LLMs to emit reliably',
      'LilyPond/MuseScore need a separate engine and are heavy to embed',
      'ABC focuses on scores; drums, fretboard, and progressions are awkward',
    ],
    oon_title: 'Oon takes a different path',
    oon_items: [
      'An LLM-friendly plain-text DSL you can read and write in one line',
      'A single Canvas renderer that plugs into React, Tiptap, Svelte, or anything',
      'One grammar family for scores, drums, progressions, fretboard, and songs',
    ],
  },
  features: {
    title: 'Core blocks',
    sub: 'Drop-in building blocks for editors and docs',
    items: [
      { title: 'score', desc: '4/4, 6/8 meters and note/rest tokens rendered as a clean staff.' },
      { title: 'drum', desc: 'Kick/snare/hi-hat patterns laid out as a timeline grid.' },
      { title: 'progression', desc: 'Roman-numeral progressions rendered against a key signature.' },
      { title: 'fretboard', desc: 'Scale and chord positions drawn on a guitar neck.' },
      { title: 'song', desc: 'Sections, refrains, and bridges composed into one document.' },
      { title: 'inline tokens', desc: '`oon:C4`-style inline codes open a popover with the rendered note, chord, or scale.' },
    ],
  },
  quickStart: {
    title: 'Quick start',
    sub: 'Install only the packages you need',
    install: '# editor integration\npnpm add @oon/plugin-tiptap @oon/projector-web @oon/core',
    usage_label: 'Wire into Tiptap',
  },
  footerCta: {
    title: 'Start building',
    cta_github: 'View on GitHub',
    cta_npm: 'npm',
  },
  footer: {
    tagline: 'Oon — write music as text, render it on Canvas.',
  },
  examplesPage: {
    title: 'Examples',
    sub: 'DSL source and rendered output, side by side',
    source_label: 'DSL',
    render_label: 'Render',
    play: 'Play',
    stop: 'Stop',
    categories: {
      score: 'Score',
      drum: 'Drums',
      progression: 'Progression',
      fretboard: 'Fretboard',
      song: 'Song',
      inline: 'Inline',
    },
  },
  showcasePage: {
    title: 'Showcase',
    sub: 'Oon expresses any genre — from 12-bar blues to bossa nova',
    source_label: 'DSL',
    render_label: 'Render',
    genres: {
      blues: 'Blues',
      jazz: 'Jazz',
      pop: 'Pop',
      rock: 'Rock',
      bossa: 'Bossa Nova',
    },
  },
  syntaxPage: {
    title: 'Syntax reference',
    sub: 'Block headers, tokens, and parameters',
    sections: {
      overview: 'Overview',
      score: 'score',
      drum: 'drum',
      progression: 'progression',
      fretboard: 'fretboard',
      song: 'song',
      inline: 'Inline tokens',
    },
  },
  playgroundPage: {
    title: 'Playground',
    sub: 'A single empty bar — the canvas where the editing UX gets shaped.',
  },
};
