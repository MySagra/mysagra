<p align="center">
  <img src="assets/banner.png" alt="Banner" width="100%" />
</p>

# MySagra – Smart Ordering for Festivals, Fairs, and Local Events

**MySagra** is an open-source platform that digitizes and simplifies the ordering process for festivals, fairs, and local events. Designed to reduce queues and streamline operations, MySagra allows users to easily order food and drinks from their tables or at the counter, while staff manages orders in real-time through dashboards, printers, and dedicated workstations (kitchen, bar, runner, cashier). With offline support, customizable roles, and menu management including allergens and options, MySagra is the perfect solution for events even in low-connectivity areas. Fully controllable and ready to use or customize.

👉 Learn more at [mysagra.com](https://mysagra.com)

## Quick Start

Deploy with [Docker Compose](https://docs.docker.com/compose/):
1. Setup the `env` file following the `.env.example` file
2. Build and start the containers
```bash
    docker-compose up -d
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