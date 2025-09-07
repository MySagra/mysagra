<p align="center">
  <img src="assets/banner.png" alt="Banner" width="100%" />
</p>

# MySagra - Smart ordering for your festival
MySagra is a platform that streamlines the ordering process for festivals, allowing users to easily browse and purchase food and drinks from their favorite vendors.

## Quick Start

Deploy with [Docker Compose](https://docs.docker.com/compose/):
1. Setup the `env` file following the `.env.example` file
2. Build and start the containers
```bash
    docker-compose up --build
```

## Development
This project uses [pnpm](https://pnpm.io/) as package manager and [TurboRepo](https://turbo.build/repo) as monorepo tool.
1. Clone the repository
2. Make sure [pnpm](https://pnpm.io/) is installed globally
```bash
    npm install -g pnpm
```
3. Then install the dependencies
```bash
    pnpm install
```
4. Start the development server with the command `pnpm run dev`