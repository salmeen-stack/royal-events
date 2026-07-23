# Royal Events Management System - Installation Guide

This guide will help you install and set up the Royal Events Management System on a new machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** / **pnpm**
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **Code Editor** - VS Code recommended

## Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd royal-events
```

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Install Backend Dependencies

```bash
npm install
```

### 2.3 Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual configuration:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_URL="postgresql://username:password@localhost:5432/royal_events"

# ==========================================
# SERVER CONFIGURATION
# ==========================================
PORT=5001
NODE_ENV=development

# ==========================================
# JWT CONFIGURATION
# ==========================================
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# ==========================================
# RAFIKI SMS CONFIGURATION
# ==========================================
RAFIKI_BASE_URL=https://api.rafikisms.com
RAFIKI_API_KEY=your_rafiki_api_key_here
RAFIKI_SENDER_ID=ROYALEVENT

# ==========================================
# SNIPPE PAYMENT CONFIGURATION
# ==========================================
SNIPE_API_KEY=your_snipe_api_key_here
SNIPE_SECRET_KEY=your_snipe_secret_key_here
SNIPE_MERCHANT_ID=your_snipe_merchant_id_here

# ==========================================
# FRONTEND URL
# ==========================================
FRONTEND_URL=http://localhost:5173
```

### 2.4 Set Up PostgreSQL Database

1. Create a new PostgreSQL database named `royal_events`:

```sql
CREATE DATABASE royal_events;
```

2. Update the `DATABASE_URL` in your `.env` file with your PostgreSQL credentials.

### 2.5 Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 2.6 Seed the Database (Create Super Admin)

```bash
node src/utils/seed.js
```

This will create a super admin account with:
- **Email:** admin@royalevents.com
- **Password:** Admin@2026

⚠️ **Important:** Change this password after first login!

### 2.7 Start the Backend Server

```bash
npm run dev
```

The backend will start on `http://localhost:5001`

## Step 3: Frontend Setup

### 3.1 Navigate to Frontend Directory

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

### 3.2 Install Frontend Dependencies

```bash
npm install
```

### 3.3 Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
VITE_API_URL=http://localhost:5001
```

### 3.4 Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 4: Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Login with the super admin credentials:
   - Email: `admin@royalevents.com`
   - Password: `Admin@2026`
3. Change your password immediately after first login

## Step 5: Configure External Services

### RafikiSMS Setup

1. Sign up at [RafikiSMS](https://rafikisms.com)
2. Get your API key from the dashboard
3. Request approval for your sender ID (e.g., "ROYALEVENT")
4. Update your `.env` file with:
   - `RAFIKI_API_KEY`
   - `RAFIKI_SENDER_ID`

### Snippe Payment Setup

1. Sign up for Snippe payment gateway
2. Get your API credentials
3. Update your `.env` file with:
   - `SNIPE_API_KEY`
   - `SNIPE_SECRET_KEY`
   - `SNIPE_MERCHANT_ID`

## Step 6: Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in your `.env`
2. Use a production PostgreSQL database
3. Set a strong `JWT_SECRET`
4. Build the backend:
   ```bash
   npm run build
   ```
5. Start the production server:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)
3. Update `VITE_API_URL` to your production backend URL

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check that the database `royal_events` exists

### Port Already in Use

- Change the `PORT` in backend `.env` file
- Change the frontend port by modifying the Vite config

### SMS Not Sending

- Verify RafikiSMS API key is correct
- Check sender ID is approved in RafikiSMS dashboard
- Ensure you have sufficient SMS credits
- Check backend logs for error messages

### Payment Integration Issues

- Verify Snippe API credentials
- Check payment gateway status
- Ensure webhook URLs are correctly configured

## Project Structure

```
royal-events/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── jobs/
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── .env
│   ├── .env.example
│   └── package.json
└── README.md
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the code comments and documentation
- Contact the development team

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Change default passwords** immediately after setup
3. **Use strong JWT secrets** in production
4. **Keep dependencies updated** regularly
5. **Enable HTTPS** in production
6. **Use environment-specific configurations**
7. **Regularly backup your database**
