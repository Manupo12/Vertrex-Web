import * as cheerio from "cheerio";

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

export async function fetchOpenGraph(url: string) {
  const host = new URL(url).hostname;
  const cleanHost = host.replace("www.", "");

  try {
    const res = await fetch(url, { 
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    if (!res.ok) throw new Error("Status " + res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let title = $('meta[property="og:title"]').attr("content") || $("title").text() || "";
    title = title.trim();
    if (!title) {
      const lastPart = url.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || cleanHost;
      title = `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} | ${cleanHost}`;
    }

    const description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;
    
    let imageUrl = $('meta[property="og:image"]').attr("content") || null;
    if (!imageUrl) {
      const favicon = $('link[rel="shortcut icon"]').attr("href") || $('link[rel="icon"]').attr("href") || $('link[rel="apple-touch-icon"]').attr("href");
      if (favicon) {
        try {
          imageUrl = new URL(favicon, url).href;
        } catch {}
      }
    }

    if (!imageUrl) {
      imageUrl = `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=128`;
    }

    let type = "otro";
    if (host.includes("tiktok")) type = "tiktok";
    else if (host.includes("reddit")) type = "reddit";
    else if (host.includes("medium") || host.includes("dev.to")) type = "article";
    else if (host.includes("youtube.com") || host.includes("youtu.be")) type = "video";
    else if (host.includes("github.com")) type = "github";

    return { url, title, description, imageUrl, type };
  } catch (err) {
    // Fallback: guess title and use google favicon service
    const lastPart = url.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || cleanHost;
    const title = `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} | ${cleanHost}`;
    const imageUrl = `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=128`;
    return { 
      url, 
      title, 
      description: "Enlace guardado de forma rápida", 
      imageUrl, 
      type: "otro" 
    };
  }
}
