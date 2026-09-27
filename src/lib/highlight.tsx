import type { ReactNode } from 'react';

/**
 * Tiny, dependency-free syntax highlighting for the raw view. It produces
 * React nodes (never HTML strings), so token content can't inject markup.
 */

const C = {
  punct: 'text-zinc-500',
  key: 'text-sky-300',
  string: 'text-brand-300',
  number: 'text-amber-300',
  literal: 'text-violet-300',
  comment: 'text-zinc-500 italic',
  tag: 'text-sky-300',
  attr: 'text-violet-300',
  text: 'text-zinc-100',
};

const JSON_TOKEN = /(\/\/.*$)|("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function highlightJsonLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(JSON_TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(<span key={last} className={C.punct}>{line.slice(last, i)}</span>);
    const [whole, comment, str, colon, literal, num] = m;
    if (comment) out.push(<span key={i} className={C.comment}>{comment}</span>);
    else if (str && colon) out.push(<span key={i}><span className={C.key}>{str}</span><span className={C.punct}>{colon}</span></span>);
    else if (str) out.push(<span key={i} className={C.string}>{str}</span>);
    else if (literal) out.push(<span key={i} className={C.literal}>{literal}</span>);
    else if (num) out.push(<span key={i} className={C.number}>{num}</span>);
    last = i + whole.length;
  }
  if (last < line.length) out.push(<span key={last} className={C.punct}>{line.slice(last)}</span>);
  return out;
}

const XML_TAG = /<[^>]*>/g;
const XML_ATTR = /([\w:.-]+)(\s*=\s*)("[^"]*"|'[^']*')/g;

function highlightTag(tag: string, key: number): ReactNode {
  const name = tag.match(/^<\/?[\w:.-]*/)?.[0] ?? '<';
  const rest = tag.slice(name.length);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of rest.matchAll(XML_ATTR)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(rest.slice(last, i));
    parts.push(
      <span key={i}>
        <span className={C.attr}>{m[1]}</span>
        <span className={C.punct}>{m[2]}</span>
        <span className={C.string}>{m[3]}</span>
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < rest.length) parts.push(<span key="end" className={C.punct}>{rest.slice(last)}</span>);
  return (
    <span key={key}>
      <span className={C.punct}>{name.slice(0, name.startsWith('</') ? 2 : 1)}</span>
      <span className={C.tag}>{name.replace(/^<\/?/, '')}</span>
      {parts}
    </span>
  );
}

function highlightXmlLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(XML_TAG)) {
    const i = m.index ?? 0;
    if (i > last) out.push(<span key={`t${last}`} className={C.text}>{line.slice(last, i)}</span>);
    out.push(highlightTag(m[0], i));
    last = i + m[0].length;
  }
  if (last < line.length) out.push(<span key={`t${last}`} className={C.text}>{line.slice(last)}</span>);
  return out;
}

/** Beyond this size highlighting costs more than it helps; plain text is used instead. */
const MAX_HIGHLIGHT = 250_000;

export function highlightLines(content: string, lang: 'json' | 'xml'): ReactNode[] {
  const lines = content.split('\n');
  if (content.length > MAX_HIGHLIGHT) return lines;
  return lines.map((l) => (lang === 'json' ? highlightJsonLine(l) : highlightXmlLine(l)));
}
