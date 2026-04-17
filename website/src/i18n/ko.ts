import type { Dictionary } from './types';

export const ko: Dictionary = {
  nav: {
    home: '홈',
    examples: '예제',
    syntax: '문법',
    github: 'GitHub',
  },
  hero: {
    headline: '텍스트로 쓰는 음악, 그대로 보이는 악보',
    sub: 'Oon은 음악 표기를 간결한 DSL로 작성하고, 브라우저에서 Canvas로 즉시 렌더링하는 경량 라이브러리입니다. 악보·드럼·코드 진행·운지·곡 구조를 한 줄 텍스트로 표현합니다.',
    cta_start: '시작하기',
    cta_github: 'GitHub',
  },
  problem: {
    title: '왜 Oon인가',
    sub: '기존 음악 표기 도구와의 차이점',
    current_title: '기존 방식의 한계',
    current_items: [
      'MusicXML/MEI는 LLM이 안정적으로 생성하기 어렵다',
      'LilyPond/MuseScore는 별도 엔진 필요, 웹 통합이 무겁다',
      'ABC 표기법은 악보에 특화되어 드럼/운지/코드 진행에 약하다',
    ],
    oon_title: 'Oon의 접근',
    oon_items: [
      'LLM 친화적 평문 DSL — 한 줄로 읽고 쓴다',
      'Canvas 단일 렌더 — React/Tiptap/Svelte 어디든 붙는다',
      '악보·드럼·진행·운지·곡 구조를 모두 한 문법 계열로 다룬다',
    ],
  },
  features: {
    title: '핵심 기능',
    sub: '에디터와 문서에 바로 붙일 수 있는 블록',
    items: [
      { title: '악보 (score)', desc: '4/4, 6/8 박자와 음표/쉼표를 간결한 표기로 그린다.' },
      { title: '드럼 (drum)', desc: '킥/스네어/하이햇 패턴을 타임라인 격자로 렌더링한다.' },
      { title: '코드 진행 (progression)', desc: '로마 숫자와 조성을 기반으로 진행을 시각화한다.' },
      { title: '운지 (fretboard)', desc: '기타 지판 위 스케일·코드 포지션을 그린다.' },
      { title: '곡 (song)', desc: '섹션·리프레인·브릿지를 하나의 문서로 조립한다.' },
      { title: '인라인 토큰', desc: '`oon:C4` 같은 인라인 코드로 본문 속 음표·코드를 팝오버로 보여준다.' },
    ],
  },
  quickStart: {
    title: '빠른 시작',
    sub: '모노레포에서 필요한 패키지만 설치한다',
    install: '# 에디터 통합이 필요한 경우\npnpm add @oon/plugin-tiptap @oon/projector-web @oon/core',
    usage_label: 'Tiptap에 연결하기',
  },
  footerCta: {
    title: '지금 시작하기',
    cta_github: 'GitHub에서 보기',
    cta_npm: 'npm',
  },
  footer: {
    tagline: 'Oon — 텍스트 DSL로 음악을 쓰고, Canvas로 그린다.',
  },
  examplesPage: {
    title: '예제',
    sub: 'DSL 원본과 렌더링 결과를 나란히 본다',
    source_label: 'DSL',
    render_label: '렌더',
    categories: {
      score: '악보',
      drum: '드럼',
      progression: '코드 진행',
      fretboard: '운지',
      song: '곡',
      inline: '인라인',
    },
  },
  syntaxPage: {
    title: '문법 레퍼런스',
    sub: '블록 헤더, 토큰, 파라미터의 정의',
    sections: {
      overview: '개요',
      score: 'score',
      drum: 'drum',
      progression: 'progression',
      fretboard: 'fretboard',
      song: 'song',
      inline: '인라인 토큰',
    },
  },
};
