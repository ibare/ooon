// Song에서 동시에 흐르는 트랙들의 mute 상태.
// 재생기(소리 차단)와 시각화(흐리게 그리기) 양쪽에서 동일 모양으로 사용된다.
export type TrackKey = 'chord' | 'melody' | 'drum';
export type TrackMute = Partial<Record<TrackKey, boolean>>;
