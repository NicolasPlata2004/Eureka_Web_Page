# Backlog Funcional V1

Este backlog esta organizado por problema real, no por ideas sueltas. Las prioridades:

- P0: indispensable para demo vendible en colegios.
- P1: aumenta valor si P0 esta estable.
- P2: despues del piloto.

## Administrador Del Colegio

### Problema: preparar el colegio sin depender del equipo tecnico

P0:

- Crear usuarios uno a uno con rol estudiante, docente o admin.
- Importar estudiantes por CSV.
- Editar nombre, correo, grado, rol, estado e institucion.
- Activar/desactivar usuarios.
- Crear cursos/grupos por grado y ano.
- Asignar docente responsable a curso.
- Inscribir estudiantes masivamente a un curso.
- Ver resumen de usuarios por rol y curso.

P1:

- Invitaciones por correo con activacion de cuenta.
- Plantilla CSV descargable.
- Validacion de duplicados con reporte de errores.
- Exportar usuarios/cursos.

P2:

- Sincronizacion con SIS/LMS.
- Multi-sede.
- Roles personalizados.

## Docente

### Problema: convertir material existente en evaluaciones digitales

P0:

- Subir PDF o imagen de examen.
- Ver estado de importacion.
- Revisar preguntas detectadas antes de guardar.
- Corregir enunciado, opciones, respuesta, area, competencia y dificultad.
- Ver pagina original junto a pregunta extraida.
- Guardar preguntas como borrador.
- Aprobar preguntas para usar en simulacros.
- Preservar imagenes/graficos como adjuntos cuando la IA no pueda convertirlos con seguridad.

P1:

- Importar solucionario/hoja de respuestas.
- Detectar tablas y renderizarlas como tabla/LaTeX.
- Recortar automaticamente imagenes asociadas a preguntas.
- Bulk approve con alertas de baja confianza.

P2:

- Reconocimiento de marcas en hojas de respuesta.
- Correccion de examenes fisicos respondidos por estudiantes.

### Problema: crear simulacros utiles sin gastar horas

P0:

- Crear simulacro manual seleccionando preguntas.
- Crear simulacro automatico por area/dificultad.
- Asignar simulacro a curso.
- Definir duracion.
- Definir fecha de apertura/cierre.
- Publicar/despublicar.
- Ver preview como estudiante.

P1:

- Modo practica con feedback inmediato.
- Modo serio con feedback al final.
- Reintentos configurables.
- Randomizar orden de preguntas/opciones.
- Generar version corta por area debil del curso.

P2:

- Banco compartido entre colegios.
- Examen adaptativo por IRT/TRI.

### Problema: saber donde intervenir

P0:

- Ver promedio del curso.
- Ver desempeno por area.
- Ver ranking de estudiantes.
- Ver estudiantes con bajo desempeno.
- Ver preguntas mas falladas.
- Ver evolucion semanal.

P1:

- Ver desempeno por competencia/componente.
- Ver grupos especificos dentro de curso.
- Ver recomendaciones de intervencion: "repasar inferencia textual", "practicar proporcionalidad".
- Exportar reporte CSV/PDF.

P2:

- Alertas automaticas por WhatsApp/email institucional.
- Plan de clase generado desde brechas del curso.

## Estudiante

### Problema: practicar como en el examen y no perder avance

P0:

- Ver simulacros asignados.
- Iniciar o continuar intento.
- Responder preguntas con cronometro.
- Navegar entre preguntas.
- Guardar automaticamente.
- Marcar preguntas para revisar.
- Entregar y confirmar.
- Ver resultado global y por area.

P1:

- Ver explicacion por pregunta.
- Ver historial de intentos.
- Recibir practica recomendada por area debil.
- Ver progreso semanal.
- Recibir mini-simulacro personalizado.

P2:

- Metas personales.
- Streaks/gamificacion.
- Comparacion anonima con curso.
- Tutor IA durante practica.

### Problema: entender por que fallo

P0:

- Mostrar respuesta correcta y respuesta dada.
- Mostrar explicacion creada por docente o IA.
- Mostrar area/competencia relacionada.

P1:

- Tutor IA de revision con preguntas guiadas.
- Pistas progresivas antes de revelar solucion.
- Resumen de errores recurrentes.

P2:

- Plan de estudio semanal adaptativo.
- Recomendacion de contenido externo validado por docente.

## Directivo/Coordinador

### Problema: decidir donde invertir refuerzos

P0:

- Dashboard institucional basico.
- Total estudiantes activos, docentes, cursos, simulacros realizados.
- Promedio institucional por area.
- Cursos con peor desempeno.

P1:

- Comparacion por nivel/grado.
- Evolucion por semana.
- Reporte exportable.
- Mapa de riesgo por curso.

P2:

- Benchmark con historico ICFES publico.
- Prediccion de riesgo de bajo puntaje.

## Plataforma/Operacion

### Problema: correr, mantener y depurar sin friccion

P0:

- `.env.example` completo.
- `docker compose up -d --build` funcionando desde cero.
- Seeds demo consistentes.
- Healthchecks.
- Logs claros para API y worker.
- Migraciones Alembic.
- Pruebas backend de permisos/scoring.
- Pruebas e2e del flujo principal.

P1:

- Backups locales.
- Observabilidad basica Prometheus/Grafana.
- Sentry.
- Script de reset demo.

P2:

- CI/CD a servidor.
- Blue/green deploy.
- Multi-tenant billing.

## Tareas tecnicas P0 detalladas

### Seguridad y permisos

- Mover `/users/stats/summary` y `/questions/stats/summary` antes de rutas dinamicas.
- Restringir `/auth/register` o eliminarlo del flujo publico.
- Crear `require_same_institution(resource)` reusable.
- Aplicar filtros `institution_id` a preguntas, examenes, cursos, intentos y analitica.
- Validar que docentes solo gestionen cursos propios o de su institucion.
- Validar que estudiantes solo accedan a examenes asignados.

### Datos y migraciones

- Crear migracion inicial Alembic desde modelos actuales.
- Eliminar dependencia de `Base.metadata.create_all` en produccion.
- Normalizar `difficulty` como string o enum, no ambas.
- Crear tablas nuevas minimas: `exam_assignments`, `import_jobs`, `import_pages`, `question_attachments`, `audit_logs`.
- Agregar indices por `institution_id`, `course_id`, `student_id`, `exam_id`.

### OCR/importacion

- Persistir archivo subido en MinIO.
- Procesar PDF multipagina.
- Crear job asincrono.
- Guardar texto OCR, salida IA, errores y confianza.
- Crear UI de revision.
- Permitir guardar preguntas revisadas.

### Frontend

- Corregir redirect post-login.
- Completar crear usuario en admin.
- Completar import CSV.
- Mejorar lista de examenes asignados.
- Asegurar que exam runner maneje reload/reanudar.
- Agregar estados vacios y errores claros.

### Pruebas

- Backend: auth roles, tenant isolation, exam visibility, scoring, OCR draft save.
- Frontend/e2e: login admin, crear curso, asignar estudiante, crear examen, estudiante responde, docente ve analytics.

