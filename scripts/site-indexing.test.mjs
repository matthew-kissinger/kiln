import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

test('crawler discovery points only to the canonical document, without hash routes', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../site/public/sitemap.xml', import.meta.url), 'utf8');
  const robots = await readFile(new URL('../site/public/robots.txt', import.meta.url), 'utf8');
  expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  expect(html).toContain('<link rel="canonical" href="https://kilnstudio.tools/"');
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])).toEqual(['https://kilnstudio.tools/']);
  expect(robots).toContain('Sitemap: https://kilnstudio.tools/sitemap.xml');
  expect(robots).not.toMatch(/Disallow:\s*\//);
});
