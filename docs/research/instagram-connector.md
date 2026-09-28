# Research: a connector that reads @tripleonebars Instagram insights and media

Resolves issue #3. Feeds issue #8 ("Connect the @tripleonebars Instagram account to the chosen connector").
Researched 2026-09-28.

**Markers.** **[F]** is a fact taken from the cited primary source. **[I]** is my inference; it has not been verified against the live account. **[C]** is something Composio claims in its own tool schema or docs that Meta's docs do not confirm.

**Method.** I searched and read the Composio Instagram toolkit through the Composio MCP discovery tools (`COMPOSIO_SEARCH_TOOLS`, `COMPOSIO_GET_TOOL_SCHEMAS`). I only read schemas. No Instagram action was executed, and no account was connected or re-authorised. Meta's developer docs were read through Firecrawl because the session's egress proxy blocks `developers.facebook.com`. The "Updated" dates below are the ones shown on each Meta page.

---

## TL;DR

- **Recommendation: Composio's Instagram toolkit.** It uses the "Instagram API with Instagram Login", Meta's official API, so it does not scrape and is within Meta's terms. **[F]** An Instagram connection for `tripleonebars` already exists on Composio and is ACTIVE. It was created 2026-09-20 with the alias "TripleOneBars Instagram" and is the default account (from the `COMPOSIO_SEARCH_TOOLS` connection status). What remains for #8 is to confirm that the insights permission was actually granted and that the calls return data.
- **Available:** per-post reach, views, average watch time (Reels), 3-second skip rate (Reels), total watch time (Reels), saves, shares, likes, comments. Profile visits and follows are also available, but only for feed posts and stories, not Reels. Account-level followers (count), reach (with a follower/non-follower split), follows/unfollows, views and interactions are available. The media list includes permalink, caption, type, timestamp and `media_url`.
- **Not available from any official API:**
  - per-Reel profile visits and follows (Meta offers these for FEED and STORY only)
  - completion rate
  - per-post non-follower reach
  - account-level profile views (this time series was deprecated in January 2025)
  - `media_url` for videos that use licensed or library audio (Meta omits it, even for your own media)
- **Cost: $0 at this volume.** Rate limits don't matter at this volume, and Meta app review isn't needed for the fallback path, where the owner uses their own Meta app.

---

## 1. Composio's Instagram toolkit

**[F]** Composio has an `instagram` toolkit. Its docs page shows version `20260915_00`, 38 tools, and "Composio-managed OAuth available". It supports "Instagram Business and Creator accounts, not Instagram Personal accounts" (https://docs.composio.dev/toolkits/instagram).

**[F]** Composio's toolkit metadata (embedded in the same docs page) gives the OAuth2 auth config default scopes as:
`instagram_business_basic, instagram_business_manage_messages, instagram_business_manage_comments, instagram_business_content_publish, instagram_business_manage_insights`.
These are the `instagram_business_*` permission family, which means Business Login for Instagram (the Instagram API with Instagram Login, host `graph.instagram.com`). The `INSTAGRAM_GET_IG_USER_MEDIA` schema also says: "On Instagram Login the host follows the token (graph.instagram.com) and Facebook Page IDs are not resolved."

### Read-only actions relevant to the Friday Routine (schemas read via `COMPOSIO_GET_TOOL_SCHEMAS`)

| Action | Wraps (Meta endpoint) | Key parameters |
|---|---|---|
| `INSTAGRAM_GET_USER_INFO` | `GET /me` | `ig_user_id` (default `me`), `fields` (id, user_id, username, name, account_type, profile_picture_url, followers_count, follows_count, media_count) |
| `INSTAGRAM_GET_USER_INSIGHTS` | `GET /<ig-user>/insights` | `metric[]` (enum below), `period` (`day`\|`lifetime`), `metric_type` (`time_series`\|`total_value`), `breakdown` (contact_button_type, follow_type, media_product_type, age, city, country, gender), `since`/`until` (unix or YYYY-MM-DD), `timeframe` (`this_week`\|`this_month`, demographics only), `ig_user_id` |
| `INSTAGRAM_GET_IG_USER_MEDIA` | `GET /<ig-user>/media` | `ig_user_id` (required, use `me`), `since`/`until` (unix), `limit` (1–100, default 25), `after`/`before` cursors, `fields` |
| `INSTAGRAM_GET_IG_MEDIA` | `GET /<media-id>` | `ig_media_id` (numeric, not shortcode), `fields` |
| `INSTAGRAM_GET_IG_MEDIA_INSIGHTS` | `GET /<media-id>/insights` | `ig_media_id`, `metric[]`, `period` fixed `lifetime`, `breakdown` (`action_type`\|`story_navigation_action_type`) |
| `INSTAGRAM_GET_IG_MEDIA_CHILDREN` | `GET /<carousel-id>/children` | `ig_media_id`, `fields` |
| `INSTAGRAM_GET_IG_USER_STORIES` | `GET /<ig-user>/stories` | active stories only (24 h window) |
| `INSTAGRAM_GET_IG_MEDIA_COMMENTS` | `GET /<media-id>/comments` | `fields`, `limit`, `after` |

**[F]** The `INSTAGRAM_GET_USER_INSIGHTS` metric enum is: reach, follower_count, online_followers, accounts_engaged, total_interactions, likes, comments, shares, saves, replies, follows_and_unfollows, profile_links_taps, views, profile_views, website_clicks, the three demographics metrics, reposts, and Threads metrics. The schema adds: "Rejected by Meta – do not request: impressions, email_contacts, phone_call_clicks, text_message_clicks, get_directions_clicks." It also notes that `period` `week`/`days_28` "are no longer supported".

**[F]** `INSTAGRAM_GET_IG_MEDIA_INSIGHTS` lists these supported metrics:
- views, reach, saved, likes, comments, shares, total_interactions, reposts
- Reels: `ig_reels_video_view_total_time`, `ig_reels_avg_watch_time`, `reels_skip_rate`, `facebook_views`, `crossposted_views`
- Feed and story: `profile_activity`
- Stories: `link_clicks`, `replies`, `navigation`, `follows`, `profile_visits`

It says `impressions`, `plays`, `video_views` and `ig_reels_aggregated_all_plays_count` are deprecated and should be replaced by `views`.

**[C]** Composio's media-insights description says "the account must have at least 1,000 followers". Meta's media-insights reference has no such threshold (see §2). Treat it as unverified until #8's test call.

**[F]** The Composio default `fields` for `INSTAGRAM_GET_IG_USER_MEDIA` include `saved_count, shares_count, reposts_count, total_like_count, total_comments_count, total_views_count`. Meta documents every one of these as "Available for Instagram API with Facebook Login only" (IG Media reference, below). **[I]** On Composio's Instagram Login connection these fields will probably be absent or cause an error. The Routine should pass an explicit `fields` list (see §5), and it should take saves and shares from media insights instead.

---

## 2. Field coverage (Instagram API with Instagram Login, which is what Composio uses)

Sources:
- Meta, *Instagram Media Insights* (updated 11 Sep 2026): https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights
- Meta, *Instagram Account Insights* (updated 16 Jun 2026): https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights
- Meta, *IG Media* (updated 12 Aug 2026): https://developers.facebook.com/docs/instagram-platform/reference/instagram-media
- Meta, *Get started with Instagram Login* (`/me` fields): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started
- Meta, *Changelog*: https://developers.facebook.com/docs/instagram-platform/changelog

### Per-media (per post / Reel)

| Wanted (strategy §34) | API metric/field | Reels | Feed post | Status |
|---|---|---|---|---|
| Reach | insights `reach` | yes | yes | **[F] available**. Meta labels it "estimated" |
| Views / plays | insights `views` ("Total number of times IG Media has been played on Instagram") | yes | yes | **[F] available**. `plays`/`impressions` are deprecated |
| Average watch time | insights `ig_reels_avg_watch_time` | yes | – | **[F] available, Reels only** |
| Total watch time | insights `ig_reels_video_view_total_time` | yes | – | **[F] available, Reels only** ("in development") |
| 3-second skip rate | insights `reels_skip_rate` ("percentage of views from people who skipped during the first 3 seconds") | yes | – | **[F] available, Reels only** ("estimated and in development") |
| Saves | insights `saved` | yes | yes | **[F] available** |
| Shares | insights `shares` | yes | yes | **[F] available** |
| Comments | insights `comments`, or field `comments_count` | yes | yes | **[F] available** (organic only) |
| Likes | insights `likes`, or field `like_count` | yes | yes | **[F] available** (organic only; omitted if the owner hides like counts) |
| Profile visits | insights `profile_visits` / `profile_activity` | **no** | yes | **[F] FEED and STORY only; not returned for Reels** |
| Follows | insights `follows` | **no** | yes | **[F] FEED and STORY only; not returned for Reels** |
| Completion rate | none | – | – | **[F] not in Meta's metric list** |
| Non-follower reach per post | none (no breakdown on media reach) | – | – | **[F] not available per media**. Available at account level, see below |

Meta limitations **[F]**:
- Metrics can be delayed up to 48 hours.
- Data is kept for 2 years.
- A metric with no data returns an empty set, not `0`.
- Album children have no insights.
- `total_likes`/`total_comments`/`total_views` (which include ads) are Facebook Login only.
- The insights webhook is not supported with Instagram Login.

### Account-level

| Wanted | API | Status |
|---|---|---|
| Followers (current count) | `GET /me?fields=followers_count` (Composio `INSTAGRAM_GET_USER_INFO`) | **[F] available** |
| Follower growth | insights `follows_and_unfollows` (period `day`, `metric_type=total_value`, `breakdown=follow_type`) | **[F] available**. "Not returned if the IG User has less than 100 followers" |
| Reach | insights `reach` (period `day`; `time_series` or `total_value`; breakdowns `media_product_type`, `follow_type`) | **[F] available**. `follow_type` gives follower vs non-follower reach |
| Views | insights `views` (`total_value`; breakdowns `follower_type`, `media_product_type`) | **[F] available** |
| Engagement | `accounts_engaged`, `total_interactions`, `likes`, `comments`, `saves`, `shares`, `replies`, `reposts` | **[F] available** |
| Profile visits | insights `profile_views` | **[F] the time series was deprecated.** The changelog (17 Sep 2024) says "profile_views … time series metrics will no longer be supported", effective for all versions January 2025, and `profile_views` is absent from Meta's current metric table. **[C]** Composio still lists it. **[I]** Expect an error or an empty result; test it in #8. `profile_links_taps` (taps on contact buttons) is the nearest supported metric |
| `follower_count` insight (daily) | not in Meta's current metric table | **[C]** Composio lists it. Use the `followers_count` field instead |

**[F]** For `since`/`until`: "If you do not include these parameters, the API will look back 24 hours." Account insights data "may be delayed up to 48 hours".

### Media list

**[F]** `GET /me/media` returns the fields below (IG Media reference):

| Field | Status |
|---|---|
| `id`, `permalink`, `caption`, `media_type` (IMAGE/VIDEO/CAROUSEL_ALBUM), `timestamp` (ISO 8601, UTC), `thumbnail_url` (video only), `like_count`, `comments_count`, `shortcode` | **[F] available** |
| `media_product_type` (FEED/REELS/STORY/AD) | **[F]** Meta marks it "Available for Instagram API with Facebook Login only". **[C]** Composio's schema says Reels appear with `media_product_type=REELS`. **[I]** It may be missing on Instagram Login, so fall back to `media_type=VIDEO` and try `reels_skip_rate` |
| `media_url` (downloadable file) | **[F] available, but conditionally omitted.** It "is omitted … [when] the video contains copyrighted or licensed audio, including audio added from the Instagram audio library … This applies to all video media, including reels … and applies even when the app user owns the media." Images and carousel containers are unaffected. Meta says to fall back to `permalink` or `thumbnail_url`. **[I]** Reels that use trending or library audio will have no `media_url`, so the Routine cannot count on downloading them. **[I]** `media_url` points at Meta's CDN and should be downloaded promptly, not stored as a permanent link; the pages I read do not document an expiry |
| `saved_count`, `shares_count`, `reposts_count`, `total_*_count` | **[F] Facebook Login only.** Use media insights `saved`/`shares` instead |

**[F]** The Composio schema adds that `INSTAGRAM_GET_IG_USER_MEDIA` supports `since`/`until` unix filters and `limit` up to 100. One call covers a week of posts.

---

## 3. Requirements

| Requirement | Instagram Login (Composio) | Facebook Login (alternative) | Source |
|---|---|---|---|
| Account type | Instagram **professional** account: Business or Creator. `account_type` returns `Business` or `Media_Creator`. Personal accounts are not supported | Same | [F] Meta overview; Get started; Composio toolkit page |
| Business vs Creator | **[I]** Both work for every metric above. The pages I read show no metric that is restricted by account type | Same | inference from metric tables, which make no distinction |
| Facebook Page | **Not required** ("This API setup does not require a Facebook Page to be linked") | **Required**, and the user must be able to do admin-equivalent tasks on the Page | [F] Instagram Login page; overview (updated 16 Sep 2026) |
| Permissions / scopes | `instagram_business_basic` and `instagram_business_manage_insights` | `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement` (plus `ads_management`/`ads_read` if the Page role comes through Business Manager) | [F] Media and Account Insights references |
| App review | Needed only for **Advanced Access**. Standard Access "can only be requested from app users who have a role on the requesting app". Advanced Access needs Business Verification and possibly App Review. | Same | [F] https://developers.facebook.com/docs/graph-api/overview/access-levels ; overview |
| Composio managed app's review status | **Not documented.** Composio's FAQ admits that the managed app currently lacks an approved comment permission (`instagram_business_manage_comments`) and says "an owned Meta app is the current unblock path". It does not state the status of `instagram_business_manage_insights`. **[I]** The insights scope is in the default scope list and the connection is ACTIVE, so it was probably granted, but only a real call (#8) can confirm this | – | [F] Composio toolkit FAQ |
| Token lifetime | Short-lived token: 1 hour. Long-lived token: 60 days, refreshable when it is ≥24 h old and still valid. A token not refreshed within 60 days expires. **[F]** Composio "stores and refreshes the resulting tokens" | Similar (Facebook user token) | [F] Get started; Business Login page (updated 13 Mar 2026); https://docs.composio.dev/toolkits/managed-auth |
| Rate limit | `Calls within 24 hours = 4800 * Number of Impressions`, counted per app and user pair on a rolling 24 h window | Same | [F] overview |
| Terms | This is Meta's first-party API used with the account owner's OAuth consent, so it is the sanctioned route. Scraping is not | – | [I] |

**Rate-limit fit [I].** A weekly run makes about 1 user-info call, 1–3 account-insights calls, 1 media-list call and one insights call per post. That is roughly 10–25 calls a week, far below 4,800 × impressions.

**Cost [F]** (https://composio.dev/pricing):
- The Free plan is $0, needs no card, and includes "100,000 tool calls … each month".
- Scale is $29/month.
- "Composio-managed apps … include 20K free tool calls a month, then bill at an extra $0.0002 per tool call".

**[I]** About 100 calls a month costs **$0** on the Free plan. The Instagram tools are not premium tools.

---

## 4. Alternatives

| Option | Field coverage | Verdict |
|---|---|---|
| **A. Composio + the owner's own Meta app** (custom auth config: a Business-type Meta app with "Instagram API setup with Instagram business login", the owner added as app admin or tester, and its client id/secret entered in Composio; the redirect URI `https://backend.composio.dev/api/v1/auth-apps/add` goes on the app's allow list) | Identical to §2 | **Fallback if the managed app lacks the insights permission.** Standard Access is enough because the owner has a role on the app **[F access-levels]**, so no App Review and no Business Verification are needed |
| **B. Direct Meta API script** (`curl`/Python against `graph.instagram.com/v26.0`, with a long-lived token generated in App Dashboard → Instagram → "API setup with Instagram business login" → Generate token; the token is valid 60 days **[F Get started]**) | Identical to §2 | Works without any connector, but someone has to store the token as an environment secret and refresh it every ≤60 days (`refresh_access_token`). This adds upkeep, so use it only if Composio is unavailable |
| C. Instagram API with **Facebook Login** (any route) | Adds `total_views/likes/comments` (including ads), `saved_count`/`shares_count` as fields, and `media_product_type`. It adds **no** Reel profile-visit, follows or completion metrics | Needs a Facebook Page linked with admin rights, which is more setup for no gain on the needed fields. Not recommended |
| D. Other MCP connectors in this session: **Apify** (`APIFY_SCRAPE_INSTAGRAM_POSTS`), **Firecrawl** | Public data only (captions, likes and comments counts, public view counts). **No reach, saves, shares, watch time or skip rate** | **Rejected.** These are scrapers, which the owner ruled out, and they return no insights |
| E. **Make** (connected in this session) | **[I]** Make's Instagram for Business app uses the Facebook Login route (Page required). Its MCP exposes scenarios rather than a ready "read insights" tool. Not verified | Not recommended; it adds a third party and a scenario to maintain for no gain |

---

## 5. Recommendation and setup steps for #8

**Use the Composio Instagram toolkit on the existing ACTIVE connection** (`instagram_abask-copra`, alias "TripleOneBars Instagram"). Move to Alternative A (the owner's own Meta app in Composio) only if the smoke test shows that insights permission is missing.

### Owner steps

1. **Confirm the account type.** In the Instagram app go to Settings → Account type and tools, and confirm @tripleonebars is a **Business** or **Creator** account. **[I]** It almost certainly already is, because Instagram Login only connects professional accounts. No Facebook Page is needed.
2. **Confirm the connection.** In the Composio dashboard (Connected accounts → Instagram), check that "TripleOneBars Instagram" is Active. Reconnect it only if the smoke test fails. During a reconnect, the owner must approve **all** requested permissions on Instagram's consent screen, especially "insights" (`instagram_business_manage_insights`).
3. **Give the Routine the connector.** The Composio MCP connector must be connected at https://claude.ai/customize/connectors. When the Friday Routine is created, it has to be granted that connector (the `connectors` list on the Routine), because fired sessions only get the connectors stored on the Routine.
4. **Run the smoke test (#8's resolution).** Run these read-only calls, then record which fields came back:
   - `INSTAGRAM_GET_USER_INFO` with `ig_user_id=me` and `fields=user_id,username,account_type,followers_count,media_count`
   - `INSTAGRAM_GET_IG_USER_MEDIA` with `ig_user_id=me`, `since=<last Fri 00:00 Africa/Cairo as unix>`, `until=<this Fri>`, `limit=100` and `fields=id,caption,media_type,media_product_type,permalink,timestamp,media_url,thumbnail_url,like_count,comments_count`
   - For each media ID, `INSTAGRAM_GET_IG_MEDIA_INSIGHTS`:
     - for Reels, `metric=["reach","views","saved","shares","likes","comments","total_interactions","ig_reels_avg_watch_time","ig_reels_video_view_total_time","reels_skip_rate"]`
     - for feed posts and carousels, `metric=["reach","views","saved","shares","likes","comments","total_interactions","profile_visits","follows"]`
     - Meta errors if an incompatible metric is mixed in, so keep the two lists separate.
   - `INSTAGRAM_GET_USER_INSIGHTS` with `metric=["reach","views","accounts_engaged","total_interactions","follows_and_unfollows","profile_links_taps"]`, `period=day`, `metric_type=total_value`, and the same `since`/`until`. Make a second call with `metric=["reach"]`, `breakdown=follow_type` to get non-follower reach. Also try `profile_views` once, to record whether it is dead.
5. **If step 4 returns a permission error** (e.g. `(#10)` / `(#200)` on the insights calls), switch to Alternative A:
   1. At developers.facebook.com, create a Meta app of type **Business**.
   2. Add the product "Instagram → API setup with Instagram business login".
   3. Add @tripleonebars as an Instagram tester or role and accept the invite in Instagram.
   4. Add `https://backend.composio.dev/api/v1/auth-apps/add` as the OAuth redirect URI.
   5. In Composio, create a custom Instagram auth config with the app's client id and secret and the scopes `instagram_business_basic,instagram_business_manage_insights`.
   6. Reconnect and re-run step 4.

   No App Review is needed, because the owner has a role on the app.

### Routine design notes [I]
- Metrics can lag up to 48 h, so Friday numbers for Wednesday–Thursday posts are provisional. Consider reporting Friday→Thursday of the *previous* week, or re-reading the prior week.
- Meta's insights include the metric's `title` and `description`. Store raw values plus the fetch timestamp, because Meta marks reach and skip rate as "estimated" and some metrics as "in development", so values can be revised.
- Treat `media_url` as optional. Link `permalink` in the report, and download media only when `media_url` is present.
- Reel profile visits and follows are not obtainable. For lead attribution, rely on DM keywords (the Lead definition in `CONTEXT.md`) and the account-level `follows_and_unfollows`.
