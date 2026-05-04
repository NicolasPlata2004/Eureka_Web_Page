#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║             Instalación rápida            ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Check prerequisites ───────────────────────────────────────────────────
echo -e "${CYAN} Verificando requisitos...${RESET}"

if ! command -v docker &>/dev/null; then
  echo -e "${RED} Docker no está instalado. Visita https://docs.docker.com/get-docker/${RESET}"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo -e "${RED} Docker Compose v2 no disponible. Actualiza Docker.${RESET}"
  exit 1
fi

echo -e "${GREEN} Docker $(docker --version | awk '{print $3}' | tr -d ',')${RESET}"
echo -e "${GREEN} Docker Compose $(docker compose version --short)${RESET}"

# ── Setup .env ────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN} Configurando variables de entorno...${RESET}"

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  # Generate a random secret key
  SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
  sed -i.bak "s/dev-secret-key-change-me-in-production-use-openssl/${SECRET}/" backend/.env
  rm -f backend/.env.bak
  echo -e "${GREEN} .env creado con SECRET_KEY aleatoria${RESET}"
else
  echo -e "${YELLOW} backend/.env ya existe, no se sobreescribirá${RESET}"
fi


# ── Build and start ───────────────────────────────────────────────────────
echo ""
echo -e "${CYAN} Construyendo e iniciando servicios (puede tomar 3-5 minutos la primera vez)...${RESET}"
docker compose up -d --build

# ── Wait for health ───────────────────────────────────────────────────────
echo ""
echo -e "${CYAN} Esperando que los servicios estén listos...${RESET}"
MAX=60
COUNT=0
while [ $COUNT -lt $MAX ]; do
  if curl -sf http://localhost/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
  COUNT=$((COUNT + 2))
  printf "."
done
echo ""

if ! curl -sf http://localhost/health >/dev/null 2>&1; then
  echo -e "${RED} l backend no respondió en ${MAX}s. Revisa los logs: docker compose logs backend${RESET}"
  exit 1
fi

echo -e "${GREEN} Todos los servicios están activos${RESET}"

# ── Run seeder ────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN} Cargando datos de demostración...${RESET}"
sleep 2
docker compose exec backend python seed_demo.py 2>/dev/null || \
  echo -e "${YELLOW}   Seed omitido (sin OpenAI key o datos ya existentes)${RESET}"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}     Instalación completada exitosamente${RESET}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${BOLD}Plataforma:${RESET}    http://localhost"
echo -e "  ${BOLD}API Docs:${RESET}      http://localhost/api/docs"
echo -e "   ${BOLD}MinIO Console:${RESET} http://localhost:9001  (admin / minioadmin)"
echo ""
echo -e "  ${CYAN}${BOLD}Credenciales demo:${RESET}"
echo -e "  Docente:    docente@eureka.edu.co  /  Docente123!"
echo -e "  Estudiante: estudiante@eureka.edu.co / Estudiante123!"
echo ""
echo -e "  ${YELLOW}Para detener:${RESET} docker compose down"
echo -e "  ${YELLOW}Para logs:${RESET}    docker compose logs -f"
echo ""
