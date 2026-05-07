# Estado Actual Del Repositorio

## Stack actual

El repositorio ya tiene una base razonable para un MVP:

- Frontend: React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand, Recharts, KaTeX.
- Backend: FastAPI, SQLAlchemy async, PostgreSQL, JWT con refresh tokens, endpoints para IA, OCR, examenes, preguntas, cursos, usuarios y analitica.
- Infraestructura: Docker Compose con `db`, `redis`, `minio`, `backend`, `frontend`, `nginx`; perfiles de desarrollo para PgAdmin, Prometheus y Grafana.
- Dominio inicial: `Institution`, `User`, `Course`, `Enrollment`, `Question`, `QuestionOption`, `MockExam`, `Attempt`, `AttemptAnswer`, `AIJob`.
- Pantallas existentes: login, dashboards de estudiante/docente, gestion de cursos, preguntas, examenes, importacion OCR, analitica docente, usuarios admin.

Conclusion: no conviene cambiar de tecnologia para la V1. FastAPI + React + Postgres es suficiente y permite llegar rapido. Lo que si debe cambiar es la organizacion interna y la robustez de permisos, importacion, pruebas y despliegue.

## Lo que ya esta cerca de ser vendible

- Roles basicos: estudiante, docente y admin.
- Cursos e inscripciones.
- Banco de preguntas con estado `borrador`, `aprobado`, `archivado`.
- Simulacros manuales y automaticos por distribucion de areas.
- Intentos de examen, guardado de respuestas y entrega.
- Analitica de estudiante y curso.
- Generacion de preguntas con IA.
- OCR inicial para importar preguntas desde imagen.
- Render de preguntas con soporte parcial para LaTeX.
- Docker Compose funcional como base.

## Brechas criticas antes de vender una demo

### Seguridad y multi-institucion

- `POST /api/auth/register` permite registrar usuarios con rol enviado por el cliente. Para vender a colegios, el registro publico debe deshabilitar creacion de docentes/admins y moverse a invitaciones o carga administrativa.
- Varias consultas no validan de forma estricta que el recurso pertenezca a la institucion del usuario actual.
- Docentes pueden potencialmente consultar o modificar recursos por ID si conocen el UUID, dependiendo del endpoint.
- `courses/{course_id}/enroll` no valida que los estudiantes pertenezcan a la misma institucion ni que tengan rol estudiante.
- Falta auditoria: quien creo, importo, aprobo, publico o desactivo cada elemento.

### Rutas y bugs de API

- En `users.py`, la ruta `/{user_id}` esta antes de `/stats/summary`; en FastAPI/Starlette esto puede hacer que `/users/stats/summary` sea capturada como `user_id` y falle validacion.
- En `questions.py`, pasa algo similar con `/{question_id}` antes de `/stats/summary`.
- `Login.tsx` navega a `/dashboard`, ruta que no existe; termina cayendo en redirect, pero genera una experiencia fragil.
- Hay discrepancia entre credenciales demo de `README.md`, `database/init.sql`, `frontend/src/pages/Login.tsx` y `backend/seed_demo.py`.
- `Base.metadata.create_all` en startup convive con `database/init.sql` y Alembic vacio. Para V1 conviene usar Alembic como fuente de verdad.

### Arquitectura interna

- `backend/app/repositories` y `backend/app/services` existen pero estan vacios.
- Los endpoints mezclan validacion HTTP, reglas de negocio, consultas SQL, scoring y llamadas de IA.
- El modulo de IA concentra proveedores, parsing, OCR y persistencia. Debe separarse en servicios pequeños para poder probarlos.
- Falta capa de permisos reusable por institucion, rol y recurso.

### OCR y contenido multimedia

- El OCR actual usa `PIL.Image.open` y Tesseract sobre un archivo. Eso no resuelve bien PDF multipagina, tablas complejas, graficos ni imagenes de contexto.
- MinIO existe en Docker, pero el flujo OCR no persiste el archivo original, paginas procesadas ni recortes de imagenes/graficos.
- Las preguntas solo tienen `imagen_id` a nivel pregunta/opcion; hace falta un modelo de estimulos/contextos compartidos y adjuntos multiples.
- El sistema intenta inferir respuesta correcta si no aparece marcada. Para colegios, eso debe ser una sugerencia con confianza, nunca autopublicacion.

### Analitica y pedagogia

- El puntaje global es porcentaje de aciertos, no escala ICFES estimada. Para V1 puede ser aceptable si se nombra claramente como "porcentaje de acierto".
- Falta analitica por competencia, componente, etiqueta, nivel/grado, grupo especifico y cohorte.
- Falta explicar "que hacer manana" al docente: estudiantes en riesgo, temas prioritarios, preguntas mas falladas con accion sugerida.

### Calidad y operacion

- No se encontraron carpetas de pruebas ni configuracion clara de pytest/vitest/playwright.
- CI corre lint/build, pero no pruebas funcionales ni e2e.
- `docker-compose.yml` depende de `backend/.env`, que puede no existir en una maquina limpia.
- Falta `.env.example` consistente en raiz y backend.
- El README promete GitHub Actions CI/CD, Sentry y escalado, pero varias piezas aun son declarativas o incompletas.

## Recomendacion tecnica inmediata

Mantener un monolito modular para la V1:

- Un solo backend FastAPI, reorganizado por dominios.
- Un worker separado para OCR/IA con la misma base de codigo.
- PostgreSQL como fuente de verdad.
- Redis para colas y cache.
- MinIO para archivos.
- Nginx como reverse proxy.

Evitar microservicios por ahora. El equipo es de 3 personas y el riesgo principal no es escalabilidad, sino llegar a un flujo confiable de colegio, profesor y estudiante.

