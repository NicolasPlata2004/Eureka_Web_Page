# Skills, Subagents Y Herramientas

Este documento define que asistentes/agentes conviene crear despues. No es necesario tenerlos todos desde el dia 1; la prioridad es que cada agente tenga una responsabilidad concreta y entregables verificables.

## Principios para trabajar con IA en este proyecto

- Un humano o agente integrador mantiene la arquitectura y revisa merges.
- Los agentes trabajan por areas con archivos de propiedad claros.
- Cada tarea debe terminar con pruebas o evidencia.
- Ningun agente debe cambiar stack o arquitectura sin decision explicita.
- Las salidas de IA para producto educativo deben ser revisadas por humano.

## Agentes recomendados

### 1. Backend API Agent

Responsabilidad:

- FastAPI, SQLAlchemy, permisos, endpoints, migraciones.
- Corregir bugs de rutas, seguridad multi-tenant y scoring.
- Crear servicios/repositories sin sobredisenar.

Contexto que debe recibir:

- `backend/app/api/*`
- `backend/app/domain/models.py`
- `database/init.sql`
- `planning/03_arquitectura_aplicacion.md`
- `planning/05_backlog_funcional_v1.md`

Entregables:

- PRs pequenos.
- Tests de backend.
- Migraciones Alembic.
- Documentacion breve de endpoints.

### 2. Frontend Product Agent

Responsabilidad:

- React/Vite, rutas, UI de estudiante/docente/admin.
- Flujos completos: admin onboarding, exam runner, import review, analytics.
- Estados vacios, loading, errores y responsive.

Contexto:

- `frontend/src/App.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/pages/**`
- `frontend/src/components/**`
- `planning/04_roadmap_v1_2_semanas.md`

Entregables:

- Pantallas integradas con API real.
- Validaciones y mensajes claros.
- Build limpio.
- Capturas o e2e cuando aplique.

### 3. OCR/AI Pipeline Agent

Responsabilidad:

- Importacion PDF/imagen, almacenamiento, preprocesamiento, prompts, parsing JSON.
- Jobs asincronos.
- Guardado de borradores y adjuntos.
- Medicion de calidad.

Contexto:

- `backend/app/api/ai.py`
- `planning/06_ia_ocr_personalizacion.md`
- Ejemplos anonimizados de examenes reales.

Entregables:

- Pipeline probado con documentos reales.
- Set de fixtures de OCR.
- Reporte de precision.
- Fallbacks cuando no hay API key.

### 4. Analytics/Data Agent

Responsabilidad:

- Consultas de desempeno.
- Agregaciones por estudiante, curso, nivel, grupo e institucion.
- Preguntas mas falladas y recomendaciones.
- Exportes.

Contexto:

- `backend/app/api/analytics.py`
- `backend/app/api/exams.py`
- `planning/03_arquitectura_aplicacion.md`

Entregables:

- Endpoints rapidos y testeados.
- Contratos typed para frontend.
- Seeds con datos realistas.

### 5. QA/E2E Agent

Responsabilidad:

- Pruebas end-to-end con Playwright.
- Tests backend pytest.
- Datos demo.
- Checklist de regresion.

Contexto:

- Todo el flujo P0.
- `docker-compose.yml`
- `README.md`
- `planning/04_roadmap_v1_2_semanas.md`

Entregables:

- `tests/` backend.
- `frontend/e2e/` o equivalente.
- Script de smoke test.
- Reporte de bugs bloqueantes.

### 6. DevOps/Deploy Agent

Responsabilidad:

- Docker Compose limpio.
- `.env.example`.
- Healthchecks.
- CI/CD minimo.
- Backup/restore.
- Preparar VPS/demo server.

Contexto:

- `docker-compose.yml`
- `docker-compose.override.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `nginx/nginx.conf`
- `.github/workflows/ci.yml`
- `planning/08_docker_infraestructura.md`

Entregables:

- Comandos reproducibles.
- Compose dev/prod.
- Documentacion de despliegue.
- Smoke test post-deploy.

### 7. Product/Research Agent

Responsabilidad:

- Validar competencia.
- Preparar guion de demo.
- Transformar feedback de colegios en backlog.
- Redactar mensajes de UI y reportes.

Contexto:

- `planning/02_competencia_y_referentes.md`
- Feedback de escuelas.
- Capturas de producto.

Entregables:

- Guion de demo.
- Preguntas para entrevistas.
- Matriz de valor por rol.
- Priorizacion semanal.

## Skills a crear despues

### skill: eureka-backend-fastapi

Uso: cambios en backend FastAPI del proyecto.

Debe incluir:

- Convenciones de modelos, schemas, services y routers.
- Reglas de tenant isolation.
- Como crear migraciones.
- Como escribir tests.
- Endpoints criticos y permisos.

### skill: eureka-frontend-product

Uso: pantallas y flujos React.

Debe incluir:

- Estructura de features.
- Componentes UI existentes.
- Reglas de UX para examen.
- Patrones React Query/Zustand.
- Checklist responsive.

### skill: eureka-ocr-ai

Uso: importacion de examenes, prompts, parsing y revision.

Debe incluir:

- Formato JSON esperado.
- Prompts versionados.
- Manejo de baja confianza.
- Fixtures de examenes.
- Reglas de privacidad.

### skill: eureka-analytics

Uso: metricas educativas y reportes.

Debe incluir:

- Definiciones de metricas.
- Consultas esperadas.
- Contratos API.
- Criterios para no prometer puntaje ICFES estimado.

### skill: eureka-qa-demo

Uso: preparar demo y validar no regresion.

Debe incluir:

- Smoke tests.
- Guion de demo.
- Datos seed.
- Checklist de bugs bloqueantes.

## Herramientas sugeridas por tipo de tarea

Codex:

- Refactors de repo.
- Implementacion con lectura amplia del codigo.
- Tests y debugging.
- Documentacion tecnica.

Cursor:

- Iteracion rapida en UI.
- Cambios localizados con contexto visual.
- Refactors pequenos guiados por el desarrollador.

Claude Code:

- Analisis de arquitectura.
- Cambios backend/frontend con razonamiento largo.
- Revision de PRs grandes.

Gemini:

- OCR/vision comparativa.
- Analisis de documentos largos.
- Extraccion desde PDFs complejos.

Playwright:

- Validar flujos de estudiante/docente/admin.
- Capturas antes de demo.

## Forma de trabajar con equipo de 3

Ritmo diario:

- 15 minutos: decidir 3 objetivos del dia.
- 4 horas: implementacion por carriles.
- 30 minutos: integracion y pruebas.
- 15 minutos: actualizar backlog y riesgos.

Carriles recomendados:

- Persona A + Backend API Agent: seguridad, datos, scoring, permisos.
- Persona B + Frontend Product Agent: flujos visibles y UX.
- Persona C + QA/DevOps Agent: Docker, seeds, e2e, demo, investigacion.

Regla de oro: no abrir mas de 3 frentes simultaneos. Para vender en 2 semanas, un flujo terminado vale mas que cinco pantallas a medias.

