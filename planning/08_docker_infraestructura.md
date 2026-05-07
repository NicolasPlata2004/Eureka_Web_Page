# Docker E Infraestructura

## Objetivo

Que el sistema pueda correr en una maquina limpia con un comando, pero manteniendo responsabilidades separadas:

- Frontend no ejecuta logica backend.
- API no procesa trabajos lentos de OCR/IA dentro del request.
- Worker procesa tareas pesadas.
- Base de datos, cache y archivos son servicios independientes.
- Observabilidad y herramientas dev son opcionales por perfil.

## Servicios recomendados

### P0

- `nginx`: reverse proxy, rate limit, limite de subida, SPA fallback.
- `frontend`: build React servido por Nginx.
- `api`: FastAPI con Uvicorn/Gunicorn.
- `worker`: Celery/RQ/Arq para OCR, IA, importaciones y reportes.
- `db`: PostgreSQL 16.
- `redis`: cola, cache y locks.
- `minio`: almacenamiento S3-compatible para archivos.

### P1

- `scheduler`: tareas periodicas si se separa del worker.
- `prometheus`: metricas.
- `grafana`: dashboards.
- `pgadmin`: desarrollo.
- `mailhog`: pruebas de emails.

## Compose objetivo

```text
docker-compose.yml
docker-compose.override.yml
docker-compose.prod.yml
.env.example
backend/.env.example
frontend/.env.example
```

Recomendacion:

- `docker-compose.yml`: servicios base para local.
- `docker-compose.override.yml`: hot reload y herramientas dev.
- `docker-compose.prod.yml`: imagenes, sin bind mounts, secrets reales, replicas si aplica.
- Perfiles: `dev`, `monitoring`, `mail`.

## Variables de entorno minimas

Raiz:

```env
POSTGRES_DB=icfes_db
POSTGRES_USER=icfes
POSTGRES_PASSWORD=change-me
SECRET_KEY=change-me
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
STORAGE_BUCKET=icfes-files
ENVIRONMENT=development
```

Backend:

```env
DATABASE_URL=postgresql+asyncpg://icfes:change-me@db:5432/icfes_db
REDIS_URL=redis://redis:6379/0
STORAGE_ENDPOINT=http://minio:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=icfes-files
STORAGE_PUBLIC_URL=http://localhost:9000/icfes-files
ALLOWED_ORIGINS=["http://localhost","http://localhost:3000","http://localhost:5173"]
```

## Cambios necesarios sobre el compose actual

- No usar `env_file: ./backend/.env` si ese archivo no existe por defecto; proveer `backend/.env.example` y documentar copia.
- Quitar variables de IA del servicio `db`; pertenecen a `api`/`worker`.
- Agregar `worker` con la misma imagen del backend.
- Agregar creacion automatica del bucket MinIO o documentar comando.
- Asegurar que API y worker esperen a DB/Redis/MinIO.
- Separar puertos: frontend directo para debug y nginx para demo.
- Documentar `docker compose --profile dev up`.

## Worker

El worker debe ejecutar tareas como:

- `process_import_job(import_job_id)`
- `extract_questions_from_page(import_page_id)`
- `generate_question_draft(params)`
- `generate_explanations_for_attempt(attempt_id)`
- `recompute_course_analytics(course_id)`

Para 2 semanas, Celery ya esta en requirements. Se puede usar Celery con Redis para evitar meter otra dependencia.

## Migraciones

Estado actual:

- Hay `database/init.sql`.
- Hay Alembic configurado, pero sin migraciones reales.
- `main.py` ejecuta `Base.metadata.create_all`.

Recomendacion V1:

- Crear migracion inicial Alembic.
- En desarrollo, permitir `alembic upgrade head` al levantar.
- En produccion, ejecutar migraciones explicitamente antes de iniciar API.
- Dejar `init.sql` solo para extensiones/seed demo o eliminar duplicidad.

## Comandos Make sugeridos

```makefile
setup:
	cp -n .env.example .env || true
	cp -n backend/.env.example backend/.env || true

dev:
	docker compose --profile dev up -d --build

logs:
	docker compose logs -f api worker frontend nginx

migrate:
	docker compose exec api alembic upgrade head

seed:
	docker compose exec api python seed_demo.py

test:
	docker compose exec api pytest
	cd frontend && npm run type-check && npm run build

smoke:
	curl -f http://localhost/health
	curl -f http://localhost/api/docs
```

## Backups para piloto

P0:

- Backup DB:

```bash
docker compose exec db pg_dump -U icfes icfes_db > backups/icfes_$(date +%F).sql
```

- Backup archivos MinIO: montar volumen persistente y documentar ubicacion.

P1:

- Script `scripts/backup.sh`.
- Script `scripts/restore.sh`.
- Backup automatico diario en VPS.

## Despliegue simple recomendado

Para primeras demos:

- Un VPS de 4 vCPU / 8 GB RAM.
- Docker Compose prod.
- Dominio con Nginx y TLS.
- Backups diarios.
- Sentry para errores.
- Logs persistentes.

No usar Kubernetes para V1. No agrega valor en 2 semanas.

## Checklist de maquina limpia

- `git clone`.
- `cp .env.example .env`.
- Editar claves.
- `docker compose up -d --build`.
- `docker compose exec api alembic upgrade head`.
- `docker compose exec api python seed_demo.py`.
- Abrir `http://localhost`.
- Login admin/docente/estudiante.
- Correr un simulacro demo.

