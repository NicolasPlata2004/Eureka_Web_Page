/**
 * StudentExam Component
 *
 * Controlador de la "Evaluación Adaptativa".
 * Recibe variables en la URL (ej. ?area=Sociales&topic=Historia) y renderiza
 * la serie matemática de preguntas filtradas.
 * 
 * Se intercomunica intensivamente con `useProgress` interactuando y alterando
 * el nivel de Dificultad conforme el estudiante se equivoca.
 */
import React, { useState, useEffect } from 'react';
import { Lightbulb, PlayCircle, ChevronRight, ChevronLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';

export default function StudentExam() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get('subject') || 'General';
  const topic = searchParams.get('topic') || 'Práctica Libre';

  const { getQuestionsWithDynamicDifficulty, recordAttempt, markTopicCompleted } = useProgress();
  const allQuestions = getQuestionsWithDynamicDifficulty();

  // Filtrado de mockDB: Buscar preguntas que coincidan con el área o subtema. 
  // Al ser mock, si no hay exactas, se muestran generales del área.
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Normalizar para comparación
    const subNorm = subject.toLowerCase().replace('á', 'a').replace('é', 'e').replace('í', 'i');
    
    let filtered = allQuestions.filter(q => {
      const qAreaNorm = q.area.toLowerCase().replace('á', 'a').replace('é', 'e').replace('í', 'i');
      return qAreaNorm.includes(subNorm) || subNorm.includes(qAreaNorm);
    });

    if (filtered.length === 0) {
      // Fallback a banco general si no hay del área
      filtered = allQuestions.slice(0, 5);
    }
    setQuestions(filtered);
  }, [subject, topic]); // Remount filtering

  if (questions.length === 0) return <div className="p-12 text-center text-texto-pizarra font-bold">Cargando Banco Adaptativo...</div>;

  const question = questions[currentQuestionIndex];

  const handleOptionSelect = (optionId) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };

  const isCorrect = (optionId) => {
    const opt = question.options.find(o => o.id === optionId);
    return opt?.isCorrect;
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    // Disparar lógica adaptativa
    recordAttempt(question.id, isCorrect(selectedOption));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      // ¡Finalizó el modulo!
      markTopicCompleted(topic);
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-fondo-crema flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full border border-borde-azul/20">
          <div className="w-24 h-24 bg-accion-verde/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-accion-verde" />
          </div>
          <h2 className="text-3xl font-black text-texto-pizarra mb-4">¡Tema Completado!</h2>
          <p className="text-texto-pizarra/80 mb-8 font-medium">Has superado todas las preguntas del módulo: <br/><strong className="text-borde-azul">{topic}</strong></p>
          <p className="text-xs text-acento-naranja font-bold mb-8 uppercase tracking-wider">El motor de dificultad ha registrado tu precisión.</p>
          <button 
            onClick={() => navigate('/exam')}
            className="w-full bg-borde-azul text-white py-4 rounded-xl font-bold hover:bg-borde-azul/90 transition-transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20}/> Volver al Temario Principal
          </button>
        </div>
      </div>
    );
  }

  const { attempts, fails } = question.userStats;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="bg-borde-azul text-white py-3 px-6 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/exam" className="font-extrabold tracking-wide text-lg hover:text-acento-naranja transition-colors">&larr; Temario</Link>
          <div className="h-6 w-px bg-white/30 truncate"></div>
          <span className="font-semibold truncate max-w-[200px] md:max-w-md">{subject} &bull; <span className="font-normal opacity-80">{topic}</span></span>
        </div>
        <div className="font-mono bg-white/20 px-3 py-1 rounded-md text-sm whitespace-nowrap">
          {currentQuestionIndex + 1} / {questions.length}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 flex flex-col md:flex-row gap-12">
        {/* Left Column: Question & Content */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className={"inline-block border px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase " + 
               (question.dynamicDifficulty >= 70 ? 'bg-red-50 text-red-600 border-red-200' : 
                question.dynamicDifficulty >= 40 ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                'bg-green-50 text-green-600 border-green-200')}>
              Dificultad Dinámica: {question.dynamicDifficulty}%
            </span>
            {attempts > 0 && (
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                <RefreshCw size={12}/> Tu historial: {attempts} intentos, {fails} fallos.
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-texto-pizarra leading-relaxed mb-6">
            {question.text}
          </h2>
          
          {question.imageUrl && (
            <div className="my-6 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden p-4 bg-gray-50 flex justify-center">
              <img src={question.imageUrl} alt="Gráfica de apoyo" className="max-w-full h-auto object-contain max-h-[350px] shadow-sm rounded-lg" />
            </div>
          )}

          {/* Help Section */}
          <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col gap-4">
            {!showHint ? (
              <button 
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 text-borde-azul hover:text-borde-azul/80 font-bold self-start transition-colors"
              >
                <Lightbulb size={20} />
                Obtener una pista analítica
              </button>
            ) : (
              <div className="bg-fondo-crema/50 border-l-4 border-acento-naranja p-4 rounded-r-lg animate-in fade-in slide-in-from-left-4">
                <p className="font-medium text-texto-pizarra"><span className="font-bold text-acento-naranja">Pista del sistema:</span> {question.hint}</p>
              </div>
            )}

            {isAnswered && !isCorrect(selectedOption) && question.videoUrl && (
              <div className="mt-4 border border-borde-azul/20 rounded-xl p-4 bg-gray-50 flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4">
                <PlayCircle className="text-accion-verde flex-shrink-0 mt-1" size={24} />
                <div className="w-full">
                  <h4 className="font-bold text-texto-pizarra text-sm">Refuerzo en Video</h4>
                  <p className="text-xs text-texto-pizarra/70 mb-3">Revisa este concepto clave para mejorar tu precisión.</p>
                  {question.videoUrl.includes('youtube') ? (
                    <iframe 
                      width="100%" 
                      height="180" 
                      src={question.videoUrl} 
                      title="Video Refuerzo" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="rounded-lg shadow-sm"
                    ></iframe>
                  ) : (
                     <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center text-gray-500 font-bold text-sm">Video de refuerzo no disponible para este mock.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Options & Actions */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let stateClass = "border-gray-200 hover:border-borde-azul text-texto-pizarra";
              let Icon = null;

              if (isAnswered) {
                if (opt.isCorrect) {
                  stateClass = "border-accion-verde bg-accion-verde/10 text-accion-verde font-semibold";
                  Icon = <CheckCircle size={24} className="text-accion-verde absolute right-4 animate-in zoom-in" />;
                } else if (isSelected && !opt.isCorrect) {
                  stateClass = "border-red-400 bg-red-50 text-red-600 font-semibold";
                  Icon = <XCircle size={24} className="text-red-500 absolute right-4 animate-in zoom-in" />;
                } else {
                  stateClass = "border-gray-100 opacity-50";
                }
              } else if (isSelected) {
                stateClass = "border-borde-azul bg-borde-azul/5 ring-2 ring-borde-azul ring-offset-1 font-semibold";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleOptionSelect(opt.id)}
                  disabled={isAnswered}
                  className={"relative text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 " + stateClass}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full border border-current font-bold flex-shrink-0">
                    {opt.id}
                  </span>
                  <span className="text-lg flex-1 pr-8">{opt.text}</span>
                  {Icon}
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            {!isAnswered ? (
              <button 
                onClick={handleCheckAnswer}
                disabled={!selectedOption}
                className={"w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md " + 
                  (!selectedOption ? "bg-gray-200 text-gray-400" : "bg-accion-verde text-white hover:bg-accion-verde/90 hover:scale-[1.02] active:scale-95")}
              >
                Comprobar
              </button>
            ) : (
              <button 
                onClick={handleNextQuestion}
                className="w-full bg-borde-azul text-white py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-md flex justify-center items-center gap-2 animate-in fade-in"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Tema'}
                <ChevronRight size={24} />
              </button>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
