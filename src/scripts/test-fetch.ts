import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function run() {
  const url = "https://translate.google.com/translate?sl=auto&tl=en&u=" + encodeURIComponent("https://mcpmarket.com/es");
  console.log(`Fetching from Google Translate proxy: ${url}`);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      }
    });
    console.log(`Response Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log("Google Translate content preview (first 500 chars):");
    console.log(text.slice(0, 500));
  } catch (err: any) {
    console.error("Fetch threw error:", err.message || err);
  }
}

run();
