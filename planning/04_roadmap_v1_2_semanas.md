# Roadmap V1 En 2 Semanas

## Objetivo

Llegar a una demo V1 que un colegio pueda entender y probar con un grupo piloto:

- Administra institucion, usuarios y cursos.
- Digitaliza un examen real de papel/PDF.
- Crea y asigna un simulacro.
- Estudiantes presentan el simulacro.
- Docentes y directivos ven analitica accionable.
- IA ayuda a explicar, clasificar y personalizar sin quitar control al profesor.

## Supuestos

- Equipo de 3 personas.
- Se trabaja sobre el stack actual.
- El objetivo es piloto vendible, no certificacion enterprise.
- Se acepta que el puntaje V1 sea porcentaje de acierto, no puntaje ICFES oficial estimado.
- Se usaran datos demo y al menos un examen real provisto por colegio aliado.

## Roles sugeridos del equipo

- Persona A: backend, datos, permisos, scoring, OCR/IA.
- Persona B: frontend, experiencia de estudiante/docente/admin, estados y polish.
- Persona C: QA/producto/infra, seeds, Docker, pruebas e2e, demo y documentacion.

Si una persona es mas fuerte en IA, puede tomar OCR/IA y mover backend de permisos a Persona C. Lo importante es que una sola persona sea integradora diaria para evitar ramas divergentes.

## Semana 1 - Hacer confiable el flujo base

### Dia 1 - Alineacion, seguridad base y entorno

Resultado esperado: cualquier dev puede correr el sistema y no hay huecos obvios de rol.

- Crear `.env.example` raiz y backend.
- Corregir credenciales demo y README.
- Quitar registro publico de docentes/admins.
- Agregar endpoint admin para crear usuarios.
- Corregir rutas `/stats/summary` antes de `/{id}`.
- Crear utilidades de permisos por institucion.
- Definir demo script: institucion, docente, 30 estudiantes, 2 cursos, banco de preguntas.

### Dia 2 - Usuarios, cursos e inscripciones

Resultado esperado: admin puede preparar un colegio piloto.

- CRUD admin de usuarios completo: crear, editar, activar/desactivar.
- Carga CSV de estudiantes y docentes.
- Cursos con docente responsable.
- Inscripcion masiva a curso.
- Validar rol e institucion en inscripciones.
- UI admin usable para importar y revisar errores.

### Dia 3 - Banco de preguntas robusto

Resultado esperado: docente puede crear y revisar preguntas sin romper contenido.

- Formulario de pregunta con competencia, componente, dificultad, etiquetas.
- Soporte de imagen/archivo por pregunta y opcion.
- Estado de revision: borrador, aprobado, archivado.
- Busqueda por area, texto, competencia, estado y fuente.
- Preview fiel con LaTeX, tablas simples e imagenes.
- Bulk approve para preguntas importadas.

### Dia 4 - Constructor y asignacion de examenes

Resultado esperado: docente crea y asigna simulacros.

- Examen manual desde preguntas seleccionadas.
- Examen automatico por distribucion de areas/dificultad.
- Plantilla "Saber 11 corto" y "Saber 11 completo".
- Asignacion a curso, grupo especifico o estudiantes.
- Disponibilidad, duracion, reintentos y visibilidad.
- Validar que estudiantes solo vean asignados/publicos.

### Dia 5 - Experiencia de examen del estudiante

Resultado esperado: el estudiante presenta sin perder datos.

- Lista de examenes asignados.
- Inicio/reanudacion de intento.
- Cronometro, progreso, navegacion por preguntas.
- Guardado automatico de respuestas.
- Marcar pregunta para revisar.
- Confirmacion antes de entregar.
- Entrega y resultado inmediato.
- Mobile/tablet aceptable.

## Semana 2 - Diferenciacion vendible

### Dia 6 - Resultados y analitica accionable

Resultado esperado: estudiante y docente saben que hacer luego.

- Resultado por area, competencia y pregunta.
- Explicacion de respuesta correcta e incorrectas.
- Historial de intentos.
- Ranking y promedio por curso.
- Preguntas mas falladas.
- Estudiantes en riesgo por area.
- Recomendaciones de practica por debilidad.

### Dia 7 - OCR import con revision docente

Resultado esperado: docente sube un PDF/imagen y obtiene borradores revisables.

- Persistir archivo original en MinIO.
- Convertir PDF multipagina a imagenes.
- OCR/vision por pagina.
- Extraer preguntas, opciones, respuesta sugerida, area, dificultad y adjuntos.
- UI de revision con pagina original al lado y pregunta estructurada al lado.
- Guardar borradores aprobados al banco.
- Registrar errores y confianza por pregunta.

### Dia 8 - IA pedagogica controlada

Resultado esperado: IA ayuda al aprendizaje, no solo genera contenido.

- Explicaciones por pregunta en resultados.
- Clasificacion automatica de preguntas importadas.
- Generacion de practica corta personalizada por estudiante.
- Tutor IA modo revision: pregunta socratica y pistas, no respuesta directa al inicio.
- Prompt versioning y registro de `AIJob`.
- Limites de tokens y fallback cuando no hay API key.

### Dia 9 - Admin institucional y demo de colegio

Resultado esperado: directivo entiende valor en 5 minutos.

- Dashboard institucional: usuarios, cursos, intentos, promedio, areas debiles.
- Vista por nivel/grado y curso.
- Export CSV/PDF simple de resultados.
- Semaforo de cursos con mayor riesgo.
- Seed demo realista con datos de varios estudiantes.
- Guion de demo: admin -> docente -> estudiante -> docente -> directivo.

### Dia 10 - QA, polish y entrega piloto

Resultado esperado: se puede mostrar sin disculparse cada 2 minutos.

- Pruebas e2e del flujo principal.
- Tests de backend para permisos, scoring y exam visibility.
- Revisar responsive en laptop/tablet.
- Manejo de errores vacios/cargando.
- Docker clean install probado desde cero.
- Backup/restore local de DB y MinIO.
- README piloto y checklist de despliegue.

## Buffer recomendado

No planear 10 dias llenos al 100%. Reservar al menos 20% para:

- Problemas con OCR en PDFs reales.
- Bugs de permisos multi-institucion.
- Performance de imports grandes.
- Ajustes de UI para demo.
- Cambios de colegio piloto al ver la primera version.

## Corte de alcance

P0 para demo:

- Usuarios/cursos.
- Banco de preguntas.
- Importacion OCR revisable.
- Examen asignado.
- Presentacion de examen.
- Resultados.
- Analitica docente basica.
- Docker.

P1 si alcanza:

- Tutor IA en revision.
- Practicas personalizadas.
- Exportes.
- Dashboard institucional.
- Deteccion basica de integridad.

P2 despues del piloto:

- Estimacion puntaje ICFES.
- TRI/calibracion.
- Integracion Moodle/Classroom.
- App movil nativa.
- Pagos/billing.
- Respuestas abiertas.
- Proctoring avanzado.

## Criterios de salida

La V1 esta lista para mostrar cuando:

- Un colegio demo se puede preparar en menos de 15 minutos.
- Un docente puede importar un examen de 10 a 20 preguntas y publicar al menos 80% despues de revision.
- Un estudiante puede terminar un simulacro sin errores ni perdida de respuestas.
- El docente puede identificar en que area intervenir para un curso.
- El sistema corre con `docker compose up -d --build` usando `.env.example`.
- Hay al menos 5 pruebas backend criticas y 2 flujos e2e.

