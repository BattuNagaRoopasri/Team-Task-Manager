# Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking progress with role-based access control.

## 🚀 Tech Stack
- **Database:** PostgreSQL (Prisma ORM)
- **Backend:** Node.js, Express.js, JWT Authentication
- **Frontend:** React (Vite), Modern Vanilla CSS
- **Deployment:** Railway

## ⚙️ Features
- **Authentication:** Signup & Login with JWT.
- **Role-Based Access:** `ADMIN` (creates projects/tasks) and `MEMBER` (views/updates assigned tasks).
- **Project Management:** Admins can create projects and assign members.
- **Task Tracking:** Users can view tasks, update statuses (TODO, IN PROGRESS, DONE), and track due dates.
- **Premium UI:** Glassmorphism, smooth animations, and a responsive design system.

## 🛠️ Local Development Setup

> [!IMPORTANT]  
> You need Node.js and PostgreSQL installed locally to run this app.

1. **Install Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Database Configuration:**
   - Open `backend/.env.example` and rename it to `.env`.
   - Update the `DATABASE_URL` with your local PostgreSQL credentials:
     `DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/team_task_manager?schema=public"`

3. **Run Prisma Migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

4. **Start the Application:**
   Open two terminal windows:
   - **Terminal 1 (Backend):** `npm run dev:backend`
   - **Terminal 2 (Frontend):** `npm run dev:frontend`

## 🌐 Deployment to Railway (Mandatory Step)

Deploying this app to Railway is incredibly straightforward due to the monorepo setup.

1. **Push to GitHub:**
   - Commit all your code and push it to a new GitHub repository.

2. **Create Railway Project:**
   - Go to [Railway.app](https://railway.app/) and click **New Project**.
   - Select **Provision PostgreSQL**. Railway will instantly create a database for you.

3. **Deploy Application:**
   - In the same Railway project, click **New** -> **GitHub Repo** and select your repository.
   - Railway will detect the `railway.json` file and start building.

4. **Environment Variables:**
   - Click on your newly deployed GitHub service in Railway.
   - Go to the **Variables** tab.
   - Add a `JWT_SECRET` variable (e.g., `my_super_secret_key_123`).
   - Click **Reference Variable** and select `DATABASE_URL` from your PostgreSQL plugin so the backend can connect to the database.

5. **Generate Prisma Client:**
   - Railway handles `npx prisma generate` automatically during the build step.
   - If you need to run migrations on the live database, go to the **Deployments** -> **View Logs** -> **Terminal** in Railway and run:
     `npx prisma db push`
