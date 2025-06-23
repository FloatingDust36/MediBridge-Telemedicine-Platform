// src/pages/NotesSection.tsx
import React, { useState } from 'react';
import './NotesSection.css'; // Import its own CSS

const NotesSection = () => {
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
    <div className="card-base notes-section"> {/* Uses card-base from Patientdash.css */}
      <h3 className="notes-title">
        📝 Patient Notes
      </h3>
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
        <button
          className="add-note-button"
          onClick={handleAddNote}
        >
          Add Note
        </button>
      </div>
    </div>
  );
};

export default NotesSection;