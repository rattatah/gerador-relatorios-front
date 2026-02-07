#!/bin/bash

# Script para resetar e rodar o projeto em modo desenvolvimento (SEM Docker)
# Uso: ./dev.sh

set -e  # Para em caso de erro

echo "🧹 Limpando ambiente..."

# Para containers Docker se estiverem rodando
if docker compose ps -q frontend 2\u003e/dev/null | grep -q .; then
    echo "📦 Parando containers Docker..."
    docker compose down
fi

# Remove node_modules e build antigos
echo "🗑️  Removendo arquivos antigos..."
rm -rf node_modules .next

# Instala dependências
echo "📦 Instalando dependências..."
npm ci

# Verifica se .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando .env.local a partir de .env.example..."
    cp .env.example .env.local
    echo "✅ Arquivo .env.local criado. Verifique as configurações!"
fi

echo ""
echo "✅ Ambiente pronto!"
echo ""
echo "🚀 Iniciando servidor de desenvolvimento..."
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend deve estar em: http://localhost:3333"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

# Roda o servidor de desenvolvimento
npm run dev
