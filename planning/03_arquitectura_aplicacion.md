# Arquitectura De La Aplicacion

## Decision principal

Para la V1, usar un monolito modular con procesos separados:

- `frontend`: React/Vite servido por Nginx.
- `api`: FastAPI para HTTP, autenticacion, permisos y endpoints.
- `worker`: proceso Celery/RQ/Arq para OCR, IA, generacion y analitica pesada.
- `db`: PostgreSQL.
- `redis`: cola y cache.
- `object-storage`: MinIO en local, S3/R2 en produccion.
- `nginx`: reverse proxy, gzip, limites de subida y rate limiting.

Esto mantiene separacion de responsabilidades sin la complejidad de microservicios. El codigo queda preparado para extraer servicios despues, pero el equipo puede moverse rapido.

## Modulos de dominio

### 1. Identidad, instituciones y permisos

Responsabilidad:

- Usuarios, roles, sesiones, invitaciones, recuperacion de contrasena.
- Instituciones, sedes si aplica, plan contratado y configuracion.
- Cursos, grupos, inscripciones y docentes asignados.
- Autorizacion multi-tenant por institucion.

Entidades:

- `Institution`
- `User`
- `RefreshToken`
- `Course`
- `Enrollment`
- `Invitation`
- `AuditLog`

Regla clave: todo recurso escolar debe tener `institution_id` y toda consulta debe filtrar por institucion salvo usuarios superadmin internos.

### 2. Banco de preguntas y contenido

Responsabilidad:

- Crear, editar, aprobar, archivar y buscar preguntas.
- Soportar texto enriquecido, LaTeX, tablas, imagenes, graficos y estimulos compartidos.
- Clasificar por area, competencia, componente, evidencia, dificultad, etiquetas y fuente.

Entidades:

- `Question`
- `QuestionOption`
- `QuestionStimulus`
- `QuestionAttachment`
- `Tag`
- `LearningObjective`
- `QuestionReview`

Recomendacion V1: agregar `attachments` y `stimulus_id`. Muchas preguntas ICFES dependen de un contexto, grafica o tabla compartida; meter todo en `enunciado` hace fragil el OCR y el render.

### 3. Simulacros, asignaciones e intentos

Responsabilidad:

- Crear examenes manuales, automaticos y personalizados.
- Asignar a cursos, grupos especificos o estudiantes.
- Manejar disponibilidad, duracion, modo practica/serio y reintentos.
- Guardar progreso, respuestas, tiempo por pregunta y finalizacion.

Entidades:

- `MockExam`
- `MockExamQuestion`
- `ExamAssignment`
- `Attempt`
- `AttemptAnswer`
- `IntegrityEvent`

Regla clave: un estudiante no debe poder iniciar un examen que no este asignado a su curso, grupo o usuario, salvo examenes publicos de practica.

### 4. Scoring y analitica

Responsabilidad:

- Calcular puntaje por intento.
- Agregar desempeno por estudiante, curso, grupo, nivel e institucion.
- Detectar preguntas mas falladas, competencias debiles, progreso y riesgo.
- Generar reportes para docentes y directivos.

Entidades:

- `Attempt`
- `AttemptAnswer`
- `AnalyticsSnapshot`
- `StudentSkillProfile`
- `RecommendationEvent`

Para V1, el scoring puede quedarse en porcentaje de acierto. Debe nombrarse asi en UI. "Puntaje ICFES estimado" requiere calibracion y no debe prometerse hasta tener banco calibrado o modelo TRI validado.

### 5. Importacion, OCR y revision

Responsabilidad:

- Recibir PDF/imagenes de examenes en papel.
- Convertir paginas a imagenes.
- Extraer texto, tablas, formulas e imagenes.
- Proponer preguntas estructuradas.
- Permitir revision humana antes de guardar.
- Conservar fuente original y trazabilidad.

Entidades:

- `ImportJob`
- `ImportFile`
- `ImportPage`
- `OCRExtraction`
- `QuestionDraft`
- `QuestionDraftAttachment`

Regla clave: la IA no publica preguntas. Solo propone borradores con nivel de confianza y observaciones.

### 6. IA pedagogica

Responsabilidad:

- Generar explicaciones por pregunta.
- Clasificar preguntas.
- Crear practicas personalizadas.
- Sugerir plan de estudio.
- Tutor socratico controlado por contexto.

Entidades:

- `AIJob`
- `AITutorSession`
- `AITutorMessage`
- `PracticeSet`
- `StudyPlan`

Regla clave: cada salida de IA debe guardar proveedor, modelo, prompt version, tokens, input resumido, output y estado. Esto ayuda a depurar calidad y costos.

## Estructura sugerida del backend

```text
backend/app/
  main.py
  core/
    config.py
    database.py
    security.py
    permissions.py
    storage.py
    logging.py
  modules/
    identity/
      models.py
      schemas.py
      repository.py
      service.py
      router.py
    schools/
      models.py
      schemas.py
      repository.py
      service.py
      router.py
    content/
      models.py
      schemas.py
      repository.py
      service.py
      router.py
    assessments/
      models.py
      schemas.py
      repository.py
      scoring.py
      service.py
      router.py
    analytics/
      queries.py
      service.py
      router.py
    imports/
      schemas.py
      ocr_service.py
      extraction_service.py
      review_service.py
      router.py
    ai/
      providers.py
      prompts.py
      json_parser.py
      tutor_service.py
      personalization_service.py
      router.py
  workers/
    app.py
    jobs.py
```

Para no reescribir todo en la semana 1, se puede migrar incrementalmente:

1. Crear `core/permissions.py`, `core/storage.py` y servicios de `assessments`, `imports`, `ai`.
2. Mover logica mas riesgosa primero: permisos, scoring, OCR y generacion IA.
3. Dejar routers actuales como fachada mientras se estabiliza.

## Estructura sugerida del frontend

```text
frontend/src/
  app/
    router.tsx
    queryClient.ts
  features/
    auth/
    admin-users/
    courses/
    question-bank/
    exam-builder/
    exam-taking/
    results/
    teacher-analytics/
    import-ocr/
    student-practice/
  shared/
    api/
    components/
    hooks/
    layout/
    types/
    utils/
```

Principios:

- Feature folders para que cada flujo tenga componentes, hooks y tipos cercanos.
- `shared/api` solo expone clientes typed; no logica de negocio.
- Estados globales minimos: auth, preferencias UI y quiz attempt activo.
- React Query para datos de servidor.

## Patrones utiles sin sobredisenar

- Repository para consultas DB reutilizables y testeables.
- Service para reglas de negocio: permisos, scoring, asignacion, OCR, IA.
- Policy/permission functions para multi-tenant.
- DTO/schemas Pydantic por input/output.
- Jobs asincronos para tareas lentas.
- Event/audit log para acciones criticas.
- Prompt versioning para IA.

Evitar por ahora:

- CQRS completo.
- Event sourcing.
- Microservicios por dominio.
- GraphQL.
- Multi-base de datos por servicio.
- Abstracciones genericas tipo "BaseRepository" si no hay duplicacion real.

## API minima por dominio para V1

Identidad:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /admin/users`
- `POST /admin/users/import-csv`
- `PATCH /admin/users/{id}`
- `POST /admin/invitations`

Cursos:

- `GET /courses`
- `POST /courses`
- `POST /courses/{id}/enroll`
- `GET /courses/{id}/students`

Preguntas:

- `GET /questions`
- `POST /questions`
- `PATCH /questions/{id}`
- `PATCH /questions/{id}/status`
- `POST /questions/{id}/attachments`
- `POST /questions/bulk-approve`

Importacion:

- `POST /imports`
- `GET /imports/{id}`
- `POST /imports/{id}/extract`
- `PATCH /imports/{id}/drafts/{draft_id}`
- `POST /imports/{id}/publish-drafts`

Examenes:

- `GET /exams`
- `POST /exams`
- `POST /exams/auto`
- `POST /exams/personalized`
- `POST /exams/{id}/assign`
- `POST /exams/{id}/attempts`
- `PATCH /exams/{id}/attempts/{attempt_id}/answer`
- `POST /exams/{id}/attempts/{attempt_id}/submit`
- `GET /exams/{id}/attempts/{attempt_id}/results`

Analitica:

- `GET /analytics/student/me`
- `GET /analytics/students/{id}`
- `GET /analytics/course/{id}`
- `GET /analytics/institution/summary`
- `GET /analytics/questions/hardest`
- `GET /analytics/interventions`

IA:

- `POST /ai/explain`
- `POST /ai/classify`
- `POST /ai/generate-question`
- `POST /ai/generate-practice`
- `POST /ai/tutor/sessions`
- `POST /ai/tutor/sessions/{id}/messages`

## Datos que deben capturarse desde V1

Para que la IA mejore y la analitica tenga valor, capturar desde el inicio:

- Tiempo por pregunta.
- Cambios de respuesta.
- Preguntas marcadas para revisar.
- Abandono o pausa.
- Resultado por area, competencia y componente.
- Fuente de la pregunta: manual, OCR, IA, importada.
- Version de pregunta si fue editada.
- Recursos recomendados abiertos.
- Explicaciones generadas y feedback del estudiante/docente.
- Eventos de integridad: cambio de pestana, perdida de foco, respuesta sospechosamente rapida. Solo como senales, no como acusacion automatica.

