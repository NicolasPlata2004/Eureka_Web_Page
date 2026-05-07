# Planeacion MVP Eureka ICFES

Fecha de corte: 2026-05-07

Este directorio aterriza la hoja de ruta para convertir el repositorio actual en una V1 demostrable y vendible a colegios en menos de 2 semanas. La premisa principal es no construir una plataforma "bonita con IA", sino resolver dos dolores concretos:

1. Los estudiantes necesitan practicar de forma constante, recibir retroalimentacion accionable y mejorar en las areas reales de Saber 11.
2. Los colegios y docentes necesitan digitalizar examenes existentes, asignarlos rapido y entender donde intervenir por estudiante, curso, grupo e institucion.

## Documentos

- [01_estado_actual_repositorio.md](01_estado_actual_repositorio.md): que existe hoy, que riesgos tecnicos tiene y que conviene conservar.
- [02_competencia_y_referentes.md](02_competencia_y_referentes.md): competencia en Colombia y referentes globales de test prep, IA, analytics y OCR.
- [03_arquitectura_aplicacion.md](03_arquitectura_aplicacion.md): arquitectura modular recomendada, dominios, datos, servicios y limites.
- [04_roadmap_v1_2_semanas.md](04_roadmap_v1_2_semanas.md): plan de ejecucion por dias para un equipo de 3 personas.
- [05_backlog_funcional_v1.md](05_backlog_funcional_v1.md): tareas priorizadas por problema real de estudiante, docente y administrador.
- [06_ia_ocr_personalizacion.md](06_ia_ocr_personalizacion.md): pipeline de digitalizacion, generacion, tutor IA y examenes personalizados.
- [07_skills_subagents_herramientas.md](07_skills_subagents_herramientas.md): agentes, skills y division de trabajo con Codex, Cursor, Claude Code, Gemini, etc.
- [08_docker_infraestructura.md](08_docker_infraestructura.md): estructura dockerizada, perfiles de desarrollo y despliegue simple.
- [09_riesgos_decisiones_pendientes.md](09_riesgos_decisiones_pendientes.md): riesgos criticos, decisiones de producto y criterios de salida.

## Definicion de V1 adecuada para mostrar a colegios

La V1 debe permitir una demo completa de principio a fin:

- Un administrador crea o importa usuarios, docentes, cursos y estudiantes.
- Un docente digitaliza un examen desde PDF/imagen, revisa preguntas, confirma respuestas y publica un simulacro.
- Un estudiante entra, ve simulacros asignados, presenta uno con cronometro, guarda progreso y entrega.
- El estudiante ve resultado por area, explicaciones y siguiente practica recomendada.
- El docente ve estadisticas por curso, estudiante, pregunta y area debil.
- El colegio ve un tablero institucional basico con avance general, cursos con mayor riesgo y uso de la plataforma.
- Todo corre con Docker en una maquina limpia usando una configuracion documentada.

## Principio de alcance

En 2 semanas no se debe intentar competir en cantidad de contenido con plataformas existentes. La ventaja demostrable debe ser:

- Flujo colegio primero: administracion, cursos, asignaciones, datos por grupo.
- Digitalizacion asistida de examenes propios con revision humana.
- Analitica pedagogica clara, no solo graficas.
- IA controlada y trazable: ayuda a explicar, clasificar y personalizar, pero el docente mantiene control sobre contenido publicado.

