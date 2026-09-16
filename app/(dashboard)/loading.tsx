export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <div className="grid grid-4 section">
        {[0, 1, 2, 3].map((key) => (
          <div className="skeleton skeleton-card" key={key} />
        ))}
      </div>
    </div>
  );
}
