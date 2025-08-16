import Parser from 'rss-parser';
const parser = new Parser();

export async function onRequestGet(context) {
  const url = new URL(context.request.url).searchParams.get('url');
  if (!url) {
    return new Response(JSON.stringify({error: 'Missing url'}), {status: 400});
  }
  try {
    const feed = await parser.parseURL(url);
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link
    }));
    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({error: 'Failed to fetch feed'}), {status: 500});
  }
}
