
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  CSS: "#563d7c",
  HTML: "#e34c26",
};

export function parseGitHubUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "github.com") return null;
  const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
  if (!owner || !repo) return null;
  return { owner, repo: repo.replace(/\.git$/, ""), normalizedUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}` };
}

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

export async function fetchGitHubRepo(url: string) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) throw new Error("URL de GitHub inv\u00e1lida");

  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron obtener metadatos del repositorio");
  const data = await res.json();

  return {
    url: parsed.normalizedUrl,
    owner: parsed.owner,
    repoName: parsed.repo,
    description: data.description as string | null,
    language: data.language as string | null,
    languageColor: data.language ? LANGUAGE_COLORS[data.language] || "#64748b" : null,
    stars: Number(data.stargazers_count || 0),
    forks: Number(data.forks_count || 0),
    topics: Array.isArray(data.topics) ? data.topics : [],
    pushedAt: data.pushed_at ? new Date(data.pushed_at) : null,
  };
}

export async function fetchGitHubReadme(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: githubHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("README no disponible");
  const data = await res.json();
  return Buffer.from(String(data.content || ""), "base64").toString("utf8");
}

function classifyType(host: string): string {
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("reddit")) return "reddit";
  if (host.includes("medium") || host.includes("dev.to")) return "article";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "video";
  if (host.includes("github.com")) return "github";
  if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
  if (host.includes("linkedin.com")) return "linkedin";
  return "otro";
}

// Layer 1: open-graph-scraper with Googlebot UA (fast, works ~60% of sites)
async function fetchOgsLayer(url: string): Promise<{ title: string | null; description: string | null; imageUrl: string | null }> {
  // Dynamic import to avoid issues with the ESM package
  const ogs = (await import("open-graph-scraper")).default;
  const { result, error } = await ogs({
    url,
    fetchOptions: {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
  } as Parameters<typeof ogs>[0]);

  if (error || !result.ogTitle) throw new Error("OGS layer: no meaningful data");

  return {
    title: result.ogTitle || null,
    description: result.ogDescription || result.twitterDescription || null,
    imageUrl: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
  };
}

// Layer 2: Microlink.io API (handles Cloudflare-protected sites, 50 req/day free, no key needed)
async function fetchMicrolinkLayer(url: string): Promise<{ title: string | null; description: string | null; imageUrl: string | null }> {
  const res = await fetch(
    `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    }
  );

  if (!res.ok) throw new Error(`Microlink HTTP ${res.status}`);
  const body = await res.json();

  if (body.status === "fail") throw new Error("Microlink fail: " + body.message);

  return {
    title: body.data?.title || null,
    description: body.data?.description || null,
    imageUrl: body.data?.image?.url || body.data?.logo?.url || null,
  };
}

export async function fetchOpenGraph(url: string) {
  const host = new URL(url).hostname;
  const cleanHost = host.replace("www.", "");
  const type = classifyType(host);

  let title: string | null = null;
  let description: string | null = null;
  let imageUrl: string | null = null;

  // ── Layer 1: open-graph-scraper (fast, low cost, good for most sites) ──
  try {
    const layer1 = await fetchOgsLayer(url);
    title = layer1.title;
    description = layer1.description;
    imageUrl = layer1.imageUrl;
    console.log("[OG] Layer 1 (OGS) succeeded for", url);
  } catch (e1) {
    console.log("[OG] Layer 1 failed, trying Microlink:", url);

    // ── Layer 2: Microlink.io (bypasses Cloudflare / JS challenges) ──
    try {
      const layer2 = await fetchMicrolinkLayer(url);
      title = layer2.title;
      description = layer2.description;
      imageUrl = layer2.imageUrl;
      console.log("[OG] Layer 2 (Microlink) succeeded for", url);
    } catch (e2) {
      console.log("[OG] Layer 2 failed, using domain fallback:", url);
    }
  }

  // ── Layer 3: domain-derived fallback (always succeeds) ──
  if (!title) {
    const lastPart = url.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || cleanHost;
    title = `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} | ${cleanHost}`;
  }
  if (!imageUrl) {
    imageUrl = `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=128`;
  }

  return { url, title, description, imageUrl, type };
}

