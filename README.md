# MediBridge-Telemedicine-Platform

MediBridge is a full-stack telemedicine platform designed to connect patients and healthcare professionals for secure, efficient, and accessible medical consultations. The platform leverages modern web technologies, AI-powered symptom checking, and real-time video calls to deliver a seamless telehealth experience.

---

## Features

- **User Authentication:** Secure login and registration using Firebase Auth.
- **Role-Based Access:** Separate dashboards for patients, doctors, and admins.
- **AI Symptom Checker:** FastAPI-powered AI module for symptom analysis and clinical title generation.
- **Appointment Scheduling:** Book, manage, and track appointments with healthcare providers.
- **Video Consultations:** Real-time video calls using Daily.co or Jitsi Meet API.
- **PDF Generation:** Downloadable summaries and prescriptions.
- **Responsive UI:** Modern, mobile-friendly interface built with React and TypeScript.
- **Admin Panel:** Manage users, appointments, and system logs.
- **Database Integration:** PostgreSQL via Supabase for secure data storage.

---

## Project Structure

- **ai_assistant/**: Python FastAPI AI service for symptom checking and chat summarization.
- **backend/**: Node.js/TypeScript backend API for appointments, authentication, and business logic.
- **database/**: Database schema, migrations, and scripts.
- **Frontend/**: React.js + TypeScript frontend application.

---

## Installation

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.10+
- PostgreSQL database (or Supabase account)
- [pip](https://pip.pypa.io/en/stable/)

### 1. Clone the repository

```sh
git clone https://github.com/your-org/MediBridge-Telemedicine-Platform.git
cd MediBridge-Telemedicine-Platform
```

### 2. Install Frontend Dependencies

```sh
cd Frontend
npm install
```

### 3. Install Backend Dependencies

```sh
cd ../backend
npm install
```

### 4. Install AI Assistant Dependencies

```sh
cd ../ai_assistant
pip install -r requirements.txt
```

### 5. Set Up Environment Variables

- Copy `.env.example` files (if available) in each directory to `.env` and fill in your secrets (API keys, database URLs, etc.).

---

## Usage

### Start the AI Assistant (FastAPI)

```sh
cd ai_assistant
uvicorn main:app --reload
```

### Start the Backend API

```sh
cd backend
npm run dev
```

### Start the Frontend

```sh
cd Frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

---

## Example Usage

- **Symptom Checker:** Enter symptoms in the chat to receive AI-generated clinical summaries.
- **Book Appointment:** Log in as a patient, choose a doctor, and schedule a video consultation.
- **Video Call:** Join a scheduled appointment and start a secure video call.
- **Admin Panel:** Manage users and appointments as an admin.

---

## Contributors

See [README.md](README.md) for the full team list and roles.

---

## License

This project is for educational purposes. See LICENSE file if available.