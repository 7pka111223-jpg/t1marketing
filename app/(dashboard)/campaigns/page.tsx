import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { NewCampaignButton } from "@/components/new-campaign-dialog";
import { CampaignActions } from "@/components/campaign-actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getCampaigns } from "@/lib/data/marketing";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  const live = campaigns.filter((campaign) => campaign.status === "ACTIVE").length;
  const drafts = campaigns.filter((campaign) => campaign.status === "DRAFT").length;
  const linked = campaigns.reduce((total, campaign) => total + campaign.contentCount, 0);
  const membershipLed = campaigns.filter((campaign) => /membership/i.test(campaign.objective)).length;

  return <>
    <PageHeader title="Campaigns" copy="Group content under one objective so awareness and membership outcomes can be attributed back to the work that earned them." action={<NewCampaignButton/>}/>
    <div className="grid grid-4" style={{ marginBottom: 24 }}>
      {[[String(live), "Live"], [String(drafts), "Drafts"], [String(linked), "Linked content"], [String(membershipLed), "Membership-led"]].map(([value, label]) => <div className="stat-card" key={label}><div className="stat-label">{label}</div><div className="display stat-value">{value}</div></div>)}
    </div>
    {campaigns.length === 0
      ? <EmptyState title="No campaigns yet" copy="Create a campaign to group content under a single objective, then link content items to it from the Content board."/>
      : <div className="table-wrap"><table>
          <thead><tr><th>Campaign</th><th>Objective</th><th>Status</th><th>Window</th><th>Content</th><th/></tr></thead>
          <tbody>
            {campaigns.map((campaign) => <tr key={campaign.id}>
              <td className="item-title"><Link href={`/campaigns/${campaign.id}`}>{campaign.name}</Link></td>
              <td>{campaign.objective}</td>
              <td><StatusBadge value={campaign.status}/></td>
              <td className="item-meta">{campaign.window}</td>
              <td className="mono">{campaign.contentCount}</td>
              <td><CampaignActions id={campaign.id} status={campaign.status}/></td>
            </tr>)}
          </tbody>
        </table></div>}
  </>;
}
