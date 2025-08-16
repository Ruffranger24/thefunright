async function loadFeeds() {
  const content = document.getElementById('content');
  const res = await fetch('links.json');
  const sections = await res.json();

  for (const section of sections) {
    const secEl = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = section.section;
    secEl.appendChild(h2);

    const ul = document.createElement('ul');

    for (const feed of section.feeds) {
      try {
        const rssRes = await fetch(`/rss?url=${encodeURIComponent(feed)}`);
        const items = await rssRes.json();
        items.slice(0, 5).forEach(item => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = item.link;
          a.textContent = item.title;
          a.target = "_blank";
          li.appendChild(a);
          ul.appendChild(li);
        });
      } catch (e) {
        console.error('Error loading feed', feed, e);
      }
    }

    secEl.appendChild(ul);
    content.appendChild(secEl);
  }
}

loadFeeds();
