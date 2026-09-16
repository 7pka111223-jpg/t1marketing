export type PublishRequest = {
  publicationId: string;
  platform: "instagram" | "tiktok";
  mediaUrl: string;
  caption: string;
};

export type PublishResult = {
  externalId: string;
  status: "published" | "processing";
};
