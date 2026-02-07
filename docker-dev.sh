#!/bin/bash

# Script para resetar e rodar o projeto com Docker em modo desenvolvimento
# Uso: ./docker-dev.sh

set -e  # Para em caso de erro

echo "🧹 Limpando ambiente Docker..."

# Para e remove containers, networks e volumes
echo "📦 Parando containers..."
docker compose down -v 2\u003e/dev/null || true

# Remove imagens antigas
echo "🗑️  Removendo imagens antigas..."
docker compose rm -f 2\u003e/dev/null || true

# Verifica se .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando .env.local a partir de .env.example..."
    cp .env.example .env.local
    echo "✅ Arquivo .env.local criado. Verifique as configurações!"
fi

echo ""
echo "📦 Instalando dependências..."
docker compose run --rm frontend-dev npm ci

echo ""
echo "✅ Ambiente pronto!"
echo ""
echo "🚀 Iniciando servidor de desenvolvimento com Docker..."
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend deve estar em: http://localhost:3333"
echo ""
echo "⚠️  IMPORTANTE: Variáveis de ambiente do .env.local são usadas no BROWSER"
echo "    Se você mudar a URL da API, reinicie este script."
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

# Roda o servidor de desenvolvimento com profile dev
docker compose --profile dev up frontend-dev
