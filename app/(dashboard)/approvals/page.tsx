import { PageHeader } from "@/components/page-header";
import { ApprovalWorkspace } from "@/components/approval-workspace";
import { getApprovalQueue } from "@/lib/data/marketing";
export default async function ApprovalsPage(){ const items = await getApprovalQueue(); return <><PageHeader title="Approvals" copy="Approve, edit, reject or reloop a single component. Approved parts remain locked so you never lose good work."/><ApprovalWorkspace initial={items}/></> }
