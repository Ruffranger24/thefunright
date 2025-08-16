export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) return json({ error: "Missing ?url=" }, 400);

  try {
    const resp = await fetch(target, { headers: { "User-Agent": "TFR/1.0" } });
    if (!resp.ok) return json({ error: "Upstream fetch failed" }, 502);

    const xml = await resp.text();
    const items = parse(xml, target).slice(0, 20);
    return json({ items }, 200);
  } catch (err) {
    return json({ error: "Proxy error" }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "no-store"
    }
  });
}

// Super-lightweight RSS/Atom parser (titles, links, dates)
function parse(xml, sourceUrl) {
  const out = [];
  const rss = xml.split(/<\/item>/i).slice(0, -1).map(x => x + "</item>");
  const atom = xml.split(/<\/entry>/i).slice(0, -1).map(x => x + "</entry>");
  const chunks = rss.length ? rss : atom;

  const get = (s, tag) => {
    const m = s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    return m ? m[1].replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g, "$1").trim() : "";
  };
  const strip = (s) => s.replace(/<[^>]*>/g, "").trim();
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\\./, ""); } catch { return ""; } };

  for (const c of chunks) {
    const title = strip(get(c, "title"));
    let link = "";
    if (rss.length) {
      link = get(c, "link");
    } else {
      const m = c.match(/<link[^>]*rel=["']?alternate["']?[^>]*href=["']([^"']+)["']/i)
             || c.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = m ? m[1] : "";
    }
    const when = get(c, "pubDate") || get(c, "updated") || get(c, "published");
    if (title && link) out.push({ headline: title, url: link, source: host(sourceUrl), when });
  }
  return out;
}
