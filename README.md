# Smart Pass Manager (HashSecure)

A modern, secure, and beautiful password manager built with React, Vite, Express, and Supabase.

## 🚀 Getting Started

If you've just cloned this repository, follow these steps to get everything running locally.

### 1. Install Dependencies
In the root directory of the project, run:
```bash
npm install
```

### 2. Database Setup (Supabase)
This project uses **Supabase** for its database.
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of [`database.sql`](file:///c:/Users/viraj/OneDrive/Desktop/Smart_Pass_Manager/database.sql) into the SQL editor and run it. This will create the necessary tables and disable RLS (Row Level Security) for testing.

### 3. Environment Variables
You need to set up environment variables for both the frontend and the backend.

#### Frontend (.env.local)
Create a file named `.env.local` in the **root** directory and add:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (server/.env)
Create a file named `.env` inside the `server/` directory and add:
```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```
*(Note: Use a Gmail App Password, not your regular password, for SMTP to work.)*

### 4. Run the Project
Start both the React frontend and the Express backend simultaneously with one command:
```bash
npm run dev-all
```

## 🛠 Features
- **OTP Authentication**: Login securely via email-based one-time passwords.
- **Vault Management**: Add, view, and manage your passwords securely.
- **Vault PIN**: Encrypt your vault access with a personal PIN.
- **Modern UI**: Built with TailwindCSS and Vite for a lightning-fast experience.

---
Created by [HexCoder404](https://github.com/HexCoder404)
