/**
 * Custom Hook: useProgress
 * 
 * Núcleo lógico del "Motor Local de Dificultad".
 * Utiliza LocalStorage para simular una base de datos de usuarios persistente.
 * 
 * Calcula dinámicamente el Machine Learning Cásico:
 * Fórmula = (Fallos / Intentos) * 100
 */
import { useState, useEffect } from 'react';
import { icfesBank } from '../data/mockDb';

const STORAGE_KEY = 'eureka_student_progress';

export function useProgress() {
  const [stats, setStats] = useState({});
  const [completedTopics, setCompletedTopics] = useState([]);

  // Cargar estado inicial de localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStats(parsed.stats || {});
        setCompletedTopics(parsed.completedTopics || []);
      }
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }
  }, []);

  // Sincronizar hacia localStorage automáticamente
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stats,
      completedTopics
    }));
  }, [stats, completedTopics]);

  // Función para registrar intento de respuesta (Acierto o Fallo)
  const recordAttempt = (questionId, isCorrect) => {
    setStats(prev => {
      const currentQStats = prev[questionId] || { attempts: 0, fails: 0 };
      const newAttempts = currentQStats.attempts + 1;
      const newFails = currentQStats.fails + (isCorrect ? 0 : 1);
      
      return {
        ...prev,
        [questionId]: {
          attempts: newAttempts,
          fails: newFails
        }
      };
    });
  };

  // Función para marcar un tema del Syllabus como Completado
  const markTopicCompleted = (topicName) => {
    setCompletedTopics(prev => {
      if (!prev.includes(topicName)) {
        return [...prev, topicName];
      }
      return prev;
    });
  };

  // Obtener preguntas inyectadas con dificultad en tiempo real
  const getQuestionsWithDynamicDifficulty = () => {
    return icfesBank.map(q => {
      const qStats = stats[q.id];
      let dynamicDiff = q.difficulty; // Base difficulty

      // Si tenemos historial, calculamos dificultad viva = (Fallos / Intentos) * 100
      if (qStats && qStats.attempts > 0) {
        dynamicDiff = Math.round((qStats.fails / qStats.attempts) * 100);
      }

      return {
        ...q,
        dynamicDifficulty: dynamicDiff,
        userStats: qStats || { attempts: 0, fails: 0 }
      };
    });
  };

  return {
    recordAttempt,
    markTopicCompleted,
    completedTopics,
    getQuestionsWithDynamicDifficulty
  };
}
