import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

test('crawler discovery points only to the canonical document, without hash routes', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../site/public/sitemap.xml', import.meta.url), 'utf8');
  const robots = await readFile(new URL('../site/public/robots.txt', import.meta.url), 'utf8');
  expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  expect(html).toContain('<link rel="canonical" href="https://kilnstudio.tools/"');
  expect(html).toContain(
    '<meta property="og:title" content="Kiln | Procedural 3D engine and agent toolchain"',
  );
  expect(html).toContain(
    '<meta property="og:image" content="https://kilnstudio.tools/kiln-social-27-v2.png"',
  );
  expect(html).toContain('<meta property="og:image:width" content="1200"');
  expect(html).toContain('<meta property="og:image:height" content="630"');
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
  expect(html).toContain(
    'content="27 one-shot Kiln assets built across coding-agent harnesses and multimodal models"',
  );
  expect(html).toContain(
    '<meta name="twitter:image" content="https://kilnstudio.tools/kiln-social-27-v2.png"',
  );
  const socialImage = await readFile(
    new URL('../site/public/kiln-social-27-v2.png', import.meta.url),
  );
  expect(socialImage.subarray(1, 4).toString()).toBe('PNG');
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])).toEqual([
    'https://kilnstudio.tools/',
  ]);
  expect(robots).toContain('Sitemap: https://kilnstudio.tools/sitemap.xml');
  expect(robots).not.toMatch(/Disallow:\s*\//);
  const index = await readFile(
    new URL('../site/public/sitemap-index.xml', import.meta.url),
    'utf8',
  );
  expect([...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])).toEqual([
    'https://kilnstudio.tools/sitemap.xml',
  ]);
});
