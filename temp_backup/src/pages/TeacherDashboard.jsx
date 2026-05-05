/**
 * TeacherDashboard Component
 * 
 * Este componente permite a los profesores subir imágenes de exámenes o preguntas.
 * 1. Uso de 'react-image-crop' para permitir al docente focalizar visuales o textos.
 * 2. Integración de 'Tesseract.js' (OCR offline local) para leer texto de imágenes.
 * 3. Motor de parsing (regex por indexación) para dividir el resultado OCR en
 *    Enunciado, Opción A, Opción B, Opción C y Opción D.
 */
import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, Image as ImageIcon, CheckCircle, Loader2, Scissors, Save } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [extractedText, setExtractedText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState('');

  const parseOCRText = (rawText) => {
    // Array de expresiones regulares robustas para atrapar opciones en OCR ruidoso
    // Busca A, B, C o D seguido de punto, paréntesis o guión. 
    const patterns = [
      { key: 'A', regex: /(?:^|\s)[Aa]\s*[.)\-]\s*/ },
      { key: 'B', regex: /(?:^|\s)[Bb]\s*[.)\-]\s*/ },
      { key: 'C', regex: /(?:^|\s)[Cc]\s*[.)\-]\s*/ },
      { key: 'D', regex: /(?:^|\s)[Dd]\s*[.)\-]\s*/ },
    ];

    let questionText = rawText;
    let optA = '', optB = '', optC = '', optD = '';
    
    // Find all matches and their indices
    const indices = [];
    patterns.forEach(p => {
      const match = rawText.match(p.regex);
      if (match) {
        indices.push({ key: p.key, index: match.index, length: match[0].length });
      }
    });

    // Extract substrings based on found options
    if (indices.length > 0) {
      indices.sort((a, b) => a.index - b.index);
      
      questionText = rawText.substring(0, indices[0].index).trim();
      
      for (let i = 0; i < indices.length; i++) {
        const start = indices[i].index + indices[i].length;
        const end = i < indices.length - 1 ? indices[i+1].index : rawText.length;
        const content = rawText.substring(start, end).trim();
        
        if (indices[i].key === 'A') optA = content;
        if (indices[i].key === 'B') optB = content;
        if (indices[i].key === 'C') optC = content;
        if (indices[i].key === 'D') optD = content;
      }
    }

    setExtractedText(questionText);
    setOptionA(optA);
    setOptionB(optB);
    setOptionC(optC);
    setOptionD(optD);
  };

  const processImage = async (imgSource) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const result = await Tesseract.recognize(
        imgSource,
        'spa',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(parseInt(m.progress * 100));
            }
          }
        }
      );
      parseOCRText(result.data.text);
    } catch (err) {
      console.error(err);
      setExtractedText('Error al procesar la imagen.');
    }
    setIsProcessing(false);
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const cropImage = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      const base64Image = canvas.toDataURL('image/jpeg');
      setCroppedImageUrl(base64Image);
    }
  };

  return (
    <div className="min-h-screen bg-fondo-crema flex flex-col font-sans">
      <header className="bg-white border-b border-borde-azul/20 py-4 px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-borde-azul rounded-full flex items-center justify-center text-white font-bold">TIC</div>
          <div>
            <h1 className="font-bold text-texto-pizarra">Panel Docente</h1>
            <p className="text-xs text-accion-verde font-semibold">Digitalización OCR Inteligente</p>
          </div>
        </div>
        <Link to="/" className="text-sm font-medium text-texto-pizarra hover:text-borde-azul">Volver al Inicio</Link>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload and Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-borde-azul/10 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-texto-pizarra mb-2 flex items-center gap-2">
            <ImageIcon size={20} className="text-borde-azul" />
            Cargar Imagen del Examen
          </h2>
          <p className="text-sm text-texto-pizarra/70 mb-4 leading-tight">
            Sube el archivo. Si la pregunta tiene una gráfica, <b>clic en el botón de Tijeras</b> para recortar esa porción y anexarla como recurso visual, antes de extraer el texto.
          </p>

          {!image ? (
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-borde-azul/30 rounded-xl bg-fondo-crema/20 hover:bg-fondo-crema/50 cursor-pointer transition-colors p-12 text-center">
              <Upload className="text-borde-azul mb-4" size={48} />
              <p className="font-medium text-texto-pizarra mb-1">Haz clic para subir o arrastra la imagen</p>
              <p className="text-xs text-texto-pizarra/60">Formatos soportados: JPG, PNG</p>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="border border-borde-azul/20 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2 max-h-[50vh] overflow-y-auto relative group">
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                  <img src={image} ref={imgRef} alt="Upload" className="max-w-full h-auto object-contain" />
                </ReactCrop>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => processImage(image)} 
                  disabled={isProcessing}
                  className="flex-1 bg-borde-azul text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-borde-azul/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  {isProcessing ? 'Procesando (' + progress + '%)...' : 'Extraer Todo el Texto (OCR)'}
                </button>
                <button 
                  onClick={cropImage}
                  className="bg-acento-naranja text-texto-pizarra px-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-acento-naranja/80 shadow-sm transition-colors"
                  title="Recortar grafica seleccionada para adjuntarla como visual de la pregunta"
                >
                  <Scissors size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Processing Results & Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-borde-azul/10 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-texto-pizarra mb-4">Datos Extraídos</h2>
          
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-semibold text-texto-pizarra mb-1">Enunciado de la Pregunta</label>
              <textarea 
                className="w-full border border-borde-azul/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-accion-verde focus:border-transparent outline-none resize-y min-h-[120px]"
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="El texto OCR aparecerá aquí..."
              />
            </div>
            
            {croppedImageUrl && (
              <div className="animate-in fade-in zoom-in duration-300">
                <label className="block text-sm font-semibold text-texto-pizarra mb-1">Recurso Visual Asignado</label>
                <div className="border-2 border-dashed border-accion-verde/30 p-2 rounded-lg bg-fondo-crema/30 inline-block relative">
                  <span className="absolute -top-3 -right-3 bg-accion-verde text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full shadow-sm">Recorte Exitoso</span>
                  <img src={croppedImageUrl} alt="Cropped" className="max-h-32 rounded" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-texto-pizarra mb-1">Opción A</label>
                <textarea 
                  className="w-full border border-borde-azul/30 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-accion-verde focus:border-transparent outline-none" 
                  rows={2}
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Texto A..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-texto-pizarra mb-1">Opción B</label>
                <textarea 
                  className="w-full border border-borde-azul/30 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-accion-verde focus:border-transparent outline-none" 
                  rows={2}
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Texto B..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-texto-pizarra mb-1">Opción C</label>
                <textarea 
                  className="w-full border border-borde-azul/30 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-accion-verde focus:border-transparent outline-none" 
                  rows={2}
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="Texto C..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-texto-pizarra mb-1">Opción D</label>
                <textarea 
                  className="w-full border border-borde-azul/30 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-accion-verde focus:border-transparent outline-none" 
                  rows={2}
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="Texto D..." 
                />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-borde-azul/10">
              <button className="w-full bg-accion-verde text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-accion-verde/90 shadow-md transition-colors">
                <Save size={20} />
                Guardar Pregunta en Banco
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
