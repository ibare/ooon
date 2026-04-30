# @oon/editor-core

프레임워크 비종속(framework-agnostic) Score 편집 모델. 내부에 `ScoreNode`를 보유하고 `ScoreCommand` apply로 변경한 뒤 observer에 `(node, dsl)`을 발행한다.

웹 UI 통합(canvas 인터랙션)은 `@oon/editor-web`에서 제공한다.
