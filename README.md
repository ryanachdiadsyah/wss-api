# WhatsApp Service Server

UNOFFICIAL Whatsapp Rest API using Baileys, Express and Prisma.

## Description

This project provides a REST API to interact with WhatsApp Web using the Baileys library. It allows you to:

- Manage multiple WhatsApp sessions
- Send and receive messages
- Configure webhooks to receive real-time events
- Store message history in a database

## TechStack

- **TypeScript**: Programming language
- **Express**: Web framework
- **Baileys**: Library for interacting with WhatsApp Web
- **Prisma**: ORM for database access
- **PostgreSQL**: Relational database
- **Docker**: Containerization

## Project Structure

The project follows a componentized architecture :

```
wss/
├── prisma/               # Prisma configuration and templates
├── src/                  # Source code
│   ├── controllers/      # API controllers
│   ├── routes/           # API routes
│   ├── services/         # Business services
│   └── index.ts          # Application entry point
├── .env.example          # Example environment variables
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # Docker configuration TypeScript
└── README.md             # Documentation
```

## Installation and Execution

### Prerequisites

- Node.js 18 or higher
- NPM
- PostgreSQL (or Docker to run the database)

### Configuration

1. Clone the repository:
  ```bash
  git clone https://github.com/ryanachdiadsyah/wss-api.git
  cd wss-api
  ```

2. Install the dependencies:
  ```bash
  npm install
  ```

3. Set the environment variables:
  ```bash
  cp .env.example .env
  ```
Edit the `.env` file with your settings.

4. Set the database:
  ```bash
  npm run prisma:migrate
  ```

### On Local

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### On Docker

```bash
docker-compose up -d
```

## License

MIT
