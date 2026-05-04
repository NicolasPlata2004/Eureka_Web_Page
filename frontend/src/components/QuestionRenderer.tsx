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
    return src
  }
}

/**
 * Renders a string that may contain:
 * - Inline LaTeX: $...$ or \(...\)
 * - Display LaTeX: $$...$$ or \[...\]
 * - LaTeX tabular blocks: \begin{tabular}...\end{tabular}
 * - Plain text
 */
function MixedContent({ src, display = false }: { src: string; display?: boolean }) {
  const html = useMemo(() => {
    if (!src) return ''

    // Full LaTeX block (no delimiters needed — entire string is LaTeX)
    if (display) return renderLatex(src, true)

    // Split on display math: $$...$$ or \[...\]
    // then inline math: $...$ or \(...\)
    let result = src

    // Display math blocks
    result = result.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_, a, b) =>
      renderLatex(a ?? b, true)
    )
    // Inline math
    result = result.replace(/\$([^$\n]+?)\$|\\\((.+?)\\\)/g, (_, a, b) =>
      renderLatex(a ?? b, false)
    )
    // Bare tabular blocks (no $ delimiters)
    result = result.replace(/(\\begin\{tabular\}[\s\S]+?\\end\{tabular\})/g, (_, t) =>
      renderLatex(t, true)
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
      <div className="flex-1 text-sm leading-relaxed text-slate-700 overflow-x-auto">
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

  // All options same tipo → 2-column grid; else single column
  const allLatex = opts.every((o) => o.tipo === 'latex')
  const gridCols = allLatex ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'

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
