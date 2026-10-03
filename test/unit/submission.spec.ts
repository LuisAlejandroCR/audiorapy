// submission.spec.ts: the DEV post draft keeps the official template, quotes the same measured numbers
// as the README, links only screenshots that exist, and cannot be marked published with gaps left.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const normalizeNewlines = (text: string) => text.replace(/\r\n?/g, '\n');
const read = (p: string) =>
  normalizeNewlines(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const post = read('submission/dev-post.md');
const readme = read('README.md');
const frontMatter = post.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
const body = post.slice(frontMatter.length + 8);

const TEMPLATE_SECTIONS = [
  'What I Built',
  'Demo',
  'Code',
  'How I Built It',
  'Why Does Open Innovation Matter?',
  'My Agent Session',
  'Prize Categories',
];

describe('DEV submission draft', () => {
  it('normalizes Windows line endings before parsing Markdown', () => {
    expect(normalizeNewlines('---\r\ntags: one, two\r\n---\r\n')).toBe(
      '---\ntags: one, two\n---\n',
    );
  });

  it('carries exactly the three required tags', () => {
    const tags = frontMatter
      .match(/^tags: (.+)$/m)?.[1]
      ?.split(',')
      .map((t) => t.trim());
    expect(tags?.sort()).toEqual(['devchallenge', 'hf26challenge', 'weekendchallenge']);
  });

  it('has every section of the official template, in order', () => {
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]!.trim());
    const positions = TEMPLATE_SECTIONS.map((s) => headings.indexOf(s));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('quotes the same measured numbers as the README', () => {
    const rules = readme.match(/\| Rules \(deterministic fallback\) \| (\d+\/\d+) \((\d+) %\)/);
    const auc = readme.match(/\| Logistic regression \(baseline\) \| ([\d.]+) \|/);
    expect(rules && auc).toBeTruthy();
    expect(post).toContain(`${rules![1]} (${rules![2]} %)`);
    expect(post).toContain(`**${auc![1]}**`);
  });

  it('links only screenshots that exist in the repo', () => {
    const shots = [...post.matchAll(/audiorapy\/main\/(docs\/screenshots\/[\w.-]+)/g)].map(
      (m) => m[1]!,
    );
    expect(shots.length).toBeGreaterThan(0);
    for (const s of shots) expect(existsSync(new URL(`../../${s}`, import.meta.url))).toBe(true);
  });

  it('every author marker is closed, and none may remain once it is published', () => {
    const opened = post.split('[[AUTHOR:').length - 1;
    const markers = post.match(/\[\[AUTHOR:[^\]]*\]\]/g) ?? [];
    expect(markers).toHaveLength(opened);
    if (/^published: true$/m.test(frontMatter)) expect(markers).toEqual([]);
  });
});
