"use client";

import { useState } from "react";
import { Film, Images, Sparkles } from "lucide-react";

const formats = [[Film, "Reel", "9:16 video"], [Images, "Carousel", "4:5 slides"], [Sparkles, "Story", "9:16 frames"], [Images, "Static", "4:5 / 1:1"]] as const;

export function FormatCards() {
  const [selected, setSelected] = useState("Reel");
  return <div className="grid grid-4">{formats.map(([Icon, title, sub]) => <button key={title} className={`card ${selected === title ? "card-selected" : ""}`} style={{ textAlign: "left" }} onClick={() => setSelected(title)} aria-pressed={selected === title}><Icon size={28} color="#e10600"/><h3 className="display" style={{ fontSize: 34, margin: "18px 0 6px" }}>{title}</h3><div className="item-meta">{sub}</div></button>)}</div>;
}
