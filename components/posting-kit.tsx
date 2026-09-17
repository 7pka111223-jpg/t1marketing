"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import type { AssetItem, AssetLink, PostFile, ReadyPost } from "@/lib/types";

export function PostingKit({ posts, assets }: { posts: ReadyPost[]; assets: AssetItem[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [files, setFiles] = useState<Record<string, PostFile[]>>({});
  const [attached, setAttached] = useState<Record<string, AssetLink[]>>(() =>
    Object.fromEntries(posts.map((post) => [post.id, post.assets])),
  );
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const linked = (post: ReadyPost) => attached[post.id] ?? [];

  async function copy(label: string, value: string) {
    if (!value) {
      push(`This post has no ${label.toLowerCase()} yet.`, "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      push(`${label} copied.`, "success");
    } catch {
      push("Could not access the clipboard.", "error");
    }
  }

  async function attach(post: ReadyPost) {
    const assetId = selected[post.id];
    if (!assetId) return;
    setBusy(`attach:${post.id}`);
    try {
      const response = await fetch(`/api/content/${post.contentItemId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not attach the media.", "error");
        return;
      }
      const asset = assets.find((item) => item.id === assetId);
      setAttached((current) => ({ ...current, [post.id]: [...(current[post.id] ?? []), { id: assetId, name: asset?.name ?? "Asset" }] }));
      setSelected((current) => ({ ...current, [post.id]: "" }));
      push("Media attached.", "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function unlink(post: ReadyPost, assetId: string) {
    setBusy(`unlink:${post.id}`);
    try {
      const response = await fetch(`/api/content/${post.contentItemId}/assets?assetId=${encodeURIComponent(assetId)}`, { method: "DELETE" });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not unlink the media.", "error");
        return;
      }
      setAttached((current) => ({ ...current, [post.id]: (current[post.id] ?? []).filter((item) => item.id !== assetId) }));
      push("Media unlinked.", "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function loadFiles(post: ReadyPost) {
    setBusy(`files:${post.id}`);
    try {
      const response = await fetch(`/api/publications/${post.id}/asset`);
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not load media.", "error");
        return;
      }
      const list: PostFile[] = detail?.files ?? [];
      setFiles((current) => ({ ...current, [post.id]: list }));
      if (list.length === 0) push("No downloadable file was found for the attached media.", "error");
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function markPosted(post: ReadyPost, form: HTMLFormElement) {
    const postUrl = String(new FormData(form).get("postUrl") ?? "");
    setBusy(`post:${post.id}`);
    try {
      const response = await fetch(`/api/publications/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "MARK_POSTED", postUrl }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not mark the post.", "error");
        return;
      }
      push(detail?.externalPostId ? `Marked as posted (id ${detail.externalPostId}).` : "Marked as posted.", "success");
      form.reset();
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  if (posts.length === 0) {
    return <div className="card empty">Nothing approved yet. Approve a scheduled post and it lands here, ready to publish by hand.</div>;
  }

  return <>
    {posts.map((post) => <section className="card" key={post.id} style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div>
          <div className="eyebrow">{post.platform} · {post.scheduled}</div>
          <h2 className="display card-title" style={{ marginTop: 6 }}>{post.title}</h2>
        </div>
        <button className="btn btn-secondary" onClick={() => loadFiles(post)} disabled={busy !== null || linked(post).length === 0}>{busy === `files:${post.id}` ? "Loading" : "Get media"}</button>
      </div>

      {([["Hook", post.hook], ["Script", post.script], ["Caption", post.caption], ["CTA", post.cta]] as const).map(([label, value]) => (
        <div className="review-block" key={label} style={{ padding: "12px 0" }}>
          <div className="review-label">{label}</div>
          <div className="review-value" style={{ whiteSpace: label === "Script" ? "pre-line" : undefined }}>{value || "—"}</div>
          <div style={{ marginTop: 8 }}><button className="btn btn-ghost" onClick={() => copy(label, value)}>Copy {label}</button></div>
        </div>
      ))}

      <div className="review-block" style={{ padding: "12px 0" }}>
        <div className="review-label">Attached media</div>
        {linked(post).length === 0
          ? <div className="item-meta">No media attached yet — attach footage from the library so it can be downloaded.</div>
          : linked(post).map((asset) => <div key={asset.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span className="mono">{asset.name}</span>
              <button className="btn btn-ghost" onClick={() => unlink(post, asset.id)} disabled={busy !== null}>Unlink</button>
            </div>)}
        <div className="actions" style={{ justifyContent: "flex-start", alignItems: "center", marginTop: 10 }}>
          <select value={selected[post.id] ?? ""} onChange={(event) => setSelected((current) => ({ ...current, [post.id]: event.target.value }))} style={{ minWidth: 260 }}>
            <option value="">Choose media from the library…</option>
            {assets.filter((asset) => !linked(post).some((item) => item.id === asset.id)).map((asset) => <option value={asset.id} key={asset.id}>{asset.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => attach(post)} disabled={busy !== null || !selected[post.id]}>Attach</button>
        </div>
      </div>

      {(files[post.id] ?? []).length > 0 && <div className="review-block" style={{ padding: "12px 0" }}>
        <div className="review-label">Download media</div>
        {(files[post.id] ?? []).map((file) => <div key={file.url}><a className="mono" href={file.url} target="_blank" rel="noreferrer">{file.name}</a></div>)}
        <div className="item-meta" style={{ marginTop: 6 }}>Links expire in 5 minutes — download before they lapse.</div>
      </div>}

      <form className="actions" style={{ justifyContent: "flex-start", alignItems: "center", marginTop: 8 }}
        onSubmit={(event) => { event.preventDefault(); markPosted(post, event.currentTarget); }}>
        <input name="postUrl" placeholder="Paste the post URL after publishing" style={{ minWidth: 300 }} />
        <button className="btn btn-primary" disabled={busy !== null}>{busy === `post:${post.id}` ? "Saving" : "Mark as posted"}</button>
      </form>
    </section>)}
  </>;
}
