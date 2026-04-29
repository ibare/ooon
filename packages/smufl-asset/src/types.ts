/**
 * Staff space 단위. 1 sp = 보표 한 칸. 1 em = 4 sp (SMuFL 규약).
 *
 * brand로 분리해 px 단위와 섞이지 않도록 한다.
 */
export type Sp = number & { readonly __brand: 'Sp' };

/**
 * 좌표(staff space). y축은 위가 양수(SMuFL 규약). 캔버스 좌표(아래가 양수)로
 * 변환할 때는 layout 단계에서 y를 뒤집어야 한다.
 */
export interface SpPoint {
  readonly x: Sp;
  readonly y: Sp;
}

/**
 * 글리프의 bounding box. SMuFL은 NE(우상)와 SW(좌하) 두 점으로 표현한다.
 */
export interface GlyphBBox {
  readonly bBoxNE: SpPoint;
  readonly bBoxSW: SpPoint;
}

/**
 * 글리프의 부착점. SMuFL이 정의한 키만 그대로 옮긴다. 글리프마다 보유 앵커가 다르다.
 *
 * 자주 쓰이는 키:
 * - `stemUpSE`, `stemDownNW`: notehead의 stem 부착점
 * - `stemUpNW`, `stemDownSW`: flag의 stem 부착점(반대 방향)
 * - `splitStemUpSE`, `splitStemUpSW`, `splitStemDownNE`, `splitStemDownNW`: 화음 분리 stem
 * - `cutOutNW`, `cutOutSE`: 광학적 자름(임시표 패킹용)
 */
export type AnchorKey =
  | 'stemUpSE'
  | 'stemDownNW'
  | 'stemUpNW'
  | 'stemDownSW'
  | 'splitStemUpSE'
  | 'splitStemUpSW'
  | 'splitStemDownNE'
  | 'splitStemDownNW'
  | 'cutOutNE'
  | 'cutOutNW'
  | 'cutOutSE'
  | 'cutOutSW'
  | 'graceNoteSlashNE'
  | 'graceNoteSlashSW';

export type GlyphAnchors = Partial<Record<AnchorKey, SpPoint>>;

/**
 * 글리프 한 항목의 전체 정보.
 */
export interface GlyphInfo {
  /** 유니코드 코드포인트(SMuFL PUA 영역) */
  readonly codepoint: number;
  /** 폰트 advance width (sp) */
  readonly advanceWidth: Sp;
  /** bounding box (sp) */
  readonly bbox: GlyphBBox;
  /** 부착점들 (sp) */
  readonly anchors: GlyphAnchors;
}

/**
 * SMuFL `engravingDefaults`. 모든 두께/간격은 sp 단위.
 *
 * 명세상 키 전체 중 본 엔진에서 즉시 의미가 있는 것만 좁힌 부분집합으로 노출한다.
 * 미사용 키도 추출은 하되, 본 인터페이스에는 두지 않아 사용처가 명시되도록 한다.
 */
export interface EngravingDefaults {
  readonly staffLineThickness: Sp;
  readonly stemThickness: Sp;
  readonly beamThickness: Sp;
  readonly beamSpacing: Sp;
  readonly legerLineThickness: Sp;
  readonly legerLineExtension: Sp;
  readonly thinBarlineThickness: Sp;
  readonly thickBarlineThickness: Sp;
  readonly barlineSeparation: Sp;
  readonly slurEndpointThickness: Sp;
  readonly slurMidpointThickness: Sp;
  readonly tieEndpointThickness: Sp;
  readonly tieMidpointThickness: Sp;
}
