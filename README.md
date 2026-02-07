# 🏢 Gerador de Relatórios - Appis

Sistema web para geração de relatórios de condomínios desenvolvido com Next.js 16, React 19 e Tailwind CSS 4.

## 📋 Sobre o Projeto

Este é o frontend do sistema Appis de geração de relatórios. Permite aos usuários:
- 🔐 Autenticação segura
- 📊 Geração de relatórios detalhados de condomínios
- 📄 Visualização e download de PDFs
- 🎨 Interface moderna com design system da Appis (laranja, preto e branco)
- 🌙 Suporte a tema claro e escuro

## 🚀 Pré-requisitos

### Para Desenvolvimento (Recomendado)
- [Node.js](https://nodejs.org/) 20.x ou superior
- npm (vem com Node.js)
- Backend da API rodando em `http://localhost:3333`

### Para Produção
- [Docker](https://www.docker.com/get-started) instalado
- Docker Compose (já vem integrado nas versões recentes do Docker)

## ⚡ Início Rápido (Desenvolvimento)

### Método Automatizado (Recomendado) 🌟

Use o script `dev.sh` que faz tudo automaticamente:

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd gerador-relatorios-front

# Execute o script de desenvolvimento
./dev.sh
```

**O script faz automaticamente:**
- ✅ Para containers Docker (se estiverem rodando)
- ✅ Remove arquivos antigos (`node_modules`, `.next`)
- ✅ Instala todas as dependências
- ✅ Verifica/cria arquivo `.env.local`
- ✅ Inicia servidor de desenvolvimento

**Acesse:** http://localhost:3000

### Método Manual

Se preferir fazer manualmente:

```bash
# 1. Clone e entre no diretório
git clone <url-do-repositorio>
cd gerador-relatorios-front

# 2. Configure variáveis de ambiente
cp .env.example .env.local

# 3. Instale dependências
npm ci

# 4. Rode o servidor de desenvolvimento
npm run dev
```

> 💡 **Por que desenvolvimento local?** O modo de desenvolvimento local (sem Docker) é mais rápido, tem melhor hot reload e as variáveis de ambiente do `.env.local` funcionam automaticamente.

## 🐳 Instalação e Execução com Docker

### Modo Produção

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd gerador-relatorios-front
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações
```

3. **Build e execute o container**
```bash
docker compose up -d frontend
```

4. **Acesse a aplicação**
```
http://localhost:3000
```

### Modo Desenvolvimento (com hot reload)

```bash
# Instale as dependências primeiro (apenas na primeira vez)
docker compose run --rm frontend-dev npm ci

# Execute em modo desenvolvimento
docker compose --profile dev up frontend-dev
```

### Comandos Úteis

```bash
# Parar os containers
docker compose down

# Ver logs
docker compose logs -f frontend

# Rebuild da imagem
docker compose build --no-cache frontend

# Remover containers e volumes
docker compose down -v
```

### Script Alternativo com Docker

Se preferir usar Docker em desenvolvimento, use o script `docker-dev.sh`:

```bash
./docker-dev.sh
```

**O script faz automaticamente:**
- ✅ Para e remove containers antigos
- ✅ Instala dependências no Docker
- ✅ Inicia servidor com hot reload

> ⚠️ **Nota sobre Docker em desenvolvimento**: Variáveis de ambiente do `.env.local` funcionam apenas no browser (client-side). Se tiver problemas de conexão com a API, prefira usar `./dev.sh` (desenvolvimento local).

> **Nota**: Se você tiver uma versão antiga do Docker Compose standalone, use `docker-compose` (com hífen) ao invés de `docker compose` (com espaço).

## 💻 Instalação e Execução sem Docker

### 1. Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd gerador-relatorios-front

# Instale as dependências
npm ci
```

### 2. Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e configure a URL da API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

### 3. Execução

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build de produção
npm run build

# Executar build de produção
npm start

# Lint
npm run lint
Acesse a aplicação em [http://localhost:3000](http://localhost:3000)

> 💡 **Dica**: Use o script `./dev.sh` para automatizar todo este processo!

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `NEXT_PUBLIC_API_URL` | URL do backend da API | `http://localhost:3333` |

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.3
- **Estilização**: Tailwind CSS 4
- **Componentes UI**: Radix UI + shadcn/ui
- **Formulários**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Ícones**: Lucide React

## 📁 Estrutura do Projeto

```
gerador-relatorios-front/
├── app/                    # App Router do Next.js
│   ├── dashboard/         # Página principal
│   ├── login/             # Página de login
│   ├── globals.css        # Estilos globais e tema
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   ├── CondominioSelector.tsx
│   ├── PDFPreview.tsx
│   └── ReportDialog.tsx
├── contexts/             # Contextos React
│   └── AuthContext.tsx   # Gerenciamento de autenticação
├── lib/                  # Utilitários
│   ├── api.ts           # Configuração Axios
│   └── utils.ts         # Funções auxiliares
├── public/              # Arquivos estáticos
└── Dockerfile           # Configuração Docker

```

## 🔗 Backend

Este projeto requer o backend rodando. Certifique-se de que a API está rodando em `http://localhost:3333` (ou configure a URL correta no `.env.local`).

## 🔧 Scripts Disponíveis

### Scripts de Automação

#### `./dev.sh` ⭐ Recomendado para desenvolvimento

Script completo que prepara e inicia o ambiente de desenvolvimento local:

```bash
./dev.sh
```

**Ações executadas:**
1. Para containers Docker (se estiverem rodando)
2. Remove `node_modules` e `.next` antigos
3. Instala dependências com `npm ci`
4. Verifica/cria arquivo `.env.local`
5. Inicia servidor de desenvolvimento (`npm run dev`)

**Quando usar:** Sempre que quiser começar a desenvolver do zero ou resetar o ambiente.

#### `./docker-dev.sh` - Desenvolvimento com Docker

Script para desenvolvimento usando Docker com hot reload:

```bash
./docker-dev.sh
```

**Ações executadas:**
1. Para e remove containers/volumes antigos
2. Instala dependências no container
3. Inicia servidor em modo desenvolvimento com Docker

**Quando usar:** Se você preferir desenvolver usando Docker, mas esteja ciente que pode ter problemas com variáveis de ambiente.

### Scripts NPM

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria o build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o ESLint

## 🎨 Identidade Visual

O projeto utiliza a paleta de cores da Appis:
- **Laranja**: `#FF6B00` (cor primária)
- **Preto**: Backgrounds e texto (modo escuro)
- **Branco**: Backgrounds e texto (modo claro)

## 📄 Licença

Este projeto é proprietário da Appis.

## 👥 Contribuição

Para contribuir com o projeto, entre em contato com a equipe Appis.
