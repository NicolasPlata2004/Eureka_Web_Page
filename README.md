> Plataforma educativa para preparación ICFES Saber 11 con IA generativa, OCR, analítica en tiempo real y administración docente.

---

### Frontend
- **React 18 + TypeScript** con Vite
- **TailwindCSS** + diseño propio (sin dependencia de shadcn)
- **React Query** (caché + fetching)
- **Zustand** (estado global persistido)
- **Recharts** (gráficas educativas)
- **KaTeX** (fórmulas matemáticas)

### Backend
- **FastAPI** (async, OpenAPI automático)
- **SQLAlchemy 2** async + **PostgreSQL 16**
- **JWT** con refresh token rotation
- **OpenAI API** (GPT-4o-mini por defecto)
- **Tesseract OCR** + OpenCV

### Infraestructura
- **Docker Compose** (todos los servicios)
- **Nginx** (reverse proxy + rate limiting)
- **Redis** (caché + colas Celery)
- **MinIO** (almacenamiento S3-compatible)
- **GitHub Actions** CI/CD

---


### Prerrequisitos
- Docker Desktop (o Docker Compose v2)
- 4 GB RAM mínimo
- OpenAI API key (opcional para pruebas locales, requerida para IA)

### 1. Clonar el repositorio

```bash
git clone https://github.com/NicolasPlata2004/Eureka_Web_Page_with_IA.git
cd Eureka_Web_Page_with_IA
```

### 2. Configurar las variables de entorno (.env)

Para evitar errores y hacer el proceso sencillo, simplemente crea un archivo llamado `.env` en la **carpeta raíz del proyecto** (donde está el archivo `docker-compose.yml`) y pega el siguiente contenido:

```ini
# Configuración de la base de datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=eureka_db

# Claves de APIs
OPENAI_API_KEY=tu_clave_de_openai_aqui
```

### 3. Levantar la plataforma con Docker

Abre una terminal en la carpeta raíz y ejecuta:

```bash
docker compose up -d --build
```

### 3. Verificar servicios

```bash
# Salud del backend
curl http://localhost/health

# API Docs
open http://localhost/api/docs

# Frontend
open http://localhost

# MinIO Console
open http://localhost:9001  # admin/minioadmin
```

### Desarrollo local (sin Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # editar según tu config local
uvicorn app.main:app --reload --port 8000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## Credenciales demo

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Docente/Admin | `docente@eureka.edu.co` | `Docente123!` |
| Estudiante | `estudiante@eureka.edu.co` | `Estudiante123!` |
| Admin | `admin@eureka.edu.co` | (bcrypt hash) |

---

### Simulacros automáticos
El sistema selecciona preguntas aprobadas aleatoriamente por área según la distribución configurada:
```json
{
  "matematicas": 10,
  "lectura_critica": 10,
  "sociales_ciudadanas": 10,
  "ciencias_naturales": 10,
  "ingles": 5
}
```

### Analítica educativa
- Evolución de puntajes semana a semana
- Ranking de estudiantes por curso
- Preguntas más falladas (con tasa de error)
- Radar de competencias por área
- Identificación automática del área más débil
- Tasa de mejora vs período anterior

---

### API Docs

Una vez en ejecución:
- **Swagger UI**: http://localhost/api/docs
- **ReDoc**: http://localhost/api/redoc
- **OpenAPI JSON**: http://localhost/api/openapi.json

### Endpoints principales

```
POST /api/auth/login
POST /api/auth/register 
POST /api/auth/refresh

GET  /api/questions 
POST /api/questions
PATCH /api/questions/{id}/status

GET  /api/exams
POST /api/exams/auto 
POST /api/exams/{id}/attempts 
POST /api/exams/{id}/attempts/{aid}/submit

POST /api/ai/generate-question 
POST /api/ai/ocr-import
POST /api/ai/explain

GET  /api/analytics/student/me
GET  /api/analytics/course/{id}
```

---

## DevOps

### Observabilidad
- **Sentry**: errores en tiempo real (`SENTRY_DSN`)
- **Prometheus**: métricas en `/metrics`
- **Logs estructurados**: via `logging` estándar Python

### Escalado
Para escalar el backend horizontalmente:
```bash
docker compose up -d --scale backend=3
```
