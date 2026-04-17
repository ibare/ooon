import { useState, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export default function TabGroup({
  items,
  initialId,
}: {
  items: TabItem[];
  initialId?: string;
}) {
  const firstId = items[0]?.id ?? '';
  const [active, setActive] = useState<string>(initialId ?? firstId);
  const current = items.find((it) => it.id === active) ?? items[0];

  return (
    <div>
      <div className="tabs" role="tablist">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={it.id === active}
            className={`tabs__tab${it.id === active ? ' tabs__tab--active' : ''}`}
            onClick={() => setActive(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: '1.25em' }}>{current?.content}</div>
    </div>
  );
}
