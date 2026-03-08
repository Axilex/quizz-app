#!/bin/bash
# ============================================================
# Quizzy — Script de déploiement
# ============================================================
# Usage :
#   ./deploy.sh              → Rebuild tout et déploie
#   ./deploy.sh front        → Rebuild le front uniquement
#   ./deploy.sh api          → Rebuild l'API uniquement
#   ./deploy.sh logs         → Voir les logs
#   ./deploy.sh status       → État des conteneurs
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

case "${1:-all}" in
  front|web)
    echo -e "${YELLOW}📦 Rebuild du frontend...${NC}"
    # Supprimer le volume pour forcer la recopie
    docker compose rm -sf web
    docker volume rm -f "$(basename "$PROJECT_DIR")_frontend_dist" 2>/dev/null || true
    docker compose up -d --build web
    docker compose restart caddy
    echo -e "${GREEN}✅ Frontend déployé !${NC}"
    ;;

  api|back)
    echo -e "${YELLOW}🔧 Rebuild de l'API...${NC}"
    docker compose up -d --build api
    echo -e "${GREEN}✅ API déployée !${NC}"
    ;;

  all)
    echo -e "${BOLD}🚀 Déploiement complet de Quizzy${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Nettoyer le volume frontend pour forcer la recopie
    docker compose down
    docker volume rm -f "$(basename "$PROJECT_DIR")_frontend_dist" 2>/dev/null || true

    echo -e "${YELLOW}📦 Build de tous les services...${NC}"
    docker compose up -d --build

    echo ""
    echo -e "${GREEN}✅ Tout est lancé !${NC}"
    docker compose ps
    ;;

  logs)
    docker compose logs -f --tail=50
    ;;

  status)
    docker compose ps
    echo ""
    echo -e "${BOLD}Ressources :${NC}"
    docker stats --no-stream
    ;;

  stop)
    docker compose down
    echo -e "${YELLOW}⏹  Arrêté${NC}"
    ;;

  *)
    echo "Usage: ./deploy.sh [all|front|api|logs|status|stop]"
    exit 1
    ;;
esac
