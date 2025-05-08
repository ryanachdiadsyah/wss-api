# WhatsApp Baileys API

Uma API REST para WhatsApp usando a biblioteca Baileys, Express e Prisma.

## Descrição

Este projeto fornece uma API REST para interagir com o WhatsApp Web usando a biblioteca Baileys. Ele permite:

- Gerenciar múltiplas sessões do WhatsApp
- Enviar e receber mensagens
- Configurar webhooks para receber eventos em tempo real
- Armazenar histórico de mensagens em banco de dados

## Tecnologias Utilizadas

- **TypeScript**: Linguagem de programação
- **Express**: Framework web
- **Baileys**: Biblioteca para interação com WhatsApp Web
- **Prisma**: ORM para acesso ao banco de dados
- **PostgreSQL**: Banco de dados relacional
- **Docker**: Containerização

## Estrutura do Projeto

O projeto segue uma arquitetura componentizada:

```
wa-baileys-api/
├── prisma/                  # Configuração e modelos do Prisma
├── src/                     # Código fonte
│   ├── controllers/         # Controladores da API
│   ├── routes/              # Rotas da API
│   ├── services/            # Serviços de negócio
│   └── index.ts             # Ponto de entrada da aplicação
├── .env.example             # Exemplo de variáveis de ambiente
├── docker-compose.yml       # Configuração do Docker Compose
├── Dockerfile               # Configuração do Docker
├── package.json             # Dependências e scripts
├── tsconfig.json            # Configuração do TypeScript
└── README.md                # Documentação
```

## Instalação e Execução

### Pré-requisitos

- Node.js 18 ou superior
- NPM
- PostgreSQL (ou Docker para executar o banco de dados)

### Configuração

1. Clone o repositório:
   ```bash
   git clone https://github.com/wnexous/wa-baileys-api.git
   cd wa-baileys-api
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   Edite o arquivo `.env` com suas configurações.

4. Configure o banco de dados:
   ```bash
   npm run prisma:migrate
   ```

### Execução Local

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### Execução com Docker

```bash
docker-compose up -d
```

## API Endpoints

### Sessões

- `POST /api/sessions`: Criar uma nova sessão
- `GET /api/sessions`: Listar todas as sessões
- `GET /api/sessions/:sessionId`: Obter detalhes de uma sessão
- `GET /api/sessions/:sessionId/qr`: Obter QR code para autenticação
- `DELETE /api/sessions/:sessionId`: Excluir uma sessão

### Mensagens

- `POST /api/messages/text`: Enviar mensagem de texto
- `POST /api/messages/media`: Enviar mensagem de mídia
- `GET /api/messages`: Listar mensagens
- `GET /api/messages/:messageId`: Obter detalhes de uma mensagem

### Webhooks

- `POST /api/webhooks`: Registrar um novo webhook
- `GET /api/webhooks`: Listar webhooks
- `PUT /api/webhooks/:webhookId`: Atualizar um webhook
- `DELETE /api/webhooks/:webhookId`: Excluir um webhook

## Webhooks

Os webhooks permitem receber notificações em tempo real sobre eventos do WhatsApp. Você pode configurar um URL para receber eventos como:

- `connection.open`: Quando uma sessão é conectada
- `connection.logout`: Quando uma sessão é desconectada
- `qr.update`: Quando um novo QR code é gerado
- `messages.received`: Quando uma nova mensagem é recebida

## Exemplos de Uso

### Criar uma Sessão

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "minha-sessao"}'
```

### Enviar uma Mensagem

```bash
curl -X POST http://localhost:3000/api/messages/text \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "minha-sessao",
    "jid": "5511999999999@s.whatsapp.net",
    "text": "Olá, mundo!"
  }'
```

### Registrar um Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "minha-sessao",
    "url": "https://meu-site.com/webhook",
    "events": ["messages.received", "connection.open"]
  }'
```

## Licença

MIT
