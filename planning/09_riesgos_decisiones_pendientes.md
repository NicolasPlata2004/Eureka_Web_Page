# Riesgos Y Decisiones Pendientes

## Riesgos criticos

### 1. Prometer puntaje ICFES estimado sin calibracion

Riesgo: vender una prediccion que no esta validada puede danar confianza.

Mitigacion V1:

- Usar "porcentaje de acierto" y "desempeno por area".
- Si se muestra estimacion, llamarla experimental y ocultarla en venta inicial.
- Guardar datos para calibrar despues.

### 2. OCR imperfecto en examenes reales

Riesgo: documentos de colegios tienen fotos torcidas, PDFs escaneados, tablas y graficos.

Mitigacion:

- Flujo de revision humana obligatorio.
- Guardar recortes de imagen cuando no se pueda reconstruir.
- Medir calidad con documentos reales en la semana 1.
- No prometer "100% automatico".

### 3. Datos de menores y privacidad

Riesgo: el sistema trata datos de estudiantes, probablemente menores de edad.

Mitigacion:

- Politica de tratamiento de datos.
- Contrato colegio como responsable/encargado segun asesoria legal.
- Minimizar datos enviados a IA.
- Auditoria de accesos.
- No usar datos para entrenamiento sin autorizacion.
- Revisar lineamientos de la SIC sobre datos de ninos, ninas y adolescentes: https://www.sic.gov.co/preguntas-frecuentes-pdp

### 4. Copyright y uso de examenes

Riesgo: bancos de preguntas oficiales o de terceros pueden tener derechos reservados.

Mitigacion:

- La plataforma debe permitir que colegios digitalicen material que tengan derecho a usar.
- No vender como "oficial ICFES".
- Crear preguntas originales y registrar fuente.
- Incluir campos de fuente/licencia.
- Pedir confirmacion de derechos al importar.

### 5. Multi-tenant incompleto

Riesgo: un colegio ve datos de otro o un docente accede a recursos externos.

Mitigacion:

- Permission layer antes de avanzar features.
- Tests de aislamiento por institucion.
- Auditoria.
- No crear superadmin en UI hasta tener reglas claras.

### 6. Exceso de features en 2 semanas

Riesgo: terminar con muchas pantallas incompletas.

Mitigacion:

- Priorizar flujo demo P0.
- Cada dia debe cerrar un flujo verificable.
- Cortar P1 si P0 no esta estable.

### 7. Dependencia de proveedores IA

Riesgo: costo, latencia o caidas durante demo.

Mitigacion:

- Fallback sin IA para demo base.
- Cache de resultados OCR demo.
- Variables para cambiar proveedor.
- Limites de tokens por colegio.

## Decisiones pendientes

### Producto

- Nombre comercial: Eureka, Eureka ICFES u otro.
- Se vende solo B2B colegios o tambien B2C estudiantes.
- Para demo, usar "Saber 11" descriptivo sin insinuar afiliacion oficial.
- Que colegios piloto aportaran examenes reales.
- Que metricas convencen al rector: promedio, areas debiles, estudiantes en riesgo, ahorro de tiempo docente.

### Pedagogia

- Taxonomia exacta de competencias/componentes por area.
- Quien valida preguntas generadas por IA.
- Que contenido externo recomendar y quien lo aprueba.
- Como nombrar niveles de dificultad.

### Tecnologia

- Proveedor IA principal para OCR multimodal.
- Celery vs RQ/Arq. Celery es pragmatico porque ya esta en requirements.
- Mantener Tesseract como primer pase o usar vision LLM directamente.
- Definir almacenamiento de imagenes: MinIO local y S3/R2 prod.

### Comercial

- Precio piloto por colegio.
- Limite de estudiantes por plan.
- Limite de importaciones/IA por mes.
- Soporte incluido.
- Contrato de tratamiento de datos.

## No negociables para V1

- Revision humana de preguntas importadas.
- Aislamiento por institucion.
- Guardado automatico del intento de examen.
- Docker reproducible.
- Demo con datos realistas.
- Mensajes honestos sobre IA y puntajes.

## Preguntas para validar con colegios

- Cuantos estudiantes de grado 10/11 preparan actualmente.
- Como preparan ICFES hoy y cuanto cuesta.
- Cuantos simulacros hacen por semestre.
- Tienen examenes propios en PDF/papel.
- Que LMS usan, si usan alguno.
- Que reporte necesita rector/coordinador.
- Que tan importante es que los padres vean resultados.
- Que restricciones tienen sobre datos de estudiantes.
- Quien aprobaria compra: rector, coordinador academico, jefe de area, tecnologia.

## Indicadores de exito del piloto

- Docente importa y publica un examen sin ayuda tecnica.
- Al menos 80% de estudiantes asignados completan un simulacro.
- Docente identifica 3 acciones de refuerzo desde la analitica.
- Estudiantes entienden sus errores con explicaciones.
- Colegio pide segundo grupo piloto o cotizacion.

