import React from 'react';
import { BookOpen, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import profileImg from '../assets/profile.png';

const profiles = [
  { id: 1, name: 'Dr. Luis Maria Jimenez', role: 'Rector General' },
  { id: 2, name: 'Prof. Ana Silva', role: 'Coordinadora TIC' },
  { id: 3, name: 'Prof. Carlos Ruiz', role: 'Desarrollador Docente' },
  { id: 4, name: 'Prof. Diana Gomez', role: 'Gestora de Contenidos' },
  { id: 5, name: 'Prof. Eduardo Lopez', role: 'Soporte Tecnico' },
  { id: 6, name: 'Prof. Fernando Paz', role: 'Evaluacion Adaptativa' },
];

export default function Landing() {
  return (
    <div className="min-h-screen font-sans bg-fondo-crema">
      <header className="w-full py-4 px-8 flex items-center justify-between border-b border-borde-azul/20 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo IE Luis Maria Jimenez" className="h-16 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-texto-pizarra uppercase">I.E. Luis Maria Jimenez</h1>
            <p className="text-sm font-medium text-accion-verde tracking-widest uppercase">Proyecto EUREKA</p>
          </div>
        </div>
        <nav className="flex gap-6 items-center">
          <Link to="/exam" className="text-texto-pizarra hover:text-accion-verde font-semibold transition-colors">Vista Estudiante</Link>
          <Link to="/teacher" className="flex items-center gap-2 bg-accion-verde text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-accion-verde/90 transition-transform hover:scale-105 active:scale-95">
            <User size={18} />
            Ingreso Docente
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-8 pt-16 pb-24">
        <section className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center justify-center p-3 bg-acento-naranja/30 rounded-full mb-6">
            <BookOpen className="text-acento-naranja w-8 h-8" />
          </div>
          <h2 className="text-5xl font-extrabold text-texto-pizarra mb-6 leading-tight">
            Preparacion ICFES <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accion-verde to-borde-azul">
              Inteligente y Adaptativa
            </span>
          </h2>
          <p className="text-lg text-texto-pizarra/80 mb-10 leading-relaxed font-medium">
            Eureka digitaliza examenes en tiempo real mediante OCR local y analiza metricas 
            para ofrecer rutas de aprendizaje personalizadas para grados 9, 10 y 11.
          </p>
          <Link to="/exam" className="inline-flex items-center gap-2 mx-auto bg-borde-azul text-white px-8 py-3.5 rounded-full font-bold text-lg shadow-lg hover:bg-borde-azul/90 transition-all hover:pr-6 group">
            Conoce el Proyecto
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </section>

        <section className="bg-white rounded-3xl p-12 shadow-sm border border-borde-azul/10 relative overflow-hidden">
          <div className="text-center mb-16 relative z-10">
            <h3 className="text-3xl font-bold text-texto-pizarra mb-2">Equipo Directivo y TIC</h3>
            <div className="w-16 h-1 bg-accion-verde mx-auto rounded-full"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start justify-center relative z-10 w-full">
            <div className="lg:w-5/12 flex border-r-0 lg:border-r border-borde-azul/20 pr-0 lg:pr-8">
              <div className="flex items-center gap-6 group w-full p-6 bg-fondo-crema/50 rounded-2xl border border-borde-azul/10 hover:shadow-md transition-shadow">
                <div className="w-40 h-40 flex-shrink-0 rounded-full p-1 border-4 border-borde-azul bg-white shadow-lg overflow-hidden relative">
                  <img src={profileImg} alt={profiles[0].name} className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 scale-110" />
                </div>
                <div className="text-left">
                  <h4 className="text-2xl font-bold text-texto-pizarra mb-1">{profiles[0].name}</h4>
                  <p className="text-sm font-semibold text-accion-verde uppercase tracking-wide mb-2">{profiles[0].role}</p>
                  <p className="text-sm text-texto-pizarra/70 leading-relaxed">
                    Liderazgo en transposicion didactica y gestion integral del Proyecto EUREKA.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {profiles.slice(1).map((profile) => (
                <div key={profile.id} className="flex items-center gap-5 group p-4 rounded-xl hover:bg-fondo-crema/40 transition-colors border border-transparent hover:border-borde-azul/10">
                  <div className="w-24 h-24 flex-shrink-0 rounded-full p-1 border-[3px] border-borde-azul bg-white overflow-hidden shadow-sm relative">
                    <img src={profileImg} alt={profile.name} className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-lg font-bold text-texto-pizarra leading-tight mb-1">{profile.name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-wider text-accion-verde">{profile.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
