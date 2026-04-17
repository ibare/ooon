import type { ReactNode } from 'react';

export default function Card({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="card">
      <div className="card__title">{title}</div>
      <div className="card__desc">{children}</div>
    </div>
  );
}
