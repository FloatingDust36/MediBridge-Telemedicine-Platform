import React, { useState, useEffect } from 'react';
import './AddSchedule.css';

// Define a type for a schedule item for better type safety
interface ScheduleItem {
  id: number;
  date: string;
  time: string; // This will now store the formatted time range
}

const AddSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState(''); // Renamed for clarity
  const [selectedEndTime, setSelectedEndTime] = useState('');   // New state for end time
  const [currentTime, setCurrentTime] = useState(new Date());

  const [existingSchedulesData, setExistingSchedulesData] = useState<ScheduleItem[]>([
    { id: 1, date: "June 25, 2025", time: "09:00 AM - 12:00 PM" },
    { id: 2, date: "July 3, 2025", time: "01:00 PM - 04:00 PM" },
  ]);

  // Helper function to format time (e.g., "13:00" to "1:00 PM")
  const formatTime12Hour = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handlePublishSchedule = () => {
    // Validate both start and end times
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      alert('Please select a date, start time, and end time for your schedule.');
      return;
    }

    // Basic validation: ensure end time is after start time
    const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`);
    const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`);

    if (endDateTime <= startDateTime) {
      alert('End time must be after start time.');
      return;
    }

    const formattedDateForDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedStartTime = formatTime12Hour(selectedStartTime);
    const formattedEndTime = formatTime12Hour(selectedEndTime);

    const formattedTimeRange = `${formattedStartTime} - ${formattedEndTime}`;

    const newSchedule: ScheduleItem = {
      id: existingSchedulesData.length > 0 ? Math.max(...existingSchedulesData.map(s => s.id)) + 1 : 1,
      date: formattedDateForDisplay,
      time: formattedTimeRange,
    };

    setExistingSchedulesData(prevSchedules => [...prevSchedules, newSchedule]);
    console.log('Publishing schedule:', newSchedule);
    alert(`✅ Schedule successfully published!\n\nDate: ${newSchedule.date}\nTime: ${newSchedule.time}`);

    setSelectedDate('');
    setSelectedStartTime('');
    setSelectedEndTime('');
  };

  const handleDeleteSchedule = (idToDelete: number) => {
    console.log('Attempting to delete schedule with ID:', idToDelete);
    const updatedSchedules = existingSchedulesData.filter(schedule => schedule.id !== idToDelete);
    setExistingSchedulesData(updatedSchedules);
    alert(`🗑️ Schedule with ID ${idToDelete} has been deleted.`);
  };

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
    <div className="main-content-area schedule-page-wrapper">
      <div className="schedule-top-info-bar">
        <h1 className="schedule-page-title">Doctor Schedule Management</h1>
        <span className="schedule-timestamp">{formattedTime} · {formattedDate}</span>
      </div>

      <div className="schedule-content-grid">
        <div className="card-base add-schedule-card">
          <h3 className="card-title">Add New Schedule</h3>

          <div className="schedule-form-section">
            <div className="input-group">
              <label htmlFor="schedule-date">Select Date:</label>
              <input
                type="date"
                id="schedule-date"
                className="schedule-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="schedule-start-time">Select Start Time:</label> {/* Updated label */}
              <input
                type="time"
                id="schedule-start-time"
                className="schedule-time-input" // Reusing this class
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="schedule-end-time">Select End Time:</label> {/* New input field */}
              <input
                type="time"
                id="schedule-end-time"
                className="schedule-time-input" // Reusing this class
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="button"
            className="publish-schedule-button"
            onClick={handlePublishSchedule}
            disabled={!selectedDate || !selectedStartTime || !selectedEndTime} // Disable button until all are selected
          >
            Publish Schedule
          </button>
        </div>

        <div className="card-base existing-schedules-card">
          <h3 className="card-title">Your Published Schedules</h3>
          <ul className="schedule-list">
            {existingSchedulesData.length > 0 ? (
              existingSchedulesData.map((schedule) => (
                <li key={schedule.id} className="schedule-item">
                  <div className="schedule-info">
                    <span className="schedule-details">Date: {schedule.date}</span>
                    <span className="schedule-date-time">Time: {schedule.time}</span>
                  </div>
                  <button
                    className="delete-schedule-button"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    title="Delete Schedule"
                  >
                    🗑️
                  </button>
                </li>
              ))
            ) : (
              <p>No schedules published yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddSchedule;