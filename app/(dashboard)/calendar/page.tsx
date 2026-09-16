import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCalendarItems } from "@/lib/data/marketing";

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const params = await searchParams;
  const weekOffset = Number(params.week ?? 0) || 0;
  const calendarItems = await getCalendarItems(weekOffset);
  const now = new Date();
  const weekday = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday + weekOffset * 7);
  const weekLabel = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(monday);
  return <>
    <PageHeader title="Calendar" copy="The weekly publishing plan. Final approval remains required before any public post leaves the queue." action={<div className="actions"><Link href={`/calendar?week=${weekOffset - 1}`} className="btn btn-secondary" aria-label="Previous week"><ChevronLeft size={14}/></Link><span className="badge">Week of {weekLabel}</span><Link href={`/calendar?week=${weekOffset + 1}`} className="btn btn-secondary" aria-label="Next week"><ChevronRight size={14}/></Link></div>}/>
    <div className="calendar">{days.map((d, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return <div className="day" key={d}><div className="day-head"><strong>{d}</strong><span>{date.getDate()}</span></div>{(calendarItems[i + 1] ?? []).map((x) => <div className="calendar-item" key={x.id}><strong>{x.title}</strong><span>{x.type} · {x.time}</span></div>)}</div>; })}</div>
    <div className="note section"><strong>Stories:</strong> V1 uses daily story packages with batch approval rather than cluttering the main feed calendar with every frame.</div>
  </>;
}
