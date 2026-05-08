# Fase 0 - Backlog P0 Para Jira/ClickUp

Fecha de corte: 2026-05-07

Este backlog convierte los P0 de `planning/` en tareas ordenadas para una herramienta tipo Jira o ClickUp. La secuencia parte del estado actual del repositorio: primero se estabiliza entorno, permisos y datos; luego se construyen flujos de admin/docente/estudiante; despues OCR/IA; al final QA, demo y entrega.

## Leyenda

- Prioridad: `P0` obligatorio para demo vendible.
- Tipo: `Backend`, `Frontend`, `Fullstack`, `Infra`, `QA`, `Producto`.
- Responsable sugerido: `A` backend/datos/IA, `B` frontend/UX, `C` QA/infra/producto.
- Estimacion: `S` medio dia o menos, `M` 1 dia, `L` 1-2 dias.

## Epica 1 - Base Operativa, Docker Y Configuracion

### F0-001 - Crear configuracion reproducible de entorno

- Tipo: Infra
- Responsable sugerido: C
- Estimacion: S
- Depende de: ninguna
- Descripcion: crear `.env.example`, `backend/.env.example` y documentar variables minimas para levantar el proyecto desde cero.
- Criterios de aceptacion:
  - Existe `.env.example` en raiz con DB, Redis, MinIO, secret key e IA opcional.
  - Existe `backend/.env.example`.
  - README indica pasos de copia de envs.
  - No hay secretos reales versionados.

### F0-002 - Corregir Docker Compose para maquina limpia

- Tipo: Infra
- Responsable sugerido: C
- Estimacion: M
- Depende de: F0-001
- Descripcion: ajustar compose actual para que no dependa de archivos inexistentes y separar variables de API/worker/db.
- Criterios de aceptacion:
  - `docker compose up -d --build` levanta `db`, `redis`, `minio`, `backend`, `frontend`, `nginx`.
  - Las variables de IA no estan configuradas en el servicio `db`.
  - El backend no falla si la API key de IA esta vacia.
  - Healthchecks pasan en DB, Redis, MinIO y backend.

### F0-003 - Agregar worker para tareas OCR/IA

- Tipo: Infra/Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-002
- Descripcion: agregar servicio `worker` usando la misma imagen del backend y Redis como broker.
- Criterios de aceptacion:
  - `docker-compose.yml` incluye `worker`.
  - Worker inicia y registra logs claros.
  - Existe modulo base `backend/app/workers`.
  - Hay una tarea de prueba ejecutable.

### F0-004 - Crear bucket MinIO automaticamente o documentar setup

- Tipo: Infra
- Responsable sugerido: C
- Estimacion: S
- Depende de: F0-002
- Descripcion: asegurar que el bucket de archivos exista para uploads de preguntas/importaciones.
- Criterios de aceptacion:
  - Bucket `icfes-files` existe tras setup local o hay comando documentado.
  - Backend puede subir y leer un archivo de prueba.
  - README documenta credenciales y consola MinIO local.

### F0-005 - Normalizar credenciales demo, seeds y README

- Tipo: Producto/Infra
- Responsable sugerido: C
- Estimacion: S
- Depende de: F0-001
- Descripcion: alinear credenciales demo entre README, `database/init.sql`, frontend y `seed_demo.py`.
- Criterios de aceptacion:
  - Admin, docente y estudiante demo tienen passwords documentados y funcionales.
  - Botones de demo en login prellenan credenciales correctas.
  - `seed_demo.py` usa las mismas credenciales.
  - README no contiene credenciales contradictorias.

## Epica 2 - Migraciones, Datos Base Y Arquitectura Minima

### F0-006 - Crear migracion inicial Alembic como fuente de verdad

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: L
- Depende de: F0-002
- Descripcion: generar migracion inicial desde modelos actuales y dejar claro el flujo de migraciones.
- Criterios de aceptacion:
  - Existe migracion Alembic inicial.
  - `alembic upgrade head` crea el esquema en DB limpia.
  - `Base.metadata.create_all` no se usa como mecanismo principal en produccion.
  - `database/init.sql` queda limitado a extensiones/seed o se documenta su rol.

### F0-007 - Agregar tablas P0 faltantes

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: L
- Depende de: F0-006
- Descripcion: incorporar modelos/migraciones minimas para asignaciones, importaciones, adjuntos y auditoria.
- Criterios de aceptacion:
  - Existen modelos y tablas para `exam_assignments`, `import_jobs`, `import_pages`, `question_attachments`, `audit_logs`.
  - Todas las tablas escolares relevantes tienen `institution_id` cuando aplique.
  - Existen indices por `institution_id`, `course_id`, `student_id`, `exam_id`.
  - La migracion corre desde cero sin errores.

### F0-008 - Crear capa minima de permisos por institucion y rol

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-007
- Descripcion: implementar utilidades reutilizables para validar institucion, rol y propiedad del recurso.
- Criterios de aceptacion:
  - Existe `backend/app/core/permissions.py` o equivalente.
  - Hay helpers para admin/docente/estudiante e institucion.
  - Endpoints nuevos usan los helpers.
  - Hay tests de aislamiento basicos.

### F0-009 - Crear auditoria minima para acciones criticas

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-007
- Descripcion: registrar acciones importantes para demo y seguridad: crear usuario, importar examen, aprobar pregunta, publicar examen, entregar intento.
- Criterios de aceptacion:
  - Existe servicio para escribir `audit_logs`.
  - Se registran usuario actor, accion, entidad, entidad_id, institucion y timestamp.
  - No bloquea el flujo principal si falla el log, pero deja error registrado.

## Epica 3 - Autenticacion, Usuarios Y Administracion Escolar

### F0-010 - Restringir registro publico inseguro

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: S
- Depende de: F0-008
- Descripcion: impedir que un cliente publico cree docentes o administradores mediante `/auth/register`.
- Criterios de aceptacion:
  - Registro publico no permite rol `docente` ni `admin`.
  - Si se mantiene registro, fuerza rol estudiante y valida institucion permitida.
  - La creacion de docentes/admins queda solo en endpoints admin.
  - Hay test cubriendo intento de elevar rol.

### F0-011 - Corregir rutas dinamicas que bloquean endpoints de stats

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: S
- Depende de: ninguna
- Descripcion: mover rutas `/stats/summary` antes de `/{id}` en usuarios y preguntas.
- Criterios de aceptacion:
  - `GET /api/users/stats/summary` responde correctamente.
  - `GET /api/questions/stats/summary` responde correctamente.
  - Tests o smoke checks cubren ambas rutas.

### F0-012 - Corregir redirect post-login

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: S
- Depende de: ninguna
- Descripcion: reemplazar navegacion a `/dashboard` por redireccion real segun rol.
- Criterios de aceptacion:
  - Admin entra a vista admin/docente adecuada.
  - Docente entra a `/teacher/dashboard`.
  - Estudiante entra a `/student/dashboard`.
  - No hay flashes hacia ruta inexistente.

### F0-013 - Implementar endpoint admin para crear usuarios

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-008, F0-010
- Descripcion: crear usuarios por admin con validacion de rol, institucion, email unico y password temporal.
- Criterios de aceptacion:
  - Admin puede crear estudiante, docente y admin de su institucion.
  - Docente no puede crear admins.
  - No se puede crear usuario en otra institucion.
  - Respuesta no expone hash de password.

### F0-014 - Completar CRUD admin de usuarios

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-013
- Descripcion: completar listar, editar, activar/desactivar y filtrar usuarios con aislamiento institucional.
- Criterios de aceptacion:
  - Listado filtra por institucion del admin.
  - Se puede editar nombre, correo, grado, rol y estado.
  - Desactivar es soft delete.
  - No se puede desactivar a si mismo sin confirmacion/regla explicita.

### F0-015 - Construir UI admin para crear y editar usuarios

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: M
- Depende de: F0-013, F0-014
- Descripcion: completar pantalla admin de usuarios con formularios y feedback de errores.
- Criterios de aceptacion:
  - Boton "Crear usuario" abre formulario.
  - Se pueden editar usuarios existentes.
  - Activar/desactivar funciona desde tabla.
  - Errores de API se muestran de forma clara.

### F0-016 - Implementar importacion CSV de usuarios

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: L
- Depende de: F0-014, F0-015
- Descripcion: permitir carga masiva de estudiantes/docentes desde CSV.
- Criterios de aceptacion:
  - Backend recibe CSV y valida columnas requeridas.
  - Reporta creados, actualizados, duplicados y errores por fila.
  - Frontend muestra preview/resultado de importacion.
  - Existe plantilla CSV descargable o documentada.

## Epica 4 - Cursos, Grupos E Inscripciones

### F0-017 - Reforzar API de cursos con permisos institucionales

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-008
- Descripcion: asegurar que docentes/admins solo vean y gestionen cursos de su institucion.
- Criterios de aceptacion:
  - Listado de cursos filtra por institucion.
  - Crear curso asigna `institution_id` del usuario actual.
  - Editar/eliminar valida institucion.
  - Estudiante solo ve cursos inscritos.

### F0-018 - Validar inscripcion masiva de estudiantes

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-017
- Descripcion: endurecer `courses/{id}/enroll` para validar rol estudiante, institucion y duplicados.
- Criterios de aceptacion:
  - No permite inscribir usuarios de otra institucion.
  - No permite inscribir docentes/admins como estudiantes.
  - Ignora duplicados o los reporta sin romper toda la operacion.
  - Devuelve conteo de inscritos y errores.

### F0-019 - Completar UI de cursos e inscripciones

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: M
- Depende de: F0-017, F0-018
- Descripcion: permitir crear cursos, ver estudiantes e inscribir masivamente desde la interfaz.
- Criterios de aceptacion:
  - Docente/admin crea curso.
  - Vista muestra estudiantes inscritos.
  - Se pueden agregar estudiantes al curso desde listado/busqueda.
  - La UI muestra errores de validacion de inscripcion.

### F0-020 - Crear seed demo realista de colegio piloto

- Tipo: Producto/QA
- Responsable sugerido: C
- Estimacion: M
- Depende de: F0-013, F0-017
- Descripcion: crear datos demo con institucion, docentes, 30 estudiantes, 2 cursos, preguntas y simulacro.
- Criterios de aceptacion:
  - Script seed es idempotente o documenta reset.
  - Hay estudiantes con resultados variados para analitica.
  - Demo permite recorrer admin, docente y estudiante.

## Epica 5 - Banco De Preguntas Y Multimedia

### F0-021 - Reforzar permisos y filtros del banco de preguntas

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-008
- Descripcion: aplicar aislamiento institucional, permisos de autor/docente/admin y filtros de busqueda.
- Criterios de aceptacion:
  - Docente ve preguntas de su institucion y globales permitidas.
  - Estudiante solo ve preguntas aprobadas cuando aplique.
  - Admin no ve datos de otra institucion salvo rol interno futuro.
  - Busqueda por area, estado, dificultad, fuente, competencia y texto funciona.

### F0-022 - Completar formulario de pregunta P0

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: M
- Depende de: F0-021
- Descripcion: soportar area, competencia, componente, dificultad, enunciado, opciones, respuesta, explicacion y etiquetas.
- Criterios de aceptacion:
  - Docente puede crear pregunta manual completa.
  - Docente puede editar pregunta existente.
  - Validaciones evitan guardar sin opciones/respuesta.
  - Estado inicial es `borrador`.

### F0-023 - Implementar adjuntos de pregunta y opcion

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: L
- Depende de: F0-004, F0-007, F0-021
- Descripcion: permitir imagen/archivo en pregunta y, si aplica, opciones.
- Criterios de aceptacion:
  - Backend sube archivo a MinIO y crea `question_attachments`.
  - Frontend permite adjuntar/ver imagen.
  - Render de pregunta muestra imagen sin romper layout.
  - Archivos quedan ligados a institucion y pregunta.

### F0-024 - Mejorar preview de pregunta con LaTeX, tablas simples e imagenes

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: M
- Depende de: F0-022, F0-023
- Descripcion: asegurar que el docente vea como vera el estudiante la pregunta.
- Criterios de aceptacion:
  - KaTeX renderiza formulas.
  - Tablas simples se muestran legibles.
  - Imagenes se muestran con limites responsive.
  - La preview funciona en modal/formulario y en examen.

### F0-025 - Implementar aprobacion/archivo y bulk approve

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-021, F0-022
- Descripcion: permitir pasar preguntas de borrador a aprobado o archivado, incluyendo aprobacion masiva.
- Criterios de aceptacion:
  - Docente/admin cambia estado de una pregunta.
  - Bulk approve funciona para preguntas seleccionadas.
  - Se registra auditoria de aprobacion.
  - Preguntas archivadas no aparecen para crear examenes.

## Epica 6 - Simulacros, Asignaciones Y Visibilidad

### F0-026 - Crear modelo/API de asignaciones de examenes

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: L
- Depende de: F0-007, F0-017
- Descripcion: agregar asignacion de simulacro a curso, estudiantes o grupos especificos.
- Criterios de aceptacion:
  - Existe endpoint para asignar examen a curso/estudiantes.
  - Estudiante solo lista examenes asignados o publicos.
  - Docente/admin puede ver asignaciones creadas.
  - Disponibilidad por fecha se respeta.

### F0-027 - Reforzar creacion manual de simulacros

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-021, F0-026
- Descripcion: permitir crear simulacro desde preguntas aprobadas seleccionadas.
- Criterios de aceptacion:
  - Solo se pueden seleccionar preguntas aprobadas y visibles para la institucion.
  - Se guarda orden de preguntas.
  - Se define duracion.
  - Se puede previsualizar examen.

### F0-028 - Reforzar simulacros automaticos y plantillas Saber 11

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-021, F0-026
- Descripcion: generar simulacros por distribucion de areas/dificultad con plantillas corta y completa.
- Criterios de aceptacion:
  - Plantilla "Saber 11 corto" disponible para demo.
  - Plantilla "Saber 11 completo" disponible como configuracion.
  - Si faltan preguntas por area, API devuelve error claro.
  - Examen generado queda asignable.

### F0-029 - Completar UI docente de examenes y asignacion

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: L
- Depende de: F0-026, F0-027, F0-028
- Descripcion: completar pantalla para crear, publicar/despublicar, asignar y ver simulacros.
- Criterios de aceptacion:
  - Docente crea examen manual.
  - Docente crea examen automatico.
  - Docente asigna a curso.
  - Docente ve estado, cantidad de preguntas y disponibilidad.

### F0-030 - Validar inicio de intento segun asignacion y estado

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-026
- Descripcion: asegurar que un estudiante no pueda iniciar un examen no asignado o fuera de fecha.
- Criterios de aceptacion:
  - Intento no inicia si examen no esta asignado/publico.
  - Intento no inicia si esta fuera de ventana de disponibilidad.
  - Intento en progreso se reanuda.
  - Tests cubren casos permitidos y bloqueados.

## Epica 7 - Experiencia Del Estudiante En Examen

### F0-031 - Mejorar lista de examenes asignados del estudiante

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: M
- Depende de: F0-026, F0-030
- Descripcion: mostrar simulacros disponibles, en progreso y completados con llamados claros.
- Criterios de aceptacion:
  - Estudiante ve solo examenes disponibles para el.
  - Se distingue iniciar, continuar y ver resultado.
  - Se muestran duracion, preguntas y disponibilidad.
  - Estado vacio es claro.

### F0-032 - Garantizar runner de examen con cronometro y navegacion

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: L
- Depende de: F0-030
- Descripcion: asegurar experiencia de examen estable con navegacion entre preguntas.
- Criterios de aceptacion:
  - Cronometro visible.
  - Navegador de preguntas muestra contestadas/pendientes/marcadas.
  - Se puede avanzar, retroceder y saltar.
  - Layout funciona en laptop y tablet.

### F0-033 - Implementar autosave y reanudacion confiable

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: L
- Depende de: F0-032
- Descripcion: guardar respuestas automaticamente y recuperar intento tras refresh.
- Criterios de aceptacion:
  - Cada respuesta se guarda sin esperar entrega final.
  - Refresh del navegador recupera intento y respuestas.
  - Preguntas marcadas para revisar se conservan.
  - Error de red muestra feedback y reintenta o permite continuar.

### F0-034 - Implementar confirmacion de entrega

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: S
- Depende de: F0-033
- Descripcion: confirmar entrega, mostrando preguntas sin responder.
- Criterios de aceptacion:
  - Modal indica total respondidas y pendientes.
  - Estudiante puede volver al examen o entregar.
  - Tras entregar no puede modificar respuestas.

### F0-035 - Extraer scoring a servicio backend testeable

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-030
- Descripcion: mover calculo de resultado a servicio y calcular por area/competencia cuando exista.
- Criterios de aceptacion:
  - Score global se calcula como porcentaje de acierto.
  - Score por area se guarda.
  - Score por competencia/componente se calcula si hay datos.
  - Tests cubren respuestas correctas, incorrectas y vacias.

### F0-036 - Mostrar resultado inmediato del estudiante

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: M
- Depende de: F0-035
- Descripcion: mostrar resultado global, por area y detalle por pregunta.
- Criterios de aceptacion:
  - Vista muestra porcentaje de acierto, no "puntaje ICFES estimado".
  - Muestra respuesta dada y correcta.
  - Muestra explicacion si existe.
  - Permite volver al historial.

## Epica 8 - Analitica Docente E Institucional Basica

### F0-037 - Reforzar analitica de estudiante e historial

- Tipo: Backend/Frontend
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-035, F0-036
- Descripcion: asegurar que estudiante vea intentos, evolucion y areas debiles.
- Criterios de aceptacion:
  - Historial lista intentos completados.
  - Dashboard muestra promedio, mejor puntaje y areas.
  - No rompe cuando no hay intentos.

### F0-038 - Reforzar analitica de curso para docente

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-017, F0-035
- Descripcion: entregar promedio de curso, desempeno por area, ranking, preguntas mas falladas y evolucion semanal.
- Criterios de aceptacion:
  - Endpoint valida que docente/admin pueda ver el curso.
  - Retorna estudiantes inscritos aunque no tengan intentos.
  - Preguntas mas falladas calculan tasa de error.
  - Funciona con datos demo.

### F0-039 - Completar UI de analitica docente

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: L
- Depende de: F0-038
- Descripcion: mostrar datos accionables por curso: promedio, areas, ranking, fallos y estudiantes en riesgo.
- Criterios de aceptacion:
  - Docente selecciona curso.
  - Se ven tarjetas/resumen, graficas y tablas.
  - Se identifican estudiantes con bajo desempeno.
  - Estados vacios explican que falta presentar simulacros.

### F0-040 - Implementar resumen institucional basico

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-014, F0-017, F0-038
- Descripcion: dashboard admin/directivo con usuarios, cursos, intentos, promedio y areas debiles.
- Criterios de aceptacion:
  - Admin ve total estudiantes, docentes, cursos y simulacros.
  - Ve promedio institucional por area.
  - Ve cursos con peor desempeno.
  - Se respeta aislamiento por institucion.

## Epica 9 - Importacion OCR Con Revision Docente

### F0-041 - Crear API de importacion y persistir archivo original

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-004, F0-007, F0-008
- Descripcion: crear flujo para subir PDF/imagen, guardar en MinIO y crear `ImportJob`.
- Criterios de aceptacion:
  - Acepta PDF, JPG, PNG, WebP.
  - Guarda archivo original en MinIO.
  - Crea `ImportJob` con estado.
  - Rechaza formatos invalidos con error claro.

### F0-042 - Procesar PDF multipagina e imagenes en worker

- Tipo: Backend
- Responsable sugerido: A
- Estimacion: L
- Depende de: F0-003, F0-041
- Descripcion: convertir PDF a paginas/imagenes y guardar `ImportPage` con previews.
- Criterios de aceptacion:
  - PDF multipagina genera una pagina por hoja.
  - Imagen individual genera una pagina.
  - Cada pagina tiene estado y preview.
  - Errores quedan guardados en el job.

### F0-043 - Extraer preguntas con OCR/IA y guardar borradores

- Tipo: Backend/IA
- Responsable sugerido: A
- Estimacion: L
- Depende de: F0-042
- Descripcion: extraer texto/preguntas/opciones/respuesta sugerida/area/dificultad/confianza desde paginas.
- Criterios de aceptacion:
  - Se guardan drafts estructurados o salida equivalente revisable.
  - Respuesta inferida aparece como sugerencia, no como verdad publica.
  - Se guardan warnings y confianza.
  - Si no hay API key, se devuelve estado/fallback claro.

### F0-044 - Construir UI de revision OCR

- Tipo: Frontend
- Responsable sugerido: B
- Estimacion: L
- Depende de: F0-041, F0-043
- Descripcion: pantalla docente con pagina original y pregunta estructurada editable.
- Criterios de aceptacion:
  - Docente ve estado de importacion.
  - Puede navegar preguntas detectadas.
  - Puede editar enunciado, opciones, respuesta, area, competencia y dificultad.
  - Puede descartar o guardar borrador.

### F0-045 - Publicar preguntas revisadas al banco

- Tipo: Fullstack
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-044, F0-025
- Descripcion: convertir drafts revisados en preguntas `borrador` o `aprobado` segun accion docente.
- Criterios de aceptacion:
  - Preguntas guardadas conservan fuente `ocr`.
  - Se conserva relacion con importacion/pagina.
  - Adjuntos/imagenes disponibles se asocian a pregunta.
  - Se registra auditoria.

## Epica 10 - IA Pedagogica P0 Controlada

### F0-046 - Versionar prompts y registrar metadatos de AIJob

- Tipo: Backend/IA
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-007
- Descripcion: estandarizar prompts para generar, explicar, clasificar y OCR con version y metadatos.
- Criterios de aceptacion:
  - Cada `AIJob` guarda proveedor, modelo, tokens, tipo, estado y prompt_version.
  - Errores de proveedor quedan registrados.
  - No se exponen datos sensibles innecesarios en logs.

### F0-047 - Reforzar generacion de preguntas IA como borrador

- Tipo: Backend/Frontend
- Responsable sugerido: A/B
- Estimacion: M
- Depende de: F0-021, F0-046
- Descripcion: permitir generar pregunta original por area/dificultad/tema y guardarla como borrador revisable.
- Criterios de aceptacion:
  - La IA nunca crea pregunta aprobada automaticamente.
  - Pregunta generada incluye opciones, respuesta y explicacion.
  - Docente puede editarla despues.
  - Sin API key se muestra mensaje claro.

### F0-048 - Reforzar clasificacion IA de preguntas

- Tipo: Backend/IA
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-046
- Descripcion: clasificar pregunta por area, competencia, componente y dificultad para apoyar OCR/manual.
- Criterios de aceptacion:
  - Endpoint responde JSON estructurado.
  - Resultado incluye justificacion breve.
  - Docente puede aceptar o ignorar clasificacion.
  - Se registra `AIJob`.

### F0-049 - Generar explicaciones pedagogicas para resultados

- Tipo: Backend/IA
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-036, F0-046
- Descripcion: generar explicacion de respuesta correcta/incorrectas cuando la pregunta no tiene explicacion docente.
- Criterios de aceptacion:
  - Explicacion se genera bajo demanda o al entregar intento.
  - No contradice respuesta validada.
  - Se muestra al estudiante en resultados.
  - Fallback claro si no hay IA.

## Epica 11 - Privacidad, Riesgos Y Mensajes Honestos

### F0-050 - Ajustar textos para no prometer puntaje ICFES estimado

- Tipo: Producto/Frontend
- Responsable sugerido: C/B
- Estimacion: S
- Depende de: F0-036, F0-039
- Descripcion: revisar UI y documentacion para hablar de porcentaje de acierto/desempeno, no prediccion oficial.
- Criterios de aceptacion:
  - No aparece "puntaje ICFES estimado" en flujos P0.
  - Resultados usan "porcentaje de acierto" o "desempeno".
  - README/demo aclara que no hay afiliacion oficial con ICFES.

### F0-051 - Agregar consentimiento/derechos en importacion de examenes

- Tipo: Producto/Frontend
- Responsable sugerido: C/B
- Estimacion: S
- Depende de: F0-044
- Descripcion: antes de importar, pedir confirmacion de que el colegio tiene derecho a digitalizar el material.
- Criterios de aceptacion:
  - UI muestra checkbox obligatorio antes de upload.
  - Confirmacion queda registrada en `ImportJob` o audit log.
  - Texto es claro y corto.

### F0-052 - Minimizar datos enviados a proveedores IA

- Tipo: Backend/IA
- Responsable sugerido: A
- Estimacion: M
- Depende de: F0-046
- Descripcion: revisar prompts para no enviar nombre/email/curso del estudiante cuando no sea necesario.
- Criterios de aceptacion:
  - Servicios IA reciben contenido academico, no datos personales innecesarios.
  - Logs no imprimen PII sensible.
  - Documento tecnico breve describe politica de minimizacion.

## Epica 12 - QA, Pruebas Y Demo

### F0-053 - Configurar pruebas backend P0

- Tipo: QA/Backend
- Responsable sugerido: C/A
- Estimacion: M
- Depende de: F0-006
- Descripcion: agregar framework y fixtures para pruebas criticas del backend.
- Criterios de aceptacion:
  - `pytest` corre en backend.
  - Hay fixtures de DB/test client.
  - CI o comando local documentado ejecuta tests.

### F0-054 - Tests backend de permisos y aislamiento institucional

- Tipo: QA/Backend
- Responsable sugerido: C/A
- Estimacion: M
- Depende de: F0-008, F0-013, F0-017, F0-026
- Descripcion: probar que usuarios no accedan a recursos de otra institucion ni eleven rol.
- Criterios de aceptacion:
  - Test de registro sin elevacion de rol.
  - Test de docente consultando curso ajeno bloqueado.
  - Test de estudiante iniciando examen no asignado bloqueado.
  - Test de admin viendo solo su institucion.

### F0-055 - Tests backend de scoring, visibilidad y OCR draft save

- Tipo: QA/Backend
- Responsable sugerido: C/A
- Estimacion: M
- Depende de: F0-035, F0-041, F0-045
- Descripcion: cubrir calculo de resultados, visibilidad de examenes y guardado de pregunta importada.
- Criterios de aceptacion:
  - Scoring global/area correcto.
  - Examen fuera de disponibilidad no inicia.
  - Draft OCR se convierte en pregunta borrador.
  - Tests corren en menos de tiempo razonable para CI.

### F0-056 - Configurar e2e frontend del flujo principal

- Tipo: QA/Frontend
- Responsable sugerido: C/B
- Estimacion: L
- Depende de: F0-020, F0-029, F0-036, F0-039
- Descripcion: crear pruebas e2e para admin -> docente -> estudiante -> docente.
- Criterios de aceptacion:
  - E2E login admin/docente/estudiante.
  - Admin crea/valida curso y usuario o usa seed.
  - Docente crea/asigna examen.
  - Estudiante responde y entrega.
  - Docente ve analitica.

### F0-057 - Ejecutar prueba de Docker clean install

- Tipo: QA/Infra
- Responsable sugerido: C
- Estimacion: M
- Depende de: F0-002, F0-006, F0-020
- Descripcion: validar el sistema desde cero en entorno limpio.
- Criterios de aceptacion:
  - Clonar, copiar envs, levantar compose, migrar y seed funcionan.
  - `curl /health` y `/api/docs` responden.
  - Login demo funciona.
  - Se puede correr un simulacro demo.

### F0-058 - Crear script de smoke test

- Tipo: QA/Infra
- Responsable sugerido: C
- Estimacion: S
- Depende de: F0-057
- Descripcion: automatizar checks minimos post-setup/post-deploy.
- Criterios de aceptacion:
  - Script valida backend health, frontend, login demo y endpoints principales.
  - Devuelve exit code distinto de cero si algo falla.
  - Documentado en README.

### F0-059 - Preparar guion de demo colegio

- Tipo: Producto
- Responsable sugerido: C
- Estimacion: M
- Depende de: F0-020, F0-036, F0-039, F0-045
- Descripcion: escribir recorrido de demo con mensajes por rol y datos realistas.
- Criterios de aceptacion:
  - Guion cubre admin -> docente -> estudiante -> docente -> directivo.
  - Incluye tiempos estimados y credenciales.
  - Incluye que valor se debe explicar en cada pantalla.
  - Incluye fallback si OCR/IA falla en vivo.

### F0-060 - Pulir estados vacios, errores y responsive P0

- Tipo: Frontend/QA
- Responsable sugerido: B/C
- Estimacion: L
- Depende de: F0-015, F0-019, F0-029, F0-036, F0-039, F0-044
- Descripcion: revisar flujos P0 en laptop/tablet y asegurar UX presentable.
- Criterios de aceptacion:
  - Pantallas P0 tienen loading, error y empty state.
  - No hay textos cortados en tablet/laptop comun.
  - Formularios muestran validaciones utiles.
  - No hay rutas muertas visibles en navegacion.

### F0-061 - Documentar README piloto y checklist de despliegue

- Tipo: Producto/Infra
- Responsable sugerido: C
- Estimacion: M
- Depende de: F0-057, F0-059
- Descripcion: actualizar documentacion para que otra persona pueda correr demo o piloto.
- Criterios de aceptacion:
  - README tiene setup local, migraciones, seed, credenciales y troubleshooting.
  - Hay checklist de despliegue piloto.
  - Hay seccion de variables IA opcionales.
  - Hay nota de privacidad, derechos de material y no afiliacion oficial.

### F0-062 - Crear backup local basico de DB y archivos

- Tipo: Infra
- Responsable sugerido: C
- Estimacion: S
- Depende de: F0-002
- Descripcion: documentar o crear scripts simples de backup para piloto.
- Criterios de aceptacion:
  - Existe comando/script para `pg_dump`.
  - Se documenta ubicacion de volumen MinIO.
  - Hay carpeta `backups/` ignorada por git si aplica.

## Orden recomendado de ejecucion por dias

### Dia 1

- F0-001 a F0-012.
- Meta: entorno reproducible, bugs criticos corregidos, permisos base iniciados.

### Dia 2

- F0-013 a F0-020.
- Meta: admin puede preparar institucion, usuarios, cursos e inscripciones.

### Dia 3

- F0-021 a F0-025.
- Meta: banco de preguntas usable con multimedia y aprobacion.

### Dia 4

- F0-026 a F0-030.
- Meta: docente crea/asigna simulacros y estudiante solo ve lo permitido.

### Dia 5

- F0-031 a F0-036.
- Meta: estudiante presenta, guarda, entrega y ve resultados.

### Dia 6

- F0-037 a F0-040.
- Meta: docente/directivo ven analitica P0.

### Dia 7

- F0-041 a F0-045.
- Meta: docente importa PDF/imagen, revisa y guarda preguntas.

### Dia 8

- F0-046 a F0-052.
- Meta: IA P0 controlada, explicaciones, clasificacion y privacidad.

### Dia 9

- F0-053 a F0-059.
- Meta: pruebas, e2e, clean install y guion de demo.

### Dia 10

- F0-060 a F0-062 y buffer de bugs.
- Meta: demo estable y documentada.

## Definicion de terminado de Fase 0

- Un colegio demo se prepara en menos de 15 minutos.
- Un docente importa un examen de 10 a 20 preguntas y publica al menos 80% despues de revision.
- Un estudiante termina un simulacro sin perdida de respuestas.
- Docente ve areas debiles, ranking, preguntas mas falladas y estudiantes en riesgo.
- Admin/directivo ve resumen institucional basico.
- Docker clean install funciona desde cero.
- Hay pruebas backend criticas y e2e del flujo principal.
- La plataforma no promete puntaje ICFES estimado ni afiliacion oficial.
