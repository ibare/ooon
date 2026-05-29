import type { Dictionary } from './types';

export const en: Dictionary = {
  nav: {
    home: 'Home',
    getStarted: 'Get Started',
    showcase: 'Showcase',
    syntax: 'Syntax',
    playground: 'Playground',
    github: 'GitHub',
  },
  hero: {
    headline: 'Write music as plain text. See the score as you type.',
    sub: 'Ooon is a lightweight library for writing music notation as a concise DSL and rendering it to Canvas in the browser. Score, drums, progressions, fretboard, and song structure — all in one text grammar.',
    cta_start: 'Get started',
    cta_github: 'GitHub',
  },
  problem: {
    title: 'Why Ooon',
    sub: 'How Ooon compares to existing notation tools',
    current_title: 'Limits of existing formats',
    current_items: [
      'MusicXML/MEI are hard for LLMs to emit reliably',
      'LilyPond/MuseScore need a separate engine and are heavy to embed',
      'ABC focuses on scores; drums, fretboard, and progressions are awkward',
    ],
    oon_title: 'Ooon takes a different path',
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
      { title: 'inline tokens', desc: '`ooon:C4`-style inline codes open a popover with the rendered note, chord, or scale.' },
    ],
  },
  quickStart: {
    title: 'Quick start',
    sub: 'Install only the packages you need',
    install: '# editor integration\npnpm add @ooon/tiptap',
    usage_label: 'Wire into Tiptap',
  },
  footerCta: {
    title: 'Start building',
    cta_github: 'View on GitHub',
    cta_npm: 'npm',
  },
  footer: {
    tagline: 'Ooon — write music as text, render it on Canvas.',
  },
  getStartedPage: {
    title: 'Get Started',
    sub: 'Embed Ooon in your markdown editor and learn the DSL — step by step, from install to a live editor you can poke.',
    install_label: 'Install',
    source_label: 'DSL',
    render_label: 'Render',
    sections: {
      intro: {
        title: 'How Ooon plugs in',
        body: 'Ooon attaches to a host app in two ways. First, by intercepting ```ooon code fences in a markdown editor like Tiptap and rendering them as a NodeView on canvas. Second, by mounting the DSL directly to a page via a single component. This page walks through the first path — the @ooon/tiptap entry bundle — end to end. The last section is a live editor where you can edit fence bodies and watch the canvas update.',
      },
      install: {
        title: '1. Install',
        body: 'Hosts only depend on a single entry bundle. All internal workspace packages (@ooon/core, @ooon/projector-web, and so on) are inlined into one ESM bundle, so the host never has to chase transitive dependencies.',
        peer_label: 'peer dependencies — the host provides these',
        peers: [
          { name: '@tiptap/core', range: '>=2.6.0' },
          { name: '@tiptap/pm', range: '>=2.6.0' },
          { name: 'smplr', range: '>=0.20.0' },
        ],
      },
      setup: {
        title: '2. Wire into Tiptap',
        body: 'Disable StarterKit\'s code block (OoonBlock takes over the code role) and register OoonBlock and OoonInline. OoonRuntime owns the SMuFL font and audio-engine lifecycle in one place — create it once per editor instance.',
        font_note: 'Bravura.woff2 is exported as a subpath of @ooon/tiptap. With a bundler like Vite, grab it as a URL asset with ?url and hand it to OoonRuntime.',
      },
      fence: {
        title: '3. Markdown fence round-trip',
        body: 'When your markdown tokenizer sees a fence with language tag \'ooon\', use createOoonNodeFromSource to build a ProseMirror node. On the way back to markdown, ooonNodeToMarkdown wraps the node\'s text content with the fence again. Because the ooonBlock node stores the DSL as raw text (content: \'text*\'), the round-trip is lossless.',
        tokenizer_note: 'On the host side (e.g. markdown-it), one branch on `lang === OOON_FENCE_LANG` is enough. Preserve the body text exactly — that\'s the contract.',
      },
      types: {
        title: '4. Block types tour',
        body: 'Ooon DSL has five block types. Each one is a short header (meter/key) plus a body (note sequence, pattern, or progression). The tabs below pair the DSL with its rendered canvas.',
        categories: {
          score: 'Score',
          drum: 'Drums',
          progression: 'Progression',
          fretboard: 'Fretboard',
          song: 'Song',
        },
      },
      inline: {
        title: '5. Inline tokens',
        body: 'When you want to drop a single note, chord, or scale into prose without breaking flow, use a backtick code: `ooon:C4`, `ooon:Cmaj7`, or `ooon:C major scale`. OoonInline scans the text and adds a decoration; the host can open a tiny canvas popover on hover or click.',
      },
      try: {
        title: '6. Try it live',
        body: 'The editor below is a real Tiptap instance with OoonBlock and OoonInline registered. Edit the fence body and the canvas updates instantly. The markdown output underneath is exactly what the host stores — fully round-trippable.',
      },
      next: {
        title: '7. Where to go next',
        body: 'Pick what fits next — finished examples by genre, the exact syntax reference, or a blank canvas to try the editing UX yourself.',
        showcase: {
          title: 'Showcase',
          desc: 'Genre-by-genre finished examples — from 12-bar blues to bossa nova.',
        },
        syntax: {
          title: 'Syntax reference',
          desc: 'The precise definition of block headers, tokens, and parameters.',
        },
        playground: {
          title: 'Playground',
          desc: 'A blank canvas to try the editing UX yourself.',
        },
      },
    },
  },
  showcasePage: {
    title: 'Showcase',
    sub: 'Ooon expresses any genre — from 12-bar blues to bossa nova',
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
