import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, CheckCircle } from 'lucide-react';
import { curriculumData } from '../data/curriculum';
import { Link, useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';

export default function StudentSyllabus() {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const navigate = useNavigate();
  const { completedTopics } = useProgress();

  const handleGradeClick = (grade) => {
    setSelectedGrade(grade);
    setExpandedSubject(null);
    setExpandedTopic(null);
  };

  const handleStartPractice = (subject, topicName) => {
    navigate(`/exam/play?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topicName)}`);
  };

  return (
    <div className="min-h-screen bg-fondo-crema font-sans flex flex-col">
      <header className="bg-white border-b border-borde-azul/20 py-4 px-8 shadow-sm sticky top-0 z-50 flex items-center gap-4">
        <Link to="/" className="font-extrabold text-texto-pizarra text-lg hover:text-borde-azul transition-colors">&larr; EUREKA</Link>
        <div className="h-6 w-px bg-borde-azul/30"></div>
        <h1 className="font-bold text-texto-pizarra">Selección de Temario</h1>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 flex flex-col items-center">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-texto-pizarra mb-8">Selecciona tu Grado</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {['9', '10', '11'].map(grade => {
              const baseClass = "relative w-32 h-32 rounded-full flex flex-col items-center justify-center text-3xl font-black transition-all duration-300 shadow-md ";
              const activeClass = selectedGrade === grade 
                  ? "bg-borde-azul text-white scale-110 shadow-xl ring-4 ring-borde-azul/30" 
                  : "bg-white text-texto-pizarra border-4 border-fondo-crema hover:border-borde-azul/40 hover:scale-105";

              return (
                <button
                  key={grade}
                  onClick={() => handleGradeClick(grade)}
                  className={baseClass + activeClass}
                >
                  <span>{grade}°</span>
                  {selectedGrade === grade && (
                    <div className="absolute -bottom-2 w-16 h-2 bg-accion-verde rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedGrade && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-borde-azul/20 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-borde-azul/5 p-6 border-b border-borde-azul/20">
              <h3 className="text-2xl font-bold text-texto-pizarra">Temario Oficial - Grado {selectedGrade}°</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {curriculumData[selectedGrade].map((subjectBlock, subIdx) => (
                <div key={subIdx} className="w-full">
                  <button 
                    onClick={() => setExpandedSubject(expandedSubject === subIdx ? null : subIdx)}
                    className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl font-bold text-texto-pizarra flex items-center gap-3">
                      <BookOpen size={24} className="text-borde-azul" />
                      {subjectBlock.subject}
                    </span>
                    {expandedSubject === subIdx ? <ChevronDown size={28} className="text-borde-azul"/> : <ChevronRight size={28} className="text-gray-400"/>}
                  </button>

                  {expandedSubject === subIdx && (
                    <div className="bg-gray-50/50 px-8 py-4 pb-6 border-t border-b border-gray-100 shadow-inner">
                      <div className="pl-8 flex flex-col gap-4">
                        {subjectBlock.topics.map((topic, topIdx) => {
                          const topicKey = subIdx + "-" + topIdx;
                          const isTopicExpanded = expandedTopic === topicKey;
                          
                          return (
                            <div key={topIdx} className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                               <button 
                                onClick={() => setExpandedTopic(isTopicExpanded ? null : topicKey)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-borde-azul/5 transition-colors font-bold text-texto-pizarra"
                               >
                                  {topic.name}
                                  {isTopicExpanded ? <ChevronDown size={20} className="text-accion-verde"/> : <ChevronRight size={20} className="text-gray-400"/>}
                               </button>

                               {isTopicExpanded && (
                                 <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col gap-3">
                                   {topic.subtopics.map((sub, sIdx) => {
                                     const isCompleted = completedTopics.includes(sub);
                                     return (
                                       <div key={sIdx} className={"flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg hover:bg-fondo-crema transition-colors border-l-4 " + (isCompleted ? "border-accion-verde bg-accion-verde/5" : "border-transparent hover:border-acento-naranja")}>
                                         <span className={"text-sm font-medium flex-1 flex items-center gap-2 " + (isCompleted ? "text-accion-verde font-bold" : "text-texto-pizarra/80")}>
                                           {isCompleted && <CheckCircle size={16} />}
                                           {sub}
                                         </span>
                                         <button 
                                          onClick={() => handleStartPractice(subjectBlock.subject, sub)}
                                          className={"flex items-center gap-2 text-white px-4 py-2 rounded-full font-bold text-sm transition-transform shadow-sm active:scale-95 whitespace-nowrap " + (isCompleted ? "bg-borde-azul hover:bg-borde-azul/90 hover:scale-105" : "bg-accion-verde hover:bg-accion-verde/90 hover:scale-105")}
                                         >
                                           <PlayCircle size={16} /> {isCompleted ? 'Repasar' : 'Practicar'}
                                         </button>
                                       </div>
                                     );
                                   })}
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
