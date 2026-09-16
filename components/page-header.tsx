import { ReactNode } from "react";
export function PageHeader({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1 className="display page-title">{title}</h1><div className="page-copy">{copy}</div></div>{action}</div>;
}
