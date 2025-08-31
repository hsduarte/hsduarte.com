# Deploy Automatizado para Servidor Hetzner

## Arquivos Criados

- `Dockerfile` - Configuração Docker multi-stage para produção
- `docker-compose.yml` - Orquestração dos serviços (app + nginx)
- `nginx.conf` - Configuração do proxy reverso com SSL
- `deploy.sh` - Script automatizado de deploy manual
- `setup-server.sh` - Script de configuração inicial do servidor
- `.github/workflows/deploy.yml` - GitHub Actions para deploy automatizado
- `.dockerignore` - Arquivos ignorados no build Docker

## Scripts NPM Adicionados

```bash
npm run build:prod          # Build de produção
npm run docker:build        # Build da imagem Docker
npm run docker:run          # Run local da imagem
npm run docker:compose:up   # Subir todos os serviços
npm run docker:compose:down # Parar todos os serviços
npm run deploy:hetzner       # Deploy manual para servidor
npm run setup:server        # Configurar servidor (executar no servidor)
```

## Deploy Automatizado com GitHub Actions

### 1. Configurar Servidor Hetzner (Uma vez apenas)

```bash
# No servidor Hetzner, execute:
curl -O https://raw.githubusercontent.com/SEU_USUARIO/hsduarte.com/master/setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh
```

### 2. Configurar Secrets no GitHub

No repositório GitHub, vá em **Settings → Secrets and Variables → Actions** e adicione:

- `SERVER_HOST`: IP do seu servidor Hetzner
- `SERVER_USER`: usuário do servidor (geralmente `root`)
- `SSH_PRIVATE_KEY`: chave privada SSH (gerada pelo script setup-server.sh)
- `DISCORD_WEBHOOK`: (opcional) webhook do Discord para notificações

### 3. Configurar DNS

Aponte seu domínio para o IP do servidor Hetzner:
- `A Record: hsduarte.com → IP_DO_SERVIDOR`
- `CNAME Record: www.hsduarte.com → hsduarte.com`

### 4. Configurar SSL (Após DNS propagado)

```bash
# No servidor, após DNS estar funcionando:
sudo certbot certonly --standalone -d hsduarte.com -d www.hsduarte.com
sudo mkdir -p /opt/hsduarte/ssl
sudo cp /etc/letsencrypt/live/hsduarte.com/fullchain.pem /opt/hsduarte/ssl/
sudo cp /etc/letsencrypt/live/hsduarte.com/privkey.pem /opt/hsduarte/ssl/
```

### 5. Deploy Automático

Agora, a cada push na branch `master/main`, o GitHub Actions fará o deploy automaticamente! 🚀

## Deploy Manual (Alternativo)

Se preferir fazer deploy manual:

```bash
# Local - substitua pelo IP do seu servidor
./deploy.sh 192.168.1.100 root
```

## Estrutura no Servidor

```
/opt/hsduarte/
├── dist/
├── package.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── ssl/
    ├── fullchain.pem
    └── privkey.pem
```

## Portas

- **4000**: Aplicação Angular SSR
- **80**: HTTP (redirecionamento para HTTPS)
- **443**: HTTPS

## Monitoramento

```bash
# Ver logs
docker-compose logs -f

# Status dos containers
docker-compose ps

# Restart dos serviços
docker-compose restart
```

## Diferenças do GitHub Pages

- ✅ Suporte completo a SSR (Server-Side Rendering)
- ✅ Melhor SEO e performance
- ✅ Controle total sobre configuração
- ✅ Certificados SSL automatizados
- ✅ Logs de acesso e monitoramento