export interface ShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  source: string;
}

export const showcase: ShowcaseItem[] = [
  {
    id: 'blues',
    title: 'Blues',
    subtitle: '12-bar blues in A',
    source: [
      'song 4/4 key:A bpm:100',
      '  beat: shuffle',
      '  A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7 |',
      '  A3/q C4/q D4/q E4/q | G4/q E4/q C4/q A3/q | A3/q E4/q G4/q A4/q | C5/q A4/q G4/q E4/q | D4/q F4/q A4/q C5/q | A4/q F4/q D4/q C4/q | E4/q G4/q A4/q C5/q | A4/q G4/q E4/q C4/q | B4/q G4/q E4/q B3/q | A4/q F4/q D4/q A3/q | A3/q C4/q E4/q A4/q | B4/h E4/h |',
    ].join('\n'),
  },
  {
    id: 'jazz',
    title: 'Jazz',
    subtitle: 'ii–V–I turnaround in C',
    source: [
      'song 4/4 key:C bpm:120',
      '  beat: ballad',
      '  Dm7 | G7 | Cmaj7 | Cmaj7 | Dm7 | G7 | Em7 | A7 | Dm7 | G7 | Cmaj7 | A7 | Dm7 | G7 | Cmaj7 | Cmaj7 |',
      '  D4/q F4/q A4/q C5/q | B4/q G4/q F4/q D4/q | E4/q G4/q C5/q B4/q | C5/h r/h | D4/q F4/q A4/q G4/q | F4/q D4/q B3/q G4/q | G4/q B4/q D5/q B4/q | A4/q C5/q E5/q C5/q | D4/e F4/e A4/e C5/e D5/e C5/e A4/e F4/e | B4/q G4/q F4/q D4/q | E4/q G4/q C5/q E5/q | C#5/q E5/q A4/q C#5/q | D4/q A4/q F4/q D4/q | D4/q F4/q G4/q B4/q | C5/w | C5/w |',
    ].join('\n'),
  },
  {
    id: 'pop',
    title: 'Pop',
    subtitle: 'I–V–vi–IV in C',
    source: [
      'song 4/4 key:C bpm:100',
      '  beat: 8beat-rock',
      '  C | G | Am | F | C | G | Am | F | C | G | Am | F | C | G | Am | F |',
      '  C4/q E4/q G4/q E4/q | D4/q G4/q B4/q G4/q | A4/q C5/q E5/q C5/q | F4/q A4/q C5/q A4/q | G4/q E4/q C4/q E4/q | B4/q G4/q D4/q G4/q | A4/q E4/q C5/q A4/q | F4/h A4/q C5/q | E5/h D5/q C5/q | B4/h D5/q G4/q | A4/q C5/q E5/q C5/q | F4/q A4/q C5/q A4/q | G4/q E4/q C5/q G4/q | B4/q D5/q G4/q D4/q | A4/q C5/q E5/q A4/q | F4/w |',
    ].join('\n'),
  },
  {
    id: 'rock',
    title: 'Rock',
    subtitle: 'i–VII–VI–V in A minor',
    source: [
      'song 4/4 key:Am bpm:128',
      '  beat: 8beat-rock',
      '  Am | G | F | E | Am | G | F | E | Am | G | F | E | Am | G | F | E |',
      '  A3/q E4/q A4/q C5/q | G4/q D4/q B3/q G4/q | F4/q A4/q C5/q F4/q | E4/q G#4/q B4/q E4/q | A4/q C5/q E5/q C5/q | G4/q B4/q D5/q B4/q | F4/q A4/q C5/q A4/q | E4/q G#4/q B4/q E5/q | A4/e G4/e E4/e D4/e C4/e A3/e E4/e A4/e | G4/e F4/e D4/e B3/e G3/e D4/e G4/e B4/e | F4/q C5/q A4/q F4/q | E4/q B4/q G#4/q E4/q | A4/h C5/h | G4/h B4/h | F4/h A4/h | E4/w |',
    ].join('\n'),
  },
  {
    id: 'bossa',
    title: 'Bossa Nova',
    subtitle: 'Diatonic cycle in F',
    source: [
      'song 4/4 key:F bpm:88',
      '  beat: bossa-nova',
      '  Fmaj7 | Dm7 | Gm7 | C7 | Fmaj7 | Dm7 | Gm7 | C7 | Am7 | Dm7 | Gm7 | C7 | Fmaj7 | Dm7 | Gm7 | C7 |',
      '  F4/q A4/q C5/q A4/q | F4/q D4/q A4/q F4/q | G4/q Bb4/q D5/q F5/q | E5/q G5/q C5/q E5/q | F4/h A4/q C5/q | F4/q D4/q A4/q F4/q | G4/q Bb4/q D5/q Bb4/q | E5/q C5/q G4/q E4/q | A4/q C5/q E5/q C5/q | F4/q A4/q D5/q A4/q | G4/q Bb4/q D5/q Bb4/q | E4/q G4/q Bb4/q E5/q | F4/q A4/q C5/q F5/q | A4/q D5/q F5/q A5/q | G4/q Bb4/q D5/q F5/q | E4/q G4/q C5/q E5/q |',
    ].join('\n'),
  },
];
