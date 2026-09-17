"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CheckSquare2, FileText, FlaskConical, Images, LayoutDashboard, Settings, Target, Users } from "lucide-react";

const items = [
  ["/", "Home", LayoutDashboard],
  ["/research", "Research", FlaskConical],
  ["/campaigns", "Campaigns", Target],
  ["/content", "Content", FileText],
  ["/creative", "Creative", Images],
  ["/approvals", "Approve", CheckSquare2],
  ["/calendar", "Calendar", CalendarDays],
  ["/audience", "Audience", Users],
  ["/analytics", "Analytics", BarChart3],
  ["/settings", "Settings", Settings],
] as const;

export function MobileNav(){ const p=usePathname(); return <nav className="mobile-bar">{items.map(([h,l,I])=><Link className={`mobile-link ${(h==="/"?p==="/":p.startsWith(h))?"active":""}`} href={h} key={h}><I size={18}/><span>{l}</span></Link>)}</nav> }
