import { PageHeader } from "@/components/page-header";
import { PostingKit } from "@/components/posting-kit";
import { getAssetLibrary, getReadyToPost } from "@/lib/data/marketing";

export default async function PublishingPage() {
  const [posts, assets] = await Promise.all([getReadyToPost(), getAssetLibrary()]);
  return <>
    <PageHeader title="Publishing" copy="Approved posts land here to publish by hand. Attach the footage, copy the approved text, download the media, then paste the post URL back so per-post metrics can find it later."/>
    <PostingKit posts={posts} assets={assets}/>
  </>;
}
