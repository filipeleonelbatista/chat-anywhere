<p align="center">
  <img src="./public/icon.svg" width="120" height="120" alt="Chat-Anywhere Logo">
</p>

<h1 align="center">Chat-Anywhere 💬</h1>

<p align="center">
  <strong>Chat em tempo real, anônimo e temporário — direto do navegador.</strong>
</p>

<p align="center">
  <a href="#-sobre">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-como-usar">Como usar</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-desenvolvimento">Desenvolvimento</a> •
  <a href="#-deploy">Deploy</a>
</p>

---

## 📋 Sobre

**Chat-Anywhere** é uma aplicação de chat em tempo real que funciona 100% no navegador. Cada URL é uma sala de chat diferente — compartilhe o link com quem quiser conversar. **Sem cadastro, sem dados permanentes, sem rastreamento.**

As mensagens expiram automaticamente após **24 horas**. Seus dados (nome, email, avatar) ficam salvos apenas no seu navegador (localStorage).

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🚀 **Sem cadastro** | Escolha um nome e avatar para entrar. Não precisa de senha. |
| 🔒 **Privacidade total** | Nenhuma mensagem armazenada permanentemente. Tudo expira em 24h. |
| 🖼️ **Compartilhe imagens** | Envie fotos que ficam disponíveis por 24 horas via Vercel Blob. |
| 🔗 **Links com preview** | Cole um link e veja o preview automático com título, descrição e imagem. |
| 📱 **Salas por URL** | Cada URL é uma sala. Compartilhe o link para convidar. |
| ⚡ **Tempo real** | Mensagens em tempo real via Server-Sent Events (SSE). |
| 🌙 **Modo escuro** | Interface adaptável com suporte a dark mode. |
| 💾 **Sessão persistente** | Seus dados ficam salvos no navegador entre visitas. |

---

## 🎯 Como usar

1. **Acesse** a URL da sala (ex: `https://chat-anywhere.vercel.app/minha-sala`)
2. **Escolha** um avatar, nome e email
3. **Compartilhe** o link com quem quiser conversar
4. **Pronto!** As mensagens aparecem em tempo real

> 💡 **Dica:** Cada URL diferente cria uma sala nova. Use URLs únicas para conversas diferentes.

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | Framework full-stack com App Router |
| [React](https://react.dev/) | 19 | Biblioteca de UI |
| [TypeScript](https://www.typescriptlang.org/) | 5+ | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Estilização utilitária |
| [Vercel KV](https://vercel.com/docs/storage/vercel-kv) | - | Armazenamento temporário de mensagens (Redis) |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | - | Upload temporário de imagens |
| [Jest](https://jestjs.io/) | 29 | Testes unitários |

---

## 🚀 Desenvolvimento

### Pré-requisitos

- Node.js 20+
- Conta na [Vercel](https://vercel.com) com KV e Blob habilitados

### Instalação

```bash
# Clone o repositório
git clone https://github.com/filipeleonelbatista/chat-anywhere.git
cd chat-anywhere

# Instale as dependências
npm install

# Copie as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais da Vercel
```

### Variáveis de Ambiente

```env
# Vercel KV (Redis)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# Base URL (opcional, para OG images)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test

# Lint
npm run lint
```

---

## 🌐 Deploy

O projeto está configurado para deploy na **Vercel** (plano Hobby).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/filipeleonelbatista/chat-anywhere)

**Passos:**
1. Conecte o repositório na Vercel
2. Adicione as integrações **Vercel KV** e **Vercel Blob**
3. Configure as variáveis de ambiente
4. Deploy automático a cada push na branch `main`

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Feito com 💚 por <a href="https://github.com/filipeleonelbatista">filipeleonelbatista</a>
</p>
