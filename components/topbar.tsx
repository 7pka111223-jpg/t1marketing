export function Topbar() {
  const date = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Cairo" }).format(new Date());
  return <header className="topbar"><div className="topbar-left"><span className="eyebrow">TripleOneBars</span><span className="date">New Cairo · {date}</span></div><div className="avatar">T1</div></header>;
}
