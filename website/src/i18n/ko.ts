import type { Dictionary } from './types';

export const ko: Dictionary = {
  nav: {
    home: '홈',
    getStarted: '시작하기',
    showcase: '쇼케이스',
    syntax: '문법',
    playground: '플레이그라운드',
    github: 'GitHub',
  },
  hero: {
    headline: '텍스트로 쓰는 음악, 그대로 보이는 악보',
    sub: 'Ooon은 음악 표기를 간결한 DSL로 작성하고, 브라우저에서 Canvas로 즉시 렌더링하는 경량 라이브러리입니다. 악보·드럼·코드 진행·운지·곡 구조를 한 줄 텍스트로 표현합니다.',
    cta_start: '시작하기',
    cta_github: 'GitHub',
  },
  problem: {
    title: '왜 Ooon인가',
    sub: '기존 음악 표기 도구와의 차이점',
    current_title: '기존 방식의 한계',
    current_items: [
      'MusicXML/MEI는 LLM이 안정적으로 생성하기 어렵다',
      'LilyPond/MuseScore는 별도 엔진 필요, 웹 통합이 무겁다',
      'ABC 표기법은 악보에 특화되어 드럼/운지/코드 진행에 약하다',
    ],
    oon_title: 'Ooon의 접근',
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
      { title: '인라인 토큰', desc: '`ooon:C4` 같은 인라인 코드로 본문 속 음표·코드를 팝오버로 보여준다.' },
    ],
  },
  quickStart: {
    title: '빠른 시작',
    sub: '모노레포에서 필요한 패키지만 설치한다',
    install: '# 에디터 통합이 필요한 경우\npnpm add @ooon/tiptap',
    usage_label: 'Tiptap에 연결하기',
  },
  footerCta: {
    title: '지금 시작하기',
    cta_github: 'GitHub에서 보기',
    cta_npm: 'npm',
  },
  footer: {
    tagline: 'Ooon — 텍스트 DSL로 음악을 쓰고, Canvas로 그린다.',
  },
  getStartedPage: {
    title: '시작하기',
    sub: 'Ooon을 마크다운 에디터에 임베드하고, DSL 한 줄로 음악을 그리는 법을 처음부터 따라간다.',
    install_label: '설치',
    source_label: 'DSL',
    render_label: '렌더',
    sections: {
      intro: {
        title: 'Ooon은 어떻게 동작하나',
        body: 'Ooon은 두 가지 방식으로 호스트 앱에 붙일 수 있다. 첫째, Tiptap 같은 마크다운 에디터의 코드 펜스 ```ooon ... ```를 NodeView로 가로채 캔버스로 렌더하는 방식. 둘째, DSL 텍스트를 페이지에 직접 마운트하는 단일 컴포넌트 방식. 이 페이지는 첫 번째 방식(`@ooon/tiptap` 진입 번들)을 처음부터 끝까지 따라가는 가이드다. 마지막에 라이브 에디터로 직접 펜스 본문을 편집해 결과를 확인할 수 있다.',
      },
      install: {
        title: '1. 설치',
        body: 'methii 같은 마크다운 에디터 호스트에 Ooon을 임베드하려면 진입 번들 패키지 하나만 의존하면 된다. 내부 워크스페이스(@ooon/core, @ooon/projector-web 등)는 모두 단일 ESM 번들로 인라인되어 있어 호스트가 따로 신경 쓸 필요가 없다.',
        peer_label: 'peer dependencies — 호스트가 직접 제공해야 한다',
        peers: [
          { name: '@tiptap/core', range: '>=2.6.0' },
          { name: '@tiptap/pm', range: '>=2.6.0' },
          { name: 'smplr', range: '>=0.20.0' },
        ],
      },
      setup: {
        title: '2. Tiptap에 연결한다',
        body: 'StarterKit의 codeBlock을 끄고 OoonBlock과 OoonInline 확장을 등록한다. OoonRuntime은 폰트(SMuFL Bravura)와 오디오 엔진의 생명주기를 한 곳에서 관리하는 객체로, Tiptap 에디터 인스턴스마다 한 번만 만들면 된다.',
        font_note: 'Bravura.woff2는 @ooon/tiptap 패키지의 ./font 서브패스로 직접 노출된다. Vite 같은 번들러는 ?url 쿼리로 URL 자산으로 받아 OoonRuntime에 주입한다.',
      },
      fence: {
        title: '3. 마크다운 펜스 round-trip',
        body: '호스트의 마크다운 토크나이저에서 언어 태그가 \'ooon\'인 펜스를 만나면 createOoonNodeFromSource로 ProseMirror 노드를 만들고, 직렬화 단계에서 ooonBlock 노드를 ooonNodeToMarkdown으로 다시 펜스로 되돌린다. oonBlock 노드는 본문이 DSL 원문 텍스트(content: \'text*\') 그대로이므로 round-trip은 무손실이다.',
        tokenizer_note: '호스트 마크다운 파서(예: markdown-it) 측에서는 `lang === OOON_FENCE_LANG` 한 분기만 추가하면 된다. 본문 텍스트를 그대로 보존하는 게 핵심이다.',
      },
      types: {
        title: '4. 블록 타입 둘러보기',
        body: 'Ooon DSL은 다섯 가지 블록 타입을 지원한다. 각 타입은 짧은 헤더(박자/조성)와 본문(노트 시퀀스/패턴/진행)으로 구성된다. 아래 탭에서 DSL과 렌더링 결과를 나란히 확인할 수 있다.',
        categories: {
          score: '악보 (score)',
          drum: '드럼 (drum)',
          progression: '코드 진행 (progression)',
          fretboard: '운지 (fretboard)',
          song: '곡 (song)',
        },
      },
      inline: {
        title: '5. 인라인 토큰',
        body: '본문 흐름을 끊지 않고 한 음표/코드/스케일만 끼우고 싶을 때는 백틱 인라인 코드 형태로 `ooon:C4`, `ooon:Cmaj7`, `ooon:C major scale` 같이 작성한다. OoonInline 확장이 본문을 스캔해 데코레이션을 그리고, 호스트가 호버/클릭 시 작은 캔버스 팝오버를 보여줄 수 있다.',
      },
      try: {
        title: '6. 직접 해보기',
        body: '아래 에디터는 Tiptap에 OoonBlock/OoonInline을 등록한 실제 동작이다. 펜스 본문을 편집하면 캔버스가 즉시 갱신되고, 아래 마크다운 출력은 호스트가 그대로 저장하면 되는 round-trip 결과다.',
      },
      next: {
        title: '7. 다음 단계',
        body: '다음으로 어디를 볼지 — 장르별 진짜 예제, DSL 문법 레퍼런스, 빈 캔버스에서 편집 UX를 시도하는 플레이그라운드.',
        showcase: {
          title: '쇼케이스',
          desc: '블루스부터 보사노바까지, 장르별 완성된 진행을 한 곡씩.',
        },
        syntax: {
          title: '문법 레퍼런스',
          desc: '블록 헤더, 토큰, 파라미터의 정확한 정의.',
        },
        playground: {
          title: '플레이그라운드',
          desc: '빈 한 마디 악보 위에서 편집 UX를 직접 시도한다.',
        },
      },
    },
  },
  showcasePage: {
    title: '쇼케이스',
    sub: '12마디 블루스부터 보사노바까지 — 모든 장르를 Ooon으로 표현한다',
    source_label: 'DSL',
    render_label: '렌더',
    genres: {
      blues: '블루스',
      jazz: '재즈',
      pop: '팝',
      rock: '록',
      bossa: '보사노바',
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
  playgroundPage: {
    title: '플레이그라운드',
    sub: '빈 한 마디 악보 위에서 편집 UX를 깎는다.',
  },
};
