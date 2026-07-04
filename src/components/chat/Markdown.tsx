import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Minimal but premium markdown renderer.
 * Supports: headings, bold, inline code, bullet lists, tables, and fenced
 * code blocks styled like VS Code. Intentionally dependency-free.
 */

function inline(text: string, key: number) {
  // split on **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <span key={key}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return (
            <strong key={i} className="font-semibold text-white">
              {p.slice(2, -2)}
            </strong>
          )
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code
              key={i}
              className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-light"
            >
              {p.slice(1, -1)}
            </code>
          )
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 font-mono text-xs text-muted">{lang || 'code'}</span>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-white"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[0.85rem] leading-relaxed">
        <code className="font-mono text-[#c9d1d9]">{code}</code>
      </pre>
    </div>
  )
}

function Table({ rows }: { rows: string[][] }) {
  const [head, , ...body] = rows
  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04]">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-medium text-white">
                {h.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 text-muted">
                  {c.trim()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let list: string[] = []
  let tableBuf: string[] = []

  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
        {list.map((l, k) => (
          <li key={k} className="flex gap-2.5">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-light" />
            <span>{inline(l, k)}</span>
          </li>
        ))}
      </ul>,
    )
    list = []
  }
  const flushTable = () => {
    if (!tableBuf.length) return
    const rows = tableBuf.map((r) =>
      r.replace(/^\||\|$/g, '').split('|'),
    )
    blocks.push(<Table key={`tb-${blocks.length}`} rows={rows} />)
    tableBuf = []
  }

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block
    if (line.trim().startsWith('```')) {
      flushList()
      flushTable()
      const lang = line.trim().slice(3)
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      blocks.push(
        <CodeBlock key={`cb-${blocks.length}`} lang={lang} code={code.join('\n')} />,
      )
      i++
      continue
    }

    // table rows
    if (line.trim().startsWith('|')) {
      flushList()
      tableBuf.push(line.trim())
      i++
      continue
    } else {
      flushTable()
    }

    // headings
    if (line.startsWith('### ')) {
      flushList()
      blocks.push(
        <h3 key={i} className="mb-1 mt-4 text-base font-semibold text-white">
          {inline(line.slice(4), i)}
        </h3>,
      )
      i++
      continue
    }

    // bullets
    if (line.trim().startsWith('- ')) {
      list.push(line.trim().slice(2))
      i++
      continue
    }
    flushList()

    // blank
    if (line.trim() === '') {
      i++
      continue
    }

    blocks.push(
      <p key={i} className="my-1.5 leading-relaxed">
        {inline(line, i)}
      </p>,
    )
    i++
  }
  flushList()
  flushTable()

  return <div className="text-[0.95rem] text-white/85">{blocks}</div>
}
