/**
 * QuestionRenderer — renders a question stem + options with full KaTeX support.
 *
 * Two modes:
 *  - "exam"   : student view — clickable options, no correct-answer highlight
 *  - "review" : teacher view — display only, correct answer highlighted
 */
import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import clsx from 'clsx'

// ── Types ──────────────────────────────────────────────────────────────────

export type OptionType = 'text' | 'latex'

export interface RenderedQuestion {
  enunciado: string
  tiene_latex_enunciado?: boolean
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  tipo_a?: OptionType
  tipo_b?: OptionType
  tipo_c?: OptionType
  tipo_d?: OptionType
  respuesta_correcta?: string | null
  tiene_imagen?: boolean
}

interface Props {
  question: RenderedQuestion
  mode: 'exam' | 'review'
  selectedAnswer?: string | null       // exam mode: student's current pick
  confirmedAnswer?: string | null      // review mode: teacher-confirmed answer
  onSelect?: (letter: string) => void  // exam mode callback
}

// ── LaTeX renderer ─────────────────────────────────────────────────────────

function renderLatex(src: string, display = false): string {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, output: 'html' })
  } catch {
    return `<span style="color:#cc0000;font-size:0.85em">[LaTeX error]</span>`
  }
}

/**
 * Converts a LaTeX tabular block to an HTML <table>.
 * KaTeX does NOT support \begin{tabular} — it is a text-mode environment.
 * Supports: column specs (l,c,r,|), \hline, & separator, \\ row end.
 * Cells may contain inline math ($...$) rendered by KaTeX.
 */
function latexTabularToHtml(tabular: string): string {
  const specMatch = tabular.match(/\\begin\{tabular\}\{([^}]+)\}/)
  const spec = specMatch ? specMatch[1] : ''

  const colAligns: string[] = []
  const hasBorderLeft: boolean[] = []
  let pendingBorder = false
  for (const ch of spec) {
    if (ch === '|') { pendingBorder = true }
    else if (ch === 'l' || ch === 'c' || ch === 'r') {
      hasBorderLeft.push(pendingBorder)
      colAligns.push(ch === 'l' ? 'left' : ch === 'r' ? 'right' : 'center')
      pendingBorder = false
    }
  }
  const hasBorderRight = spec.endsWith('|')

  const bodyMatch = tabular.match(/\\begin\{tabular\}\{[^}]+\}([\s\S]*)\\end\{tabular\}/)
  const body = bodyMatch ? bodyMatch[1] : ''
  const rawRows = body.split(/\\\\/)

  const rows: string[] = []
  let pendingHline = false
  const rowHlines: boolean[] = []

  for (const raw of rawRows) {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.replace(/\\hline/g, '').trim() === '') {
      if (trimmed.includes('\\hline')) pendingHline = true
        continue
    }
    rowHlines.push(trimmed.includes('\\hline') || pendingHline)
    pendingHline = false
    rows.push(trimmed.replace(/\\hline/g, '').trim())
  }

  const renderCell = (cell: string) => {
    let out = cell.trim()
    out = out.replace(/\$([^$]+?)\$/g, (_: string, math: string) => renderLatex(math, false))
    return out
  }

  let html = `<table style="border-collapse:collapse;width:100%;font-size:0.85em">`
  rows.forEach((row, ri) => {
    const cells = row.split('&')
    const borderTop = rowHlines[ri] ? '1px solid #555' : 'none'
    const borderBottom = (ri === rows.length - 1 && hasBorderRight) ? '1px solid #555' : 'none'
  const isHeader = ri === 0 && rowHlines[0]
  const tag = isHeader ? 'th' : 'td'
  const bgStyle = isHeader ? 'background:#f1f5f9;font-weight:600;' : ''
  html += `<tr>`
  cells.forEach((cell, ci) => {
    const align = colAligns[ci] ?? 'left'
    const bl = hasBorderLeft[ci] ? '1px solid #555' : 'none'
    const br = (ci === cells.length - 1 && hasBorderRight) ? '1px solid #555' : 'none'
  html += `<${tag} style="${bgStyle}text-align:${align};padding:4px 10px;border-top:${borderTop};border-bottom:${borderBottom};border-left:${bl};border-right:${br}">${renderCell(cell)}</${tag}>`
  })
  html += `</tr>`
  })
  html += `</table>`
  return html
  }

  /**
   * Renders a string that may contain:
   * - Inline LaTeX: $...$ or \(...\)
   * - Display LaTeX: $$...$$ or \[...\]
   * - LaTeX tabular blocks → converted to HTML table (KaTeX does not support tabular)
   * - Plain text
   */
  function MixedContent({ src, display = false }: { src: string; display?: boolean }) {
    const html = useMemo(() => {
      if (!src) return ''

        let result = src

        // 1. Tabular blocks → HTML table (must run before KaTeX passes)
        result = result.replace(/(\\begin\{tabular\}[\s\S]+?\\end\{tabular\})/g, (_, t) =>
        latexTabularToHtml(t)
        )

        // 2. Full-LaTeX option (display mode, no tabular left)
        // Skip KaTeX if result already contains HTML (e.g. converted tabular tables)
        if (display && !result.includes('\\begin{') && !result.includes('<table')) {
          return renderLatex(result, true)
        }

        // 3. Display math: $$...$$ or \[...\]
        result = result.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_, a, b) =>
        renderLatex(a ?? b, true)
        )
        // 4. Inline math: $...$ or \(...\)
        result = result.replace(/\$([^$\n]+?)\$|\\\((.+?)\\\)/g, (_, a, b) =>
        renderLatex(a ?? b, false)
        )

        return result
    }, [src, display])

    return <span dangerouslySetInnerHTML={{ __html: html }} />
  }

  // ── Option block ───────────────────────────────────────────────────────────

  function OptionBlock({
    letter, value, tipo, selected, correct, mode, onClick,
  }: {
    letter: string
    value: string
    tipo: OptionType
    selected: boolean
    correct: boolean
    mode: 'exam' | 'review'
  onClick?: () => void
  }) {
    const isLatex = tipo === 'latex'

    const base = 'flex items-start gap-3 w-full text-left transition-all border'
    const pad  = isLatex ? 'p-3' : 'p-3'

    // Exam mode: selected = blue, else neutral hover
    const examStyle = selected
    ? 'bg-blue-50 border-blue-400'
    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'

    // Review mode: correct = green, else neutral (no hover)
    const reviewStyle = correct
    ? 'bg-emerald-50 border-emerald-300'
    : 'bg-slate-50 border-slate-200'

    const style = mode === 'exam' ? examStyle : reviewStyle

    const Tag = mode === 'exam' ? 'button' : 'div'

    return (
      <Tag
      className={clsx(base, pad, style)}
      onClick={mode === 'exam' ? onClick : undefined}
      type={mode === 'exam' ? 'button' : undefined}
      >
      {/* Letter badge */}
      <span className={clsx(
        'w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
        mode === 'exam' && selected     ? 'bg-blue-600 text-white'
        : mode === 'review' && correct  ? 'bg-emerald-500 text-white'
        :                                 'bg-slate-200 text-slate-600',
      )}>
      {letter}
      </span>

      {/* Content */}
      <div className="flex-1 text-sm leading-relaxed text-slate-700 min-w-0">
      {isLatex
        ? <MixedContent src={value} display={true} />
        : <MixedContent src={value} />
      }
      </div>
      </Tag>
    )
  }

  // ── Main component ─────────────────────────────────────────────────────────

  export default function QuestionRenderer({
    question: q,
    mode,
    selectedAnswer,
    confirmedAnswer,
    onSelect,
  }: Props) {
    const opts: { l: 'A' | 'B' | 'C' | 'D'; val: string; tipo: OptionType }[] = [
      { l: 'A', val: q.opcion_a, tipo: q.tipo_a ?? 'text' },
      { l: 'B', val: q.opcion_b, tipo: q.tipo_b ?? 'text' },
      { l: 'C', val: q.opcion_c, tipo: q.tipo_c ?? 'text' },
      { l: 'D', val: q.opcion_d, tipo: q.tipo_d ?? 'text' },
    ]

    // If any option contains a tabular block → single column (tables need full width)
    const hasTabularOpts = opts.some((o) => o.tipo === 'latex' && o.val.includes('\\begin{tabular}'))
    const allLatex = opts.every((o) => o.tipo === 'latex')
    // allLatex+no tables → 2×2 grid (compact math fractions); tabular or mixed → single col
    const gridCols = (!hasTabularOpts && allLatex) ? 'grid-cols-2' : 'grid-cols-1'

    const correct = confirmedAnswer ?? q.respuesta_correcta ?? null

    return (
      <div>
      {/* Stem */}
      <div className="mb-5 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
      {q.tiene_latex_enunciado
        ? <MixedContent src={q.enunciado} />
        : <span>{q.enunciado}</span>
      }
      </div>

      {/* Image placeholder */}
      {q.tiene_imagen && (
        <div className="border-2 border-dashed border-slate-300 p-4 text-center mb-4 bg-slate-50">
        <svg className="mx-auto mb-2 text-slate-300" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="m21 15-5-5L5 21"/><circle cx="9" cy="9" r="2"/>
        </svg>
        <p className="text-xs text-slate-500 font-medium">Figura — insertar manualmente</p>
        </div>
      )}

      {/* Options */}
      <div className={clsx('grid gap-2', gridCols)}>
      {opts.map(({ l, val, tipo }) => (
        <OptionBlock
        key={l}
        letter={l}
        value={val}
        tipo={tipo}
        selected={selectedAnswer === l}
        correct={mode === 'review' && correct === l}
        mode={mode}
        onClick={() => onSelect?.(l)}
        />
      ))}
      </div>
      </div>
    )
  }
