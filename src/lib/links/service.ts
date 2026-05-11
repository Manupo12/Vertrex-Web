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
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer la URL");
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") || $("title").text() || url;
  const description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;
  const imageUrl = $('meta[property="og:image"]').attr("content") || null;
  let type = "otro";
  const host = new URL(url).hostname;
  if (host.includes("tiktok")) type = "tiktok";
  else if (host.includes("reddit")) type = "reddit";
  else if (host.includes("medium") || host.includes("dev.to")) type = "article";

  return { url, title, description, imageUrl, type };
}
