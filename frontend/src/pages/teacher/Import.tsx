import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Upload, FileImage, Wand2, CheckCircle2, Edit3,
  Trash2, AlertTriangle, ArrowRight, RefreshCw, FileText,
  ChevronLeft, ChevronRight, X, Save,
} from 'lucide-react'
import clsx from 'clsx'
import QuestionRenderer, { type RenderedQuestion } from '@/components/QuestionRenderer'
import { aiApi } from '@/lib/api'
import { AppLayout, TopHeader, Spinner, AreaBadge, DifficultyBadge } from '@/components/ui'
import { AREA_LABELS, type QuestionArea } from '@/types'
import toast from 'react-hot-toast'

const AREAS: QuestionArea[] = [
  'matematicas', 'lectura_critica', 'sociales_ciudadanas', 'ciencias_naturales', 'ingles',
]

interface OCRQuestion {
  enunciado: string
  tiene_latex_enunciado?: boolean
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  tipo_a?: 'text' | 'latex'
  tipo_b?: 'text' | 'latex'
  tipo_c?: 'text' | 'latex'
  tipo_d?: 'text' | 'latex'
  respuesta_correcta: string | null   // IA suggestion (from OCR pipeline)
  area: QuestionArea
  difficulty: string
  latex_content?: string
  tiene_imagen: boolean
  _teacherAnswer?: string | null      // Confirmed by teacher
  _saved?: boolean
  _error?: string
}

// ── Question number navigator ──────────────────────────────────────────────

function QuestionNav({
  questions, current, onSelect,
}: {
  questions: OCRQuestion[]
  current: number
  onSelect: (i: number) => void
}) {
  const saved = questions.filter((q) => q._saved).length
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {saved}/{questions.length} guardadas
        </span>
        <div className="flex gap-0.5">
          <button onClick={() => onSelect(Math.max(0, current - 1))} disabled={current === 0}
            className="btn-ghost p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
          <button onClick={() => onSelect(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}
            className="btn-ghost p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const answered = q._teacherAnswer !== undefined ? q._teacherAnswer : q.respuesta_correcta
          return (
            <button key={i} onClick={() => onSelect(i)} title={`Pregunta ${i + 1}`}
              className={clsx(
                'w-9 h-9 text-xs font-bold border-2 transition-all flex items-center justify-center',
                i === current         ? 'bg-blue-600 border-blue-600 text-white'
                : q._saved           ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                : answered           ? 'bg-blue-50 border-blue-300 text-blue-600'
                :                      'border-[var(--border)] text-[var(--text-muted)] hover:border-blue-400',
              )}>
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="mt-3 space-y-1">
        {[
          { color: 'bg-blue-600 border-blue-600', label: 'Actual' },
          { color: 'bg-emerald-50 border-emerald-400', label: 'Guardada' },
          { color: 'bg-blue-50 border-blue-300', label: 'Con respuesta' },
          { color: 'border-[var(--border)]', label: 'Pendiente' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={clsx('w-3 h-3 border-2 flex-shrink-0', color)} />
            <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Question canvas (read-only viewer) ─────────────────────────────────────

function QuestionCanvas({ q, index }: { q: OCRQuestion; index: number }) {
  const confirmed = q._teacherAnswer !== undefined ? q._teacherAnswer : q.respuesta_correcta

  const rq: RenderedQuestion = {
    enunciado: q.enunciado,
    tiene_latex_enunciado: q.tiene_latex_enunciado,
    opcion_a: q.opcion_a,
    opcion_b: q.opcion_b,
    opcion_c: q.opcion_c,
    opcion_d: q.opcion_d,
    tipo_a: q.tipo_a,
    tipo_b: q.tipo_b,
    tipo_c: q.tipo_c,
    tipo_d: q.tipo_d,
    respuesta_correcta: confirmed,
    tiene_imagen: q.tiene_imagen,
  }

  return (
    <div className="bg-white border border-[var(--border)] p-5 overflow-y-auto" style={{ minHeight: 300, maxHeight: 420 }}>
      {/* Header badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="font-bold text-sm text-[var(--text)]">Pregunta {index + 1}</span>
        <AreaBadge area={q.area} />
        <DifficultyBadge difficulty={q.difficulty} />
        {(q.tiene_latex_enunciado || q.tipo_a === 'latex' || q.tipo_b === 'latex') && (
          <span className="badge badge-purple text-xs">∑ LaTeX</span>
        )}
        {q.tiene_imagen && (
          <span className="badge badge-yellow text-xs flex items-center gap-1">
            <FileImage size={10} /> Imagen
          </span>
        )}
      </div>

      <QuestionRenderer
        question={rq}
        mode="review"
        confirmedAnswer={confirmed}
      />
    </div>
  )
}

// ── Answer bar ─────────────────────────────────────────────────────────────

function AnswerBar({
  q, onAnswer, onSave, onRemove, saving,
}: {
  q: OCRQuestion
  onAnswer: (l: string) => void
  onSave: () => void
  onRemove: () => void
  saving: boolean
}) {
  const aiSuggestion = q.respuesta_correcta
  const confirmed = q._teacherAnswer !== undefined ? q._teacherAnswer : q.respuesta_correcta
  const teacherHasChosen = q._teacherAnswer !== undefined

  return (
    <div className="border border-[var(--border)] border-t-0 bg-[var(--surface-2)] p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">
          Respuesta correcta:
        </span>

        <div className="flex gap-2">
          {(['A', 'B', 'C', 'D'] as const).map((l) => {
            const isConfirmed = confirmed === l
            const isAiOnly = aiSuggestion === l && !teacherHasChosen
            return (
              <button key={l} onClick={() => onAnswer(l)} disabled={q._saved}
                className={clsx(
                  'w-10 h-10 text-sm font-bold transition-all border-2',
                  isConfirmed && teacherHasChosen  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isAiOnly                       ? 'border-dashed border-emerald-400 text-emerald-700 bg-emerald-50'
                  : isConfirmed                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  :                                  'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600',
                  q._saved && 'cursor-default opacity-70',
                )}>
                {l}
              </button>
            )
          })}
        </div>

        {aiSuggestion ? (
          <span className="text-[11px] px-2 py-1 bg-emerald-50 border border-dashed border-emerald-300 text-emerald-700 whitespace-nowrap">
            IA sugiere: <strong>{aiSuggestion}</strong>
            {!teacherHasChosen && <span className="text-emerald-500"> · pendiente confirmar</span>}
            {teacherHasChosen && confirmed !== aiSuggestion && <span className="text-slate-500"> · cambiado por docente</span>}
          </span>
        ) : (
          <span className="text-[11px] px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1 whitespace-nowrap">
            <AlertTriangle size={10} /> Sin sugerencia IA
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!q._saved && (
            <button onClick={onRemove} className="btn-ghost p-2 text-red-400 hover:bg-red-50" title="Eliminar">
              <Trash2 size={14} />
            </button>
          )}
          {q._saved ? (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 size={13} /> Guardada
            </span>
          ) : (
            <button onClick={onSave} disabled={saving || !confirmed}
              title={!confirmed ? 'Selecciona la respuesta correcta primero' : ''}
              className={clsx(
                'btn-primary text-xs py-2 px-4 flex items-center gap-1.5',
                !confirmed && 'opacity-50 cursor-not-allowed',
              )}>
              {saving ? <Spinner size="sm" /> : <><Save size={13} /> Guardar</>}
            </button>
          )}
        </div>
      </div>

      {!confirmed && !q._saved && (
        <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
          <AlertTriangle size={10} />
          Haz clic en A, B, C o D para confirmar la respuesta correcta
        </p>
      )}
    </div>
  )
}

// ── Edit panel ─────────────────────────────────────────────────────────────

function EditPanel({ q, onUpdate, onClose }: {
  q: OCRQuestion; onUpdate: (q: OCRQuestion) => void; onClose: () => void
}) {
  const [local, setLocal] = useState<OCRQuestion>(q)
  return (
    <div className="border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text)] flex items-center gap-2">
          <Edit3 size={14} /> Editar pregunta
        </span>
        <button onClick={onClose} className="btn-ghost p-1"><X size={14} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Área</label>
          <select className="input text-sm" value={local.area}
            onChange={(e) => setLocal({ ...local, area: e.target.value as QuestionArea })}>
            {AREAS.map((a) => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Dificultad (1–5)</label>
          <select className="input text-sm" value={local.difficulty}
            onChange={(e) => setLocal({ ...local, difficulty: e.target.value })}>
            {['1', '2', '3', '4', '5'].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label text-xs">Enunciado</label>
        <textarea className="input text-sm resize-none" rows={3}
          value={local.enunciado}
          onChange={(e) => setLocal({ ...local, enunciado: e.target.value })} />
      </div>

      {(['A', 'B', 'C', 'D'] as const).map((l) => (
        <div key={l} className="flex items-center gap-2">
          <span className="w-6 h-6 bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{l}</span>
          <input className="input text-sm flex-1"
            value={local[`opcion_${l.toLowerCase()}` as keyof OCRQuestion] as string}
            onChange={(e) => setLocal({ ...local, [`opcion_${l.toLowerCase()}`]: e.target.value })} />
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
        <button onClick={() => { onUpdate(local); onClose() }} className="btn-primary text-xs">
          Aplicar cambios
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TeacherImport() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [questions, setQuestions] = useState<OCRQuestion[]>([])
  const [ocrText, setOcrText] = useState('')
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload')
  const [current, setCurrent] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const savedCount = questions.filter((q) => q._saved).length

  const selectFile = (f: File) => {
    setFile(f)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
    setQuestions([])
    setOcrText('')
    setStep('upload')
    setCurrent(0)
    setEditing(false)
  }

  const handleProcess = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const res = await aiApi.ocrImport(file)
      setOcrText(res.ocr_text ?? '')
      setQuestions(res.preguntas ?? [])
      setStep('review')
      setCurrent(0)
      setEditing(false)
      toast.success(`${res.total} pregunta(s) detectadas`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Error procesando el archivo')
    } finally {
      setProcessing(false)
    }
  }

  const handleSaveQuestion = async (index: number) => {
    const q = questions[index]
    const answer = q._teacherAnswer !== undefined ? q._teacherAnswer : q.respuesta_correcta
    if (!answer) { toast.error('Selecciona la respuesta correcta primero'); return }

    setSaving(true)
    try {
      await aiApi.saveOcrQuestion({
        enunciado: q.enunciado,
        opcion_a: q.opcion_a, opcion_b: q.opcion_b,
        opcion_c: q.opcion_c, opcion_d: q.opcion_d,
        respuesta_correcta: answer,
        area: q.area,
        difficulty: q.difficulty,
        latex_content: q.latex_content,
      })

      setQuestions((qs) => qs.map((x, i) => i === index ? { ...x, _saved: true, _error: undefined } : x))
      qc.invalidateQueries({ queryKey: ['questions'] })
      toast.success('Pregunta guardada como borrador')

      // Auto-advance to next unsaved question
      const next = questions.findIndex((x, i) => i > index && !x._saved)
      if (next !== -1) {
        setTimeout(() => { setCurrent(next); setEditing(false) }, 350)
      } else {
        const allSaved = questions.every((x, i) => i === index || x._saved)
        if (allSaved) setTimeout(() => setStep('done'), 400)
      }
    } catch {
      setQuestions((qs) => qs.map((x, i) => i === index ? { ...x, _error: 'Error al guardar' } : x))
      toast.error('Error al guardar la pregunta')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    const unsaved = questions.map((q, i) => ({ q, i })).filter(({ q }) => !q._saved)
    for (const { i } of unsaved) await handleSaveQuestion(i)
  }

  const updateQuestion = (index: number, updated: OCRQuestion) =>
    setQuestions((qs) => qs.map((x, i) => i === index ? updated : x))

  const setAnswer = (index: number, letter: string) =>
    setQuestions((qs) => qs.map((x, i) => i === index ? { ...x, _teacherAnswer: letter, _saved: false } : x))

  const removeQuestion = (index: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== index))
    setCurrent((c) => Math.min(c, questions.length - 2))
    setEditing(false)
  }

  const reset = () => {
    setFile(null); setPreview(null); setQuestions([])
    setOcrText(''); setStep('upload'); setCurrent(0); setEditing(false)
  }

  const q = questions[current]

  const pipelineSteps = [
    { n: 1, label: 'Subir archivo' },
    { n: 2, label: 'OCR + IA' },
    { n: 3, label: 'Revisar' },
    { n: 4, label: 'Guardar' },
  ]

  return (
    <AppLayout>
      <TopHeader
        title="Importar Preguntas"
        subtitle="Sube imágenes o PDFs y extrae preguntas automáticamente con IA"
      />

      {/* Pipeline indicator */}
      <div className="card mb-6">
        <div className="flex items-center">
          {pipelineSteps.map((s, i, arr) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div className={clsx(
                  'w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0',
                  (step === 'upload' && s.n === 1) || (step === 'review' && s.n <= 3) || step === 'done'
                    ? 'bg-blue-600 text-white' : 'bg-[var(--surface-2)] text-[var(--text-subtle)]',
                )}>{s.n}</div>
                <span className="text-xs text-[var(--text-muted)] hidden sm:block">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="w-8 h-0.5 bg-slate-200 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── UPLOAD ── */}
      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <Upload size={16} /> Subir archivo
              </h3>
              <div
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) selectFile(f) }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed p-8 text-center cursor-pointer transition-all',
                  file ? 'border-blue-400 bg-blue-50' : 'border-[var(--border)] hover:border-blue-400 hover:bg-[var(--surface-2)]',
                )}>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden" onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])} />
                {file ? (
                  <div>
                    <FileImage size={32} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-sm font-medium text-[var(--text)]">{file.name}</p>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-600">Arrastra o haz clic</p>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">JPG, PNG, WEBP, PDF</p>
                  </div>
                )}
              </div>

              {preview && (
                <div className="mt-3 overflow-hidden border border-[var(--border)]">
                  <img src={preview} alt="Vista previa" className="w-full max-h-48 object-contain bg-[var(--surface-2)]" />
                </div>
              )}

              {file && (
                <button onClick={handleProcess} disabled={processing} className="btn-primary w-full justify-center mt-4">
                  {processing ? <><Spinner size="sm" /> Procesando con IA...</> : <><Wand2 size={16} /> Extraer preguntas con IA</>}
                </button>
              )}
            </div>

            <div className="card bg-[var(--surface-2)] border-[var(--border)]">
              <h4 className="font-semibold text-slate-700 mb-3 text-sm">¿Cómo funciona?</h4>
              <ol className="space-y-2">
                {[
                  'Sube una imagen o PDF con preguntas',
                  'OCR extrae el texto del documento',
                  'La IA detecta y estructura cada pregunta',
                  'Confirma o cambia la respuesta sugerida',
                  'Las preguntas quedan guardadas como borradores',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                    <span className="w-4 h-4 bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <FileImage size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-[var(--text-subtle)] font-medium">Sube un archivo para comenzar</p>
                <p className="text-xs text-slate-300 mt-1">Las preguntas extraídas aparecerán aquí</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <FileImage size={16} className="text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{file?.name}</p>
                  <p className="text-xs text-[var(--text-subtle)]">{questions.length} pregunta(s) detectada(s)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={reset} className="btn-secondary text-xs flex-1 justify-center">
                  <RefreshCw size={12} /> Nuevo archivo
                </button>
                {questions.some((q) => !q._saved) && (
                  <button onClick={handleSaveAll} className="btn-primary text-xs flex-1 justify-center">
                    <CheckCircle2 size={12} /> Guardar todas
                  </button>
                )}
              </div>
            </div>

            {questions.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-sm text-[var(--text)] mb-3">Preguntas</h4>
                <QuestionNav
                  questions={questions} current={current}
                  onSelect={(i) => { setCurrent(i); setEditing(false) }}
                />
              </div>
            )}

            {ocrText && (
              <div className="card">
                <h4 className="font-semibold text-slate-700 mb-2 text-sm flex items-center gap-2">
                  <FileText size={14} /> Texto OCR detectado
                </h4>
                <p className="text-xs text-[var(--text-muted)] font-mono bg-[var(--surface-2)] p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {ocrText}
                </p>
              </div>
            )}
          </div>

          {/* Right: canvas */}
          <div className="lg:col-span-3">
            {questions.length === 0 ? (
              <div className="card flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <AlertTriangle size={32} className="mx-auto text-amber-400 mb-3" />
                  <p className="text-slate-600 font-medium">No se detectaron preguntas</p>
                  <p className="text-xs text-[var(--text-subtle)] mt-1">Intenta con una imagen más clara o con mejor contraste.</p>
                </div>
              </div>
            ) : q ? (
              <div>
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs text-[var(--text-muted)]">
                    Pregunta {current + 1} de {questions.length}
                  </span>
                  {!q._saved && (
                    <button
                      onClick={() => setEditing((e) => !e)}
                      className={clsx(
                        'btn-ghost text-xs py-1 px-2 flex items-center gap-1',
                        editing && 'bg-blue-50 text-blue-600',
                      )}>
                      <Edit3 size={12} /> {editing ? 'Cerrar editor' : 'Editar texto'}
                    </button>
                  )}
                </div>

                {editing ? (
                  <EditPanel
                    q={q}
                    onUpdate={(updated) => updateQuestion(current, updated)}
                    onClose={() => setEditing(false)}
                  />
                ) : (
                  <QuestionCanvas q={q} index={current} />
                )}

                <AnswerBar
                  q={q}
                  onAnswer={(l) => setAnswer(current, l)}
                  onSave={() => handleSaveQuestion(current)}
                  onRemove={() => removeQuestion(current)}
                  saving={saving}
                />

                {/* Prev / Next */}
                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setEditing(false) }}
                    disabled={current === 0}
                    className="btn-secondary text-xs disabled:opacity-30">
                    <ChevronLeft size={13} /> Anterior
                  </button>
                  <button
                    onClick={() => { setCurrent((c) => Math.min(questions.length - 1, c + 1)); setEditing(false) }}
                    disabled={current === questions.length - 1}
                    className="btn-secondary text-xs disabled:opacity-30">
                    Siguiente <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 'done' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h3 className="font-display text-xl text-[var(--text)] mb-2">¡Importación completada!</h3>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            {savedCount} pregunta(s) guardadas como borradores en el banco de preguntas.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-secondary">Importar más</button>
            <a href="/teacher/questions" className="btn-primary">
              Ver banco de preguntas <ArrowRight size={15} />
            </a>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
