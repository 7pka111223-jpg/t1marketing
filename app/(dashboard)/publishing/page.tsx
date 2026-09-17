import { PageHeader } from "@/components/page-header";
import { PostingKit } from "@/components/posting-kit";
import { getReadyToPost } from "@/lib/data/marketing";

export default async function PublishingPage() {
  const posts = await getReadyToPost();
  return <>
    <PageHeader title="Publishing" copy="Approved posts land here to publish by hand. Copy the approved text, download the media, then paste the post URL back so per-post metrics can find it later."/>
    <PostingKit posts={posts}/>
  </>;
}
