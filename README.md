# Fiverr Clone

A full-stack Fiverr clone built with modern technologies.

## Tech Stack

- **Frontend:** React.js + TypeScript + Tailwind CSS + ShadCN (Radix + Tailwind)
- **Routing:** React Router
- **State Management:** Redux Toolkit
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **Authentication:** Clerk
- **Payment:** Stripe
- **Chat:** Socket.IO
- **Hosting:** Vercel (Frontend) + Render (Backend)

## Project Structure

```
fiverr-clone/
├── apps/
│   ├── client/         # React + TS + Tailwind + ShadCN (Vite)
│   └── server/         # Node.js + Express + PostgreSQL
├── packages/
│   ├── ui/             # Shared UI components (optional, for monorepo)
│   └── types/          # Shared TypeScript types (optional)
├── .env.example
├── README.md
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- pnpm (or yarn)
- PostgreSQL
- Docker (optional, for local PostgreSQL)

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/fiverr-clone.git
   cd fiverr-clone
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Setup:**

   - Copy `.env.example` to `.env` in both `apps/client` and `apps/server`.
   - Update the environment variables with your keys (Clerk, Stripe, PostgreSQL, etc.).

4. **Start the development servers:**

   - **Frontend:**

     ```bash
     cd apps/client
     pnpm dev
     ```

   - **Backend:**

     ```bash
     cd apps/server
     pnpm dev
     ```

5. **Database Setup:**

   - Ensure PostgreSQL is running.
   - Run migrations (if using Prisma):

     ```bash
     cd apps/server
     pnpm prisma migrate dev
     ```

## Deployment

### Frontend (Vercel)

- Connect your GitHub repository to Vercel.
- Set environment variables in Vercel dashboard.
- Deploy!

### Backend (Render)

- Create a new Web Service on Render.
- Connect your GitHub repository.
- Set environment variables.
- Deploy!

### Database (PostgreSQL)

- Use Render, Neon, or Supabase for production.

## Features

- Authentication (Clerk)
- Seller/Buyer roles
- Service listings
- Explore page
- Chat system (Socket.IO)
- Payment integration (Stripe)
- Order management
- Review system
- Responsive design

## License

MIT 