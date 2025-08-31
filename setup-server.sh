#!/bin/bash

# Script para configurar o servidor Hetzner para receber deploys automatizados
# Execute este script UMA VEZ no seu servidor

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_info "Configurando servidor Hetzner para hsduarte.com..."

# Atualizar sistema
echo_info "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
echo_info "Instalando dependências..."
apt install -y curl wget git ufw

# Instalar Docker
echo_info "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo_info "Docker já está instalado"
fi

# Instalar Docker Compose
echo_info "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo_info "Docker Compose já está instalado"
fi

# Configurar firewall
echo_info "Configurando firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Criar diretório da aplicação
echo_info "Criando diretório da aplicação..."
mkdir -p /opt/hsduarte
chown -R $USER:$USER /opt/hsduarte

# Configurar SSL com Let's Encrypt
echo_info "Instalando Certbot para SSL..."
apt install -y snapd
snap install core; snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

echo_warn "IMPORTANTE: Configure o SSL manualmente após apontar o DNS:"
echo_warn "1. Aponte hsduarte.com para este servidor no DNS"
echo_warn "2. Execute: certbot certonly --standalone -d hsduarte.com -d www.hsduarte.com"
echo_warn "3. Execute: mkdir -p /opt/hsduarte/ssl"
echo_warn "4. Execute: cp /etc/letsencrypt/live/hsduarte.com/fullchain.pem /opt/hsduarte/ssl/"
echo_warn "5. Execute: cp /etc/letsencrypt/live/hsduarte.com/privkey.pem /opt/hsduarte/ssl/"

# Configurar renovação automática do SSL
echo_info "Configurando renovação automática do SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/hsduarte.com/*.pem /opt/hsduarte/ssl/ && cd /opt/hsduarte && docker-compose restart nginx") | crontab -

# Criar chave SSH para GitHub Actions (se não existir)
if [ ! -f ~/.ssh/id_rsa ]; then
    echo_info "Gerando chave SSH para GitHub Actions..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    echo_warn "Chave pública SSH gerada:"
    cat ~/.ssh/id_rsa.pub
    echo_warn "Adicione esta chave às chaves autorizadas se necessário"
fi

echo_info "Instalando node e npm globalmente..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo_info "Configuração do servidor concluída!"
echo_info "Próximos passos:"
echo_info "1. Configure o DNS para apontar hsduarte.com para este servidor"
echo_info "2. Configure os secrets no GitHub:"
echo_info "   - SERVER_HOST: $(curl -s https://ipinfo.io/ip)"
echo_info "   - SERVER_USER: $USER"
echo_info "   - SSH_PRIVATE_KEY: conteúdo de ~/.ssh/id_rsa"
echo_info "3. Configure o SSL após o DNS estar propagado"
echo_info "4. Faça um push para testar o deploy automático"

echo_info "Chave privada SSH (adicione como secret SSH_PRIVATE_KEY):"
echo "----------------------------------------"
cat ~/.ssh/id_rsa
echo "----------------------------------------"