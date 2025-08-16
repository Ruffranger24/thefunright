async function fetchRSS(url) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const xml = await res.text();
      return parseRSS(xml, url);
    }
  } catch (_) {}

  const candidates = [
    `/rss?url=${encodeURIComponent(url)}`,
    `/api/rss?url=${encodeURIComponent(url)}`
  ];

  for (const proxied of candidates) {
    try {
      const r = await fetch(proxied, { cache: 'no-store' });
      if (!r.ok) continue;
      const data = await r.json();
      if (Array.isArray(data.items)) return data.items;
      if (data.xml) return parseRSS(data.xml, url);
    } catch (_) {}
  }
  console.warn('RSS fetch failed for', url);
  return [];
}

function parseRSS(xml, sourceUrl) {
  const out = [];
  const chunks = xml.split(/<item>/i).slice(1);
  for (const c of chunks) {
    const title = (c.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
    const link = (c.match(/<link>([\s\S]*?)<\/link>/i) || [])[1];
    if (title && link) out.push({ headline: title, url: link, source: new URL(sourceUrl).hostname });
  }
  return out;
}

async function buildPage() {
  const content = document.getElementById('content');
  const res = await fetch('links.json');
  const sections = await res.json();

  for (const sec of sections) {
    const s = document.createElement('section');
    const h = document.createElement('h2');
    h.textContent = sec.section;
    s.appendChild(h);

    if (sec.feeds) {
      for (const feed of sec.feeds) {
        const items = await fetchRSS(feed);
        for (const item of items.slice(0, 5)) {
          const a = document.createElement('a');
          a.href = item.url;
          a.textContent = item.headline;
          a.target = "_blank";
          const div = document.createElement('div');
          div.appendChild(a);
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = '📡';
          div.appendChild(badge);
          s.appendChild(div);
        }
      }
    }

    content.appendChild(s);
  }
}

buildPage();
