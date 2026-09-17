"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, CalendarDays, CheckSquare2, FlaskConical, Images, LayoutDashboard, Send, Settings, Target, Users, FileText } from "lucide-react";

const nav = [
  ["/", "Command", LayoutDashboard],
  ["/research", "Research", FlaskConical],
  ["/campaigns", "Campaigns", Target],
  ["/content", "Content", FileText],
  ["/creative", "Creative", Images],
  ["/approvals", "Approvals", CheckSquare2],
  ["/publishing", "Publishing", Send],
  ["/calendar", "Calendar", CalendarDays],
  ["/audience", "Audience", Users],
  ["/analytics", "Analytics", BarChart3],
] as const;

export function Sidebar({ demo }: { demo: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">111</div>
        <div>
          <div className="display brand-title">TripleOne</div>
          <div className="brand-sub">Marketing OS</div>
        </div>
      </div>
      <nav className="nav">
        {nav.map(([href, label, Icon]) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href}><Icon size={18} strokeWidth={2} />{label}</Link>;
        })}
      </nav>
      <div className="nav-foot">
        <Link className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`} href="/settings"><Settings size={18} />Settings</Link>
        <div className="nav-link" style={{ cursor: "default" }}><Activity size={18}/><span><span className="status-dot" style={demo ? { background: "var(--warning)" } : undefined}/> &nbsp; {demo ? "Demo mode" : "Systems online"}</span></div>
      </div>
    </aside>
  );
}
