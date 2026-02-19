#!/usr/bin/env bash
# ============================================================================
# Obstetric AI - Deployment script for OVH VPS
# VPS: vps-d6ab33ba.vps.ovh.net (51.77.144.54) - Ubuntu 25.04
#
# Usage:
#   1. Run locally:  ./deploy.sh           (SSH into VPS and deploy)
#   2. Run on VPS:   ./deploy.sh --local   (run directly on the VPS)
# ============================================================================
set -euo pipefail

VPS_HOST="51.77.144.54"
VPS_USER="root"
VPS_HOSTNAME="vps-d6ab33ba.vps.ovh.net"
REPO_URL="https://github.com/bapuku/foetal-health.git"
APP_DIR="/opt/obstetric-ai"

# ── Colors ──────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERR]${NC} $*"; }

# ── Remote or local? ───────────────────────────────────
if [[ "${1:-}" != "--local" ]]; then
    info "Deploying to VPS $VPS_HOST via SSH..."
    info "Copying deploy script to VPS..."
    scp "$0" "${VPS_USER}@${VPS_HOST}:/tmp/deploy.sh"
    ssh -t "${VPS_USER}@${VPS_HOST}" "chmod +x /tmp/deploy.sh && /tmp/deploy.sh --local"
    exit $?
fi

info "Running deployment on VPS (local mode)..."

# ── 1. System packages ─────────────────────────────────
info "Updating system and installing prerequisites..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates gnupg lsb-release ufw fail2ban > /dev/null

# ── 2. Docker ──────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    info "Installing Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null
    systemctl enable docker --now
    ok "Docker installed"
else
    ok "Docker already installed ($(docker --version))"
fi

# ── 3. Firewall ────────────────────────────────────────
info "Configuring firewall (UFW)..."
ufw --force reset > /dev/null
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow 22/tcp > /dev/null
ufw allow 80/tcp > /dev/null
ufw allow 443/tcp > /dev/null
ufw --force enable > /dev/null
ok "Firewall configured (SSH, HTTP, HTTPS)"

# ── 4. Fail2ban ────────────────────────────────────────
info "Configuring fail2ban..."
systemctl enable fail2ban --now 2>/dev/null || true
ok "Fail2ban active"

# ── 5. Clone / pull repo ──────────────────────────────
CLONE_DIR="/opt/obstetric-ai-repo"
if [ -d "$CLONE_DIR/.git" ]; then
    info "Pulling latest changes..."
    cd "$CLONE_DIR"
    git pull origin main
else
    info "Cloning repository..."
    rm -rf "$CLONE_DIR"
    git clone "$REPO_URL" "$CLONE_DIR"
fi

# Backup .env if it exists
if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" /tmp/obstetric-ai-env.bak
    info "Backed up .env to /tmp/obstetric-ai-env.bak"
fi

# Sync obstetric-ai-system subdirectory to APP_DIR
info "Syncing obstetric-ai-system/ to $APP_DIR..."
mkdir -p "$APP_DIR"
rsync -a --delete "$CLONE_DIR/obstetric-ai-system/" "$APP_DIR/"

# Restore .env
if [ -f /tmp/obstetric-ai-env.bak ]; then
    cp /tmp/obstetric-ai-env.bak "$APP_DIR/.env"
    info "Restored .env"
fi

cd "$APP_DIR"
ok "Code ready at $APP_DIR"

# ── 6. Environment file ───────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
    warn ".env file not found. Copying from .env.example..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    warn "IMPORTANT: Edit $APP_DIR/.env with your API keys before the app works fully."
fi

# ── 7. SSL certificate (Let's Encrypt) ────────────────
info "Setting up SSL..."
mkdir -p "$APP_DIR/nginx/ssl"

if [ ! -d "$APP_DIR/nginx/ssl/live/$VPS_HOSTNAME" ]; then
    info "Starting temporary HTTP server for certificate issuance..."
    cp "$APP_DIR/nginx/default-http-only.conf" "$APP_DIR/nginx/default.conf.bak"
    cp "$APP_DIR/nginx/default-http-only.conf" "$APP_DIR/nginx/default.conf"

    cd "$APP_DIR"
    docker compose up -d --build nginx frontend ctg-monitor apgar-transition 2>/dev/null || true
    sleep 5

    info "Requesting SSL certificate for $VPS_HOSTNAME..."
    docker compose run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        --email admin@sovereignpialpha.com \
        --agree-tos --no-eff-email \
        -d "$VPS_HOSTNAME" || {
        warn "SSL certificate request failed. Continuing with HTTP only."
        warn "You can retry later: docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d $VPS_HOSTNAME"
    }

    if [ -d "$APP_DIR/nginx/ssl/live/$VPS_HOSTNAME" ]; then
        info "SSL certificate obtained. Switching to HTTPS config..."
        cp "$APP_DIR/nginx/default.conf.bak" "$APP_DIR/nginx/default-http-only.conf"
        # Restore the HTTPS config
        git checkout -- nginx/default.conf 2>/dev/null || true
        ok "SSL certificate active"
    else
        warn "Keeping HTTP-only config"
    fi
else
    ok "SSL certificate already exists"
fi

# ── 8. Build and start all services ───────────────────
info "Building and starting all Docker containers..."
cd "$APP_DIR"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

info "Waiting for services to start..."
sleep 15

# ── 9. Health checks ──────────────────────────────────
info "Running health checks..."
SERVICES=("frontend:3000" "ctg-monitor:8000" "apgar-transition:8001" "symbolic-reasoning:8002" "polygraph-verifier:8003" "bishop-partogram:8004" "rciu-risk:8005" "quantum-optimizer:8006" "mother-baby-risk:8007" "clinical-narrative:8008" "user-engagement:8009")
ALL_OK=true

for SVC in "${SERVICES[@]}"; do
    NAME="${SVC%%:*}"
    PORT="${SVC##*:}"
    if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1 || curl -sf "http://localhost:$PORT" > /dev/null 2>&1; then
        ok "$NAME (port $PORT)"
    else
        warn "$NAME (port $PORT) - not responding yet"
        ALL_OK=false
    fi
done

# ── 10. Summary ───────────────────────────────────────
echo ""
echo "============================================"
echo "  OBSTETRIC AI - Deployment Summary"
echo "============================================"
echo ""
echo "  VPS:        $VPS_HOST ($VPS_HOSTNAME)"
echo "  App Dir:    $APP_DIR"
echo "  Docker:     $(docker --version 2>/dev/null || echo 'N/A')"
echo ""
echo "  URLs:"
echo "    HTTP:     http://$VPS_HOST"
echo "    HTTPS:    https://$VPS_HOSTNAME"
echo ""
echo "  Services:   12 containers (frontend + 10 agents + nginx)"
echo ""
if [ "$ALL_OK" = true ]; then
    echo -e "  Status:     ${GREEN}ALL SERVICES UP${NC}"
else
    echo -e "  Status:     ${YELLOW}SOME SERVICES STARTING${NC}"
    echo "  Run:        cd $APP_DIR && docker compose logs -f"
fi
echo ""
echo "  Management:"
echo "    Logs:     cd $APP_DIR && docker compose logs -f"
echo "    Restart:  cd $APP_DIR && docker compose restart"
echo "    Stop:     cd $APP_DIR && docker compose down"
echo "    Update:   cd $APP_DIR && git pull && docker compose up -d --build"
echo ""
echo "  Edit .env:  nano $APP_DIR/.env"
echo "============================================"
