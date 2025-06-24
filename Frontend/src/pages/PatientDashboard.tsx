import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "./PatientDashboard.css";
import logo from "../assets/MediBridge_LogoClear.png";

// Subcomponents (same as before, no changes needed)
const PatientDashboardSection: React.FC = () => {
    const patientInfo = {
        name: "John Doe",
        age: 45,
        gender: "Male",
        lastVisit: "June 20, 2025",
        nextAppointment: "July 5, 2025",
    };

    return (
        <div className="card-base patient-dashboard-section">
            <h3 className="patient-dashboard-section-title">📈 Patient Overview</h3>
            <div className="card-content patient-dashboard-section-content">
                <p><strong>Name:</strong> {patientInfo.name}</p>
                <p><strong>Age:</strong> {patientInfo.age}</p>
                <p><strong>Gender:</strong> {patientInfo.gender}</p>
                <p><strong>Last Visit:</strong> {patientInfo.lastVisit}</p>
                <p><strong>Next Appointment:</strong> {patientInfo.nextAppointment}</p>
            </div>
        </div>
    );
};

const NotesSection: React.FC = () => {
    const [patientNotes, setPatientNotes] = useState([
        "The patient wants to get off manual chart",
        "Treatment should continue with glucose plan",
        "Allergy: sensitive to penicillin",
    ]);
    const [newNote, setNewNote] = useState("");

    const handleAddNote = () => {
        if (newNote.trim() !== "") {
            setPatientNotes([...patientNotes, newNote.trim()]);
            setNewNote("");
        }
    };

    return (
        <div className="card-base notes-section">
            <h3 className="notes-title">📝 Patient Notes</h3>
            <div className="card-content">
                <ul className="notes-list">
                    {patientNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                    ))}
                </ul>
                <textarea
                    className="add-note-textarea"
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                ></textarea>
                <button className="add-note-button" onClick={handleAddNote}>Add Note</button>
            </div>
        </div>
    );
};

const ConsultationAppointmentsSection: React.FC = () => {
    const upcomingAppointments = [
        { id: 1, date: "July 5, 2025", time: "10:00 AM", doctor: "Dr. Alex Smith", type: "Video Call" },
        { id: 2, date: "July 12, 2025", time: "02:30 PM", doctor: "Dr. Sarah Lee", type: "In-person" },
    ];

    const pastAppointments = [
        { id: 3, date: "June 20, 2025", time: "11:00 AM", doctor: "Dr. Jane Doe", type: "Video Call" },
        { id: 4, date: "May 15, 2025", time: "09:00 AM", doctor: "Dr. John Brown", type: "Video Call" },
    ];

    return (
        <div className="card-base consultation-section">
            <h3 className="consultation-section-title">🗓️ Consultation Appointments</h3>
            <div className="card-content">
                <h4>Upcoming Appointments:</h4>
                <ul className="consultation-list">
                    {upcomingAppointments.map(app => (
                        <li key={app.id}>
                            <strong>{app.date} at {app.time}</strong> with {app.doctor} ({app.type})
                        </li>
                    ))}
                </ul>
                <h4>Past Appointments:</h4>
                <ul className="consultation-list">
                    {pastAppointments.map(app => (
                        <li key={app.id}>
                            <strong>{app.date} at {app.time}</strong> with {app.doctor} ({app.type})
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const PrescriptionsSection: React.FC = () => {
    const prescriptions = [
        "Amlodipine 5mg 💊 1x daily (morning)",
        "Losartan 50mg 💊 1x daily (evening)",
        "Metformin 500mg 💊 2x daily (with meals)",
        "Insulin Glargine 10 units 💉 1x daily (bedtime)",
        "Vitamin D3 1000 IU 💊 1x daily",
    ];

    return (
        <div className="card-base prescriptions-section">
            <h3 className="prescriptions-title">💊 Prescriptions</h3>
            <div className="card-content">
                <ul className="prescriptions-list">
                    {prescriptions.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const MedicalHistorySection: React.FC = () => {
    const history = [
        { date: "April 10, 2025", doctor: "Dr. Reyes", diagnosis: "Diagnosed with flu. Prescribed medication and rest." },
        { date: "March 5, 2025", doctor: "Dr. Cruz", diagnosis: "Routine check-up. All vitals normal." },
    ];

    return (
        <div className="card-base medical-history-section">
            <h3 className="medical-history-title">🩺 Medical History</h3>
            <div className="card-content">
                <ul className="medical-history-list">
                    {history.map((entry, index) => (
                        <li key={index} className="medical-history-item">
                            <strong>{entry.date} – {entry.doctor}</strong><br />
                            {entry.diagnosis}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const PatientDashboard: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    return (
        <div className="patientdash-container">
            {/* ✅ Home-style Navbar using Links */}
            <nav className="navbar">
                <div className="logo">
                    <img src={logo} alt="MediBridge Logo" className="logo-img" />
                    <span className="logo-text">MediBridge</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/patientdashboard" className="nav-item-new">Dashboard</Link></li>
                    <li><Link to="/appointments" className="nav-item-new">Appointments</Link></li>
                    <li><Link to="/messages" className="nav-item-new">Messages</Link></li>
                    <li><Link to="/chatbot" className="nav-item-new">Chatbot</Link></li>
                    <li><Link to="/" className="nav-item-new">Logout</Link></li>
                </ul>
            </nav>

            <main className="main-content-area">
                <div className="top-info-bar">
                    <h1 className="page-title">Patient Dashboard</h1>
                    <div className="welcome-and-profile">
                        <div className="profile-image-container">
                            <img src="/images/patient-avatar.png" alt="Patient" className="profile-image" />
                        </div>
                        <div className="welcome-text-group">
                            <span className="medical-profile-label">Medical Profile</span>
                            <span className="welcome-message">Welcome, Ligma balls</span>
                        </div>
                    </div>
                    <div className="current-timestamp">{`${formattedTime} · ${formattedDate}`}</div>
                </div>

                <section className="dashboard-section card-margin-bottom"><PatientDashboardSection /></section>
                <section className="notes-section card-margin-bottom"><NotesSection /></section>
                <section className="consultation-section card-margin-bottom"><ConsultationAppointmentsSection /></section>
                <section className="prescriptions-section card-margin-bottom"><PrescriptionsSection /></section>
                <section className="medical-history-section card-margin-bottom"><MedicalHistorySection /></section>
            </main>
        </div>
    );
};

export default PatientDashboard;