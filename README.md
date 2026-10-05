<div align="center">
  <img src="https://via.placeholder.com/150/4F46E5/FFFFFF?text=DevBhoomi" alt="DevBhoomi Logo" width="150" height="150" />
  
  # DevBhoomi — Employee Attendance Management System

  A modern, production-ready full-stack **MERN** application designed to seamlessly manage employee attendance, leave requests, and administrative operations with enterprise-level security.

  [Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Deployment](#deployment) • [License](#license)
</div>

<br/>

## ✨ Features

### 🛡️ **Role-Based Access Control**
- Secure segregation between **Administrators** and **Employees**.
- JWT-based authentication using HTTP-only cookies and refresh token rotation.

### 🏢 **For Employees**
- **Dashboard**: Minimalist interface displaying current attendance status and exact working hours.
- **Mark Attendance**: Interactive time-clock that synchronizes strictly with server time.
- **Leave Requests**: Seamlessly request Casual, Sick, or Short leaves and track approval statuses.

### 👑 **For Administrators**
- **Employee Management**: Create, edit, and suspend employee credentials.
- **Leave Moderation**: Centralized pipeline to Approve or Reject pending employee leaves.
- **Advanced Attendance Logs**: Searchable, filterable ledger of all check-ins and check-outs across the organization.
- **Network Security**: Configure strict IP allowlists to ensure attendance is only marked from the physical office network.

---

## 🛠️ Tech Stack

**Frontend**
- **React.js** + **Vite**: Lightning-fast modern frontend development.
- **Tailwind CSS**: Beautiful, responsive, utility-first styling.
- **React Router**: Client-side routing.
- **Lucide Icons**: Crisp, customizable SVG icon set.

**Backend**
- **Node.js** + **Express**: Robust RESTful API architecture.
- **MongoDB** + **Mongoose**: Flexible NoSQL document database.
- **Bcrypt & JWT**: Ironclad password hashing and stateless session management.
- **Helmet & CORS**: Hardened HTTP headers and cross-origin resource sharing.

---

## 🚀 Installation & Local Development

### 1. Clone the repository
```bash
git clone https://github.com/GauravGauri/Devbhoomi.git
cd Devbhoomi
```

### 2. Setup the Backend
Open a new terminal window:
```bash
cd server
npm install
```
Configure your `.env` file in the `server` directory using `.env.example` as a template, ensuring `MONGODB_URI` points to a valid MongoDB instance.

Generate the initial Administrator account:
```bash
npm run create-admin
```
Start the backend development server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd client
npm install
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## ☁️ Deployment

### Backend (Render)
1. Link this repository to a new Render Web Service.
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Map your environment variables.

### Frontend (Vercel)
1. Link this repository to a new Vercel Project.
2. Root Directory: `client`
3. Framework: `Vite`
4. Add Environment Variable: `VITE_API_URL` pointing to your Render deployment.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
