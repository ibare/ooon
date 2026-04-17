export interface SyntaxExample {
  label: string;
  code: string;
}

export interface SyntaxSection {
  id: string;
  body: string;
  examples: SyntaxExample[];
}

export const syntax: SyntaxSection[] = [
  {
    id: 'overview',
    body:
      'Oon 문서는 블록 단위로 구성된다. 각 블록은 첫 줄(헤더)에 블록 타입과 파라미터를 쓰고, 그 다음 줄부터 실제 내용을 적는다. 헤더 파라미터는 공백 구분 `key:value` 형태이며, `score`·`drum`·`progression`·`song`은 박자 표시(`4/4`, `6/8` 등)를 헤더에 포함한다.',
    examples: [
      { label: '블록 골격', code: '<type> <timesig?> <key:value>...\n  <content line>\n  <content line>' },
    ],
  },
  {
    id: 'score',
    body:
      '`score`는 악보를 그린다. 박자 표시는 필수이고, `key`와 `bpm`을 파라미터로 쓸 수 있다. 내용 줄은 마디(`|`)로 구분하고, 각 음표는 `<pitch>/<duration>` 형태다. 쉼표는 `r/<duration>`. duration 기호는 `w`(온음표), `h`(2분), `q`(4분), `e`(8분), `s`(16분), 그리고 점(`.`).',
    examples: [
      { label: '2마디 악보', code: 'score 4/4 key:Am bpm:100\n  A3/q C4/q D4/q E4/q | G4/q A4/q G4/q E4/q |' },
      { label: '쉼표', code: 'score 4/4\n  r/q A4/q r/h |' },
    ],
  },
  {
    id: 'drum',
    body:
      '`drum`은 드럼 패턴을 격자로 표현한다. 각 내용 줄은 `<voice> | <pattern> |` 형태이며, 패턴의 각 문자가 한 스텝이다. `x`는 타격, `-`는 쉼. voice 키는 `HH`(하이햇), `SN`(스네어), `KK`(킥), `TM`(톰), `CR`(크래시), `RD`(라이드).',
    examples: [
      {
        label: '기본 락 비트',
        code: 'drum 4/4\n  HH | x-x-x-x-x-x-x-x- |\n  SN | ----x-------x--- |\n  KK | x-------x------- |',
      },
    ],
  },
  {
    id: 'progression',
    body:
      '`progression`은 로마 숫자 화성 진행을 그린다. 조성(`in:`)은 필수. 대문자 로마 숫자는 장화음, 소문자는 단화음, `°`는 감화음. 마디는 `|`로 구분한다. 한 마디 안에 여러 코드는 `,`로 나란히 둔다.',
    examples: [
      { label: '팝 진행', code: 'progression 4/4 in:C\n  I | V | vi | IV |' },
      { label: '분할 코드', code: 'progression 4/4 in:C\n  I,V | vi | IV | V |' },
    ],
  },
  {
    id: 'fretboard',
    body:
      '`fretboard`는 기타 지판 위 스케일·코드 포지션을 그린다. 헤더는 `fretboard <root> <scaleType>` 형태이며, `position:` · `frets:a-b` 같은 파라미터로 표시 범위를 제한한다. `scaleType`은 `major`, `minor`, `minor-pentatonic` 등을 지원한다.',
    examples: [
      { label: 'A 펜타토닉', code: 'fretboard A minor-pentatonic position:5 frets:3-9' },
      { label: 'C 메이저', code: 'fretboard C major frets:0-5' },
    ],
  },
  {
    id: 'song',
    body:
      '`song`은 코드 진행과 멜로디를 한 마디씩 대응시켜 조립한다. 헤더는 박자·키·BPM·`beat:<preset>`을 받고, 내용은 두 줄로 나뉜다. 첫 번째 줄은 마디별 코드 심볼, 두 번째 줄은 같은 마디 수의 멜로디. 드럼 프리셋을 붙이면 드럼 트랙도 함께 렌더된다.',
    examples: [
      {
        label: '기본 4마디',
        code: 'song 4/4 key:C\n  C | G | Am | F |\n  C4/w | D4/w | E4/w | F4/w |',
      },
      {
        label: '드럼 프리셋 포함',
        code: 'song bpm:100 key:Am 4/4\n  beat: 8beat-rock\n  Am | F | C | G |\n  A3/q C4/q D4/q E4/q | G4/q A4/q G4/q E4/q | D4/q C4/q A3/q C4/q | D4/h E4/h |',
      },
    ],
  },
  {
    id: 'inline',
    body:
      '문서 본문 속 `` `chord:Cmaj7` ``, `` `scale:A minor` ``, `` `note:C4` ``와 같은 인라인 코드 토큰은 Tiptap 통합에서 호버 팝오버로 확장된다. 플러그인이 백틱 안 `oon:` prefix를 감지해 해당 토큰을 렌더한다.',
    examples: [
      { label: '노트', code: 'See `note:C4` as middle C.' },
      { label: '코드', code: 'The chord `chord:Cmaj7` has a major 7th.' },
      { label: '스케일', code: '`scale:A minor` is the relative minor of C major.' },
    ],
  },
];
