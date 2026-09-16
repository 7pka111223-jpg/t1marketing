export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="card empty">
      <div className="display empty-title">{title}</div>
      <p className="empty-copy">{copy}</p>
    </div>
  );
}
