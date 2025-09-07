### MySagra - NextJs Frontend

This repository contains the frontend of MySagra, a management system for local festivals (“sagre”), built with Next.js and shadcn/ui. It provides an intuitive and modern interface to handle event organization, schedules, and volunteers.

## Quick Start

Get up and running quickly using this full-stack Docker Compose setup, which includes MariaDB, the MySagra API server, and the MySagra frontend.

```yaml
services:
  mysagra-ui:
    depends_on:
      mysagra-api:
        condition: service_healthy
    image: "ghcr.io/mysagra/mysagra-client:latest"
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://mysagra-api:4300
      - ENABLE_TABLE_SERVICE=true
    restart: unless-stopped

  mysagra-api:
    image: "ghcr.io/mysagra/mysagra-server:latest"
    command: ["sh", "-c", "npm run db:deploy && npm run db:seed && npm start"]
    env_file: .env
    environment:
      - NODE_ENV="${NODE_ENV:-production}"
      - DATABASE_URL=mysql://${DB_USER:-mysagra}:${DB_USER_PASSWORD:-mysagra}@db:3306/${MYSQL_DATABASE:-mysagra}
      - JWT_SECRET=${JWT_SECRET}
      - PEPPER=${PEPPER}
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4300/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    volumes:
      - api_logs:/app/logs
      - api_public:/app/public
    tmpfs:
      - /tmp
      - /run
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: mysql:8.0
    env_file: .env
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: "${MYSQL_DATABASE:-mysagra}"
      MYSQL_USER: "${DB_USER:-mysagra}"
      MYSQL_PASSWORD: ${DB_USER_PASSWORD:-mysagra}
    volumes:
      - mysql_data:/var/lib/mysql:delegated
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - DAC_OVERRIDE
      - NET_BIND_SERVICE
    security_opt:
      - seccomp=unconfined
    user: mysql
volumes:
  api_logs:
    driver: local
  api_public:
    driver: local
  mysql_data:
    driver: local
```

Afterward, create a `.env` file and include the following fields:

```env
PEPPER="your_pepper"
JWT_SECRET="your_jwt_secret"
FRONTEND_URL="http://example.com/"
```

It is **strongly recommended** to set a custom database and database user password.

Finally, start the services:

```bash
docker compose up -d
```

## Development

Create the `.env` file, for the setup follow the `.env.template`.

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Usage

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

To access the admin panel, navigate to [http://localhost:3000/auth/login](http://localhost:3000/login).

The default admin credentials are:
- **Username:** `admin`
- **Password:** `admin`
