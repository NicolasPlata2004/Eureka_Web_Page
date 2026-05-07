# IA, OCR Y Personalizacion

La IA debe ser una capa de productividad y aprendizaje, no una caja negra que publica contenido sin control. En colegios, confianza y trazabilidad importan tanto como velocidad.

## Casos de uso IA para V1

P0:

- OCR/extraccion de preguntas desde PDF o imagen.
- Clasificacion de pregunta por area, competencia, componente y dificultad.
- Generacion de explicacion pedagogica por pregunta.
- Generacion de preguntas de practica como borrador para docente.

P1:

- Practicas personalizadas por estudiante segun desempeno.
- Tutor IA en resultados: pistas, explicaciones y preguntas socraticas.
- Recomendaciones de intervencion para docente.

P2:

- Plan de estudio semanal adaptativo.
- Prediccion de riesgo.
- Estimacion de puntaje tipo ICFES.
- Calibracion por TRI/IRT.

## Pipeline OCR recomendado

### 1. Upload y persistencia

- El docente sube PDF/JPG/PNG/WebP.
- El archivo original se guarda en MinIO/S3.
- Se crea `ImportJob` con estado `uploaded`.
- Se calcula hash para evitar duplicados.

### 2. Normalizacion

- Si es PDF, convertir cada pagina a imagen.
- Guardar cada pagina como `ImportPage`.
- Aplicar preprocesamiento: rotacion, contraste, binarizacion, deskew y recorte de margenes.
- Guardar preview de pagina para revision.

### 3. Extraccion hibrida

Para V1, usar una estrategia hibrida:

- OCR local rapido con Tesseract para texto base.
- Modelo multimodal para paginas con tablas, graficos, formulas o mala calidad.
- Heuristicas para separar preguntas por numeracion, opciones A/B/C/D y solucionario.

El flujo actual solo usa Tesseract sobre una imagen. Eso no basta para PDF multipagina ni graficos complejos.

### 4. Estructuracion

La IA devuelve JSON estricto:

```json
{
  "questions": [
    {
      "number": 1,
      "statement": "...",
      "options": [
        { "letter": "A", "content": "...", "content_type": "text" }
      ],
      "suggested_answer": "B",
      "answer_confidence": 0.72,
      "area": "matematicas",
      "competencia": "...",
      "componente": "...",
      "difficulty": "3",
      "attachments": [
        { "kind": "image", "page": 1, "bbox": [10, 20, 300, 180] }
      ],
      "warnings": ["respuesta_correcta_inferida"]
    }
  ]
}
```

Regla: si la respuesta fue inferida por IA y no venia marcada en el documento, debe aparecer como sugerencia con alerta.

### 5. Revision humana

UI recomendada:

- Izquierda: pagina original con zoom.
- Derecha: pregunta estructurada editable.
- Navegador de preguntas.
- Indicadores de confianza y alertas.
- Botones: guardar borrador, descartar, unir/separar pregunta.
- Accion final: publicar borradores aprobados.

### 6. Publicacion

- Las preguntas guardadas entran como `borrador`.
- El docente/admin aprueba manualmente.
- Se conserva relacion con `ImportJob` y pagina fuente.

## Manejo de tablas, graficos e imagenes

Para V1:

- Si la tabla se extrae con alta confianza, renderizar como Markdown/HTML table o LaTeX.
- Si la tabla es compleja, conservar recorte de imagen y asociarlo como adjunto.
- Si hay grafico, conservar imagen. La IA puede generar descripcion, pero no reemplazar el grafico.
- Si hay formulas, permitir LaTeX y preview con KaTeX.

No intentar "reconstruir perfecto" todos los graficos en 2 semanas. El objetivo es que el examen digital sea usable y fiel.

## Personalizacion por estudiante

### Datos de entrada

- Ultimos intentos completados.
- Acierto por area.
- Acierto por competencia/componente.
- Preguntas falladas.
- Tiempo por pregunta.
- Dificultad de preguntas falladas.
- Historial de recomendaciones abiertas.

### V1 simple

Crear practica personalizada con:

- 2 areas mas debiles.
- 5 a 10 preguntas aprobadas del banco.
- Dificultad alrededor del nivel actual.
- Explicaciones al final.
- Mensaje claro: "Tu prioridad hoy es Lectura Critica: inferencias y estructura argumentativa".

### Algoritmo MVP

1. Calcular promedio por area en ultimos 3 intentos.
2. Seleccionar areas por menor promedio.
3. Dentro de esas areas, elegir competencias con mas errores.
4. Seleccionar preguntas no vistas o falladas antes.
5. Mezclar dificultad: 60% nivel actual, 30% un nivel menor, 10% un nivel mayor.
6. Generar resumen de objetivo de practica.

Esto es suficientemente util para V1 sin prometer adaptatividad sofisticada.

## Tutor IA

### Modo recomendado para V1

Tutor en revision post-examen, no durante modo serio:

- El estudiante ve una pregunta fallada.
- Puede pedir explicacion.
- La IA primero pregunta que entendio.
- Da pista breve.
- Explica el concepto.
- Solo revela solucion completa si el estudiante lo pide o tras una pista.

### Guardrails

- No inventar datos externos.
- No contradecir la respuesta validada por docente.
- No decir que el puntaje predice el ICFES real.
- No humillar ni etiquetar al estudiante.
- Si hay baja confianza en OCR, decir que el docente debe revisar.
- Guardar sesion para auditoria docente.

## Proveedores IA

El repo ya soporta OpenAI, Anthropic, Gemini y DeepSeek a nivel inicial. Mantener adaptador multiproveedor, pero para V1 escoger un proveedor principal por calidad de vision/OCR y un fallback textual.

Criterios de decision:

- Calidad en documentos escaneados.
- JSON estructurado confiable.
- Costo por pagina.
- Latencia.
- Manejo de imagenes/tablas.
- Politicas de privacidad para datos de menores.
- Disponibilidad en Colombia/region de despliegue.

## Medicion de calidad OCR/IA

Crear set de prueba con 5 examenes reales:

- PDF digital limpio.
- Foto de celular.
- Escaneo torcido.
- Preguntas con tabla.
- Preguntas con grafico/imagen.

Medir:

- Preguntas detectadas / preguntas reales.
- Opciones detectadas correctamente.
- Respuesta correcta detectada o marcada como desconocida.
- Area/competencia razonable.
- Tiempo de procesamiento.
- Porcentaje de preguntas que docente puede publicar con edicion menor.

Meta V1: 80% de preguntas publicables con revision humana en documentos de calidad media. Para documentos malos, prometer asistencia, no automatizacion perfecta.

## Privacidad y menores

Fuente SIC: https://www.sic.gov.co/preguntas-frecuentes-pdp

La SIC recuerda que los datos personales de menores tienen proteccion especial y que su tratamiento esta prohibido salvo excepciones bajo interes superior, respeto de derechos y autorizacion correspondiente del representante legal. Para Eureka:

- Minimizar datos personales.
- No enviar datos identificables a proveedores IA si no es necesario.
- Separar contenido academico de identidad.
- Tener autorizaciones/politica de tratamiento de datos.
- Permitir exportacion y eliminacion.
- Registrar subencargados/proveedores.
- Evitar usar datos de estudiantes para entrenar modelos sin autorizacion explicita.

