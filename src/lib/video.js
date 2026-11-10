// Reads a video link pasted in the administration (YouTube, Vimeo or a video file) and gives what
// the site's player needs. Shared by the server (validation) and the browser (player, preview).

export const VIDEO_CATEGORIES = [
  { key: "entreprise", label: "L'entreprise" },
  { key: "guinee", label: "La Guinée" },
];

export const VIDEO_CATEGORY_LABEL = Object.fromEntries(VIDEO_CATEGORIES.map((item) => [item.key, item.label]));

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{5,12}$/;
const VIDEO_FILE = /\.(mp4|webm)$/i;

// { provider: "youtube", id, short } | { provider: "vimeo", id, hash } | { provider: "file", src } | null
export function parseVideo(url) {
  const value = String(url ?? "").trim();
  if (!value) return null;
  // A file served by the site itself (public/videos/…).
  if (value.startsWith("/")) {
    return /^\/[\w\-./]+$/.test(value) && !value.includes("..") && VIDEO_FILE.test(value)
      ? { provider: "file", src: value }
      : null;
  }

  let link;
  try {
    link = new URL(value);
  } catch {
    return null;
  }
  if (link.protocol !== "https:") return null;
  const host = link.hostname.replace(/^(www\.|m\.)/, "");
  const parts = link.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    let id = null;
    if (host === "youtu.be") id = parts[0];
    else if (link.pathname === "/watch") id = link.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(parts[0])) id = parts[1];
    return id && YOUTUBE_ID.test(id) ? { provider: "youtube", id, short: parts[0] === "shorts" } : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // vimeo.com/123456789, vimeo.com/123456789/abcdef (unlisted), player.vimeo.com/video/123456789?h=abcdef,
    // vimeo.com/channels/name/123456789
    const index = parts.findIndex((part) => VIMEO_ID.test(part));
    if (index === -1) return null;
    const next = parts[index + 1];
    const hash = link.searchParams.get("h") || (next && /^[a-f0-9]{6,20}$/i.test(next) ? next : "");
    return { provider: "vimeo", id: parts[index], hash: /^[a-f0-9]*$/i.test(hash) ? hash : "" };
  }

  return VIDEO_FILE.test(link.pathname) ? { provider: "file", src: link.href } : null;
}

// The address loaded in the player once the visitor presses play.
export function embedSrc(parsed) {
  if (parsed?.provider === "youtube") {
    // youtube-nocookie: no YouTube cookie until the visitor plays the video.
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&playsinline=1`;
  }
  if (parsed?.provider === "vimeo") {
    return `https://player.vimeo.com/video/${parsed.id}?autoplay=1&dnt=1${parsed.hash ? `&h=${parsed.hash}` : ""}`;
  }
  return parsed?.src ?? "";
}

// The image shown before play: the one chosen in the administration, or YouTube's own.
export function videoPoster(video, parsed = parseVideo(video?.url)) {
  if (video?.poster) return video.poster;
  if (parsed?.provider === "youtube") return `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`;
  return "";
}
