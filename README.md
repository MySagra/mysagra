<p align="center">
  <img src="assets/banner.png" alt="Banner" width="100%" />
</p>

# MySagra – Smart Ordering for Festivals, Fairs, and Local Events

#### **MySagra: The Open-Source Smart Ordering System for Festivals and Community Events**

MySagra is a free and open-source platform designed to revolutionize how you manage orders at your local **festival**, "sagra," food vendor stand, or **community event**. Built with flexibility and transparency in mind, it provides everything you need to switch from outdated paper processes to a modern, efficient, and reliable digital system.

#### **Why Choose MySagra?**

We focus on delivering key features essential for event organizers and food vendors, ensuring maximum efficiency and data control:

1.  **Smart Order Management:** Implement a complete system for collecting orders directly from tables and at the counter.
2.  **Automated Kitchen & Bar Printing:** Orders are automatically split and printed by workstation (kitchen, bar, etc.) to streamline production and reduce errors.
3.  **Real-Time Performance Dashboard:** Monitor live data on sales, active orders, and overall performance in real time to make immediate, informed decisions.
4.  **Offline-Friendly PWA:** Reliability is crucial. MySagra works seamlessly even without a stable internet connection, making it perfect for outdoor or temporary venues.
5.  **Customizable Menu & Variants:** Easily configure your full menu, including dish variants, allergens, and dynamic pricing.
6.  **Truly Open Source:** MySagra is released under the Apache-2.0 license. You own your data, have full access to the source code, and are free from vendor lock-in.

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
4. Create the `.env` file, for the setup follow the `.env.template` in `apps/backend` and `apps/frontend` folders.
5. Run the database migrations in the `apps/backend` folder
```bash
    pnpm prisma migrate dev
```
6. Start the development server with the command
```bash
    pnpm run dev
```