import { parseBlock, serializeScore } from '@oon/core';
import type { ScoreNode } from '@oon/core';
import { applyScoreCommand, type ScoreCommand } from './commands.js';

export interface ScoreChangeEvent {
  node: ScoreNode;
  dsl: string;
  command: ScoreCommand;
}

export type ScoreChangeListener = (event: ScoreChangeEvent) => void;

export interface EditableScoreOptions {
  /** 초기 노드. node와 source 둘 중 하나는 필수. */
  node?: ScoreNode;
  /** 초기 DSL. 파싱 실패 시 throw. */
  source?: string;
}

// 내부적으로 ScoreNode를 보유하고, dispatch마다 새 노드로 교체 후 listener에 통지한다.
// React/Vue/Svelte 등 UI 프레임워크 의존성 없음 — observer 패턴만 사용한다.
export class EditableScore {
  private node: ScoreNode;
  private listeners = new Set<ScoreChangeListener>();

  constructor(opts: EditableScoreOptions) {
    if (opts.node) {
      this.node = opts.node;
    } else if (opts.source !== undefined) {
      const parsed = parseBlock(opts.source);
      if (parsed.type !== 'score') {
        throw new Error(`EditableScore: expected score block, got ${parsed.type}`);
      }
      this.node = parsed;
    } else {
      throw new Error('EditableScore: opts.node or opts.source must be provided');
    }
  }

  getNode(): ScoreNode {
    return this.node;
  }

  getDsl(): string {
    return serializeScore(this.node);
  }

  dispatch(command: ScoreCommand): void {
    const next = applyScoreCommand(this.node, command);
    this.node = next;
    const dsl = serializeScore(next);
    for (const listener of this.listeners) listener({ node: next, dsl, command });
  }

  subscribe(listener: ScoreChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
