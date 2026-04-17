export interface ExampleItem {
  id: string;
  title: string;
  source: string;
}

export interface ExampleCategory {
  id: string;
  items: ExampleItem[];
}

export const examples: ExampleCategory[] = [
  {
    id: 'score',
    items: [
      {
        id: 'cmajor-scale',
        title: 'C major scale',
        source: 'score 4/4\n  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |',
      },
      {
        id: 'arpeggio',
        title: 'C major arpeggio with rest',
        source: 'score 4/4\n  C4/q E4/q G4/q r/q | C5/h G4/q E4/q |',
      },
      {
        id: 'dotted',
        title: 'Dotted rhythm',
        source: 'score 4/4\n  A4/q. A4/e A4/h | A4/w |',
      },
    ],
  },
  {
    id: 'drum',
    items: [
      {
        id: 'rock',
        title: 'Basic rock pattern',
        source:
          'drum 4/4\n  HH | x-x-x-x-x-x-x-x- |\n  SD | ----x-------x--- |\n  BD | x-------x------- |',
      },
    ],
  },
  {
    id: 'progression',
    items: [
      {
        id: 'cpop',
        title: 'I – V – vi – IV in C',
        source: 'progression 4/4 in:C\n  I | V | vi | IV |',
      },
      {
        id: 'jazz',
        title: 'ii – V – I in C',
        source: 'progression 4/4 in:C\n  ii | V | I | I |',
      },
    ],
  },
  {
    id: 'fretboard',
    items: [
      {
        id: 'am-pent',
        title: 'A minor pentatonic (position 5)',
        source: 'fretboard A minor-pentatonic position:5 frets:3-9',
      },
      {
        id: 'cmaj',
        title: 'C major (open position)',
        source: 'fretboard C major frets:0-5',
      },
    ],
  },
  {
    id: 'song',
    items: [
      {
        id: 'short',
        title: '4-bar song sketch in C',
        source:
          'song 4/4 key:C\n  C | G | Am | F |\n  C4/w | D4/w | E4/w | F4/w |',
      },
    ],
  },
];
