export interface BeatPattern {
  resolution: number;
  tracks: Record<string, string>;
}

export const BEAT_CATALOG: Record<string, BeatPattern> = {
  '8beat-rock': {
    resolution: 16,
    tracks: {
      HH: 'x-x-x-x-x-x-x-x-',
      SN: '----x-------x---',
      KK: 'x-------x-x-----',
    },
  },
  '4-on-floor': {
    resolution: 16,
    tracks: {
      HH: 'x-x-x-x-x-x-x-x-',
      SN: '----x-------x---',
      KK: 'x---x---x---x---',
    },
  },
  ballad: {
    resolution: 16,
    tracks: {
      HH: '--x---x---x---x-',
      SN: '----x-------x---',
      KK: 'x---------x-----',
    },
  },
  '16beat': {
    resolution: 16,
    tracks: {
      HH: 'xxxxxxxxxxxxxxxx',
      SN: '----x-------x---',
      KK: 'x--x------x--x--',
    },
  },
  shuffle: {
    resolution: 12,
    tracks: {
      HH: 'x-xx-xx-xx-x',
      SN: '---x-----x--',
      KK: 'x-----x-----',
    },
  },
  'bossa-nova': {
    resolution: 16,
    tracks: {
      HH: 'x-x-x-x-x-x-x-x-',
      SN: '---x---x---x---x',
      KK: 'x-----x---x-----',
    },
  },
};
