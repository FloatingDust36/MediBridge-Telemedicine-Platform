import React, { useState, useEffect } from 'react';
import './AddSchedule.css';
import supabase from '../lib/supabaseClient';

interface ScheduleItem {
  id: string; // UUID from database
  date: string;
  time: string;
}



const AddSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [existingSchedulesData, setExistingSchedulesData] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  const formatTime12Hour = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const fetchSchedules = async () => {
  setIsLoading(true);

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error fetching user:", userError?.message);
    alert("User not authenticated.");
    setIsLoading(false);
    return;
  }

  // ✅ Filter schedules by logged-in doctor only
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("id, start_time, end_time")
    .eq("doctor_id", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching schedules:", error.message);
    alert("❌ Failed to load schedules.");
    setIsLoading(false);
    return;
  }

  // Transform for display
  const formatted = data.map((schedule) => {
    const start = new Date(schedule.start_time);
    const end = new Date(schedule.end_time);

    return {
      id: schedule.id,
      date: start.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: `${start.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })} - ${end.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`,
    };
  });

  setExistingSchedulesData(formatted);
  setIsLoading(false);
};


  const handlePublishSchedule = async () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      alert('Please select a date, start time, and end time for your schedule.');
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`);
    const endDateTime = new Date(`${selectedDate}T${selectedEndTime}:00`);

    if (endDateTime <= startDateTime) {
      alert('End time must be after start time.');
      return;
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('User not authenticated.');
      return;
    }

    // Convert selected times to Date objects
const newStart = new Date(`${selectedDate}T${selectedStartTime}:00`);
const newEnd = new Date(`${selectedDate}T${selectedEndTime}:00`);

// 1. Fetch existing schedules for this doctor on the selected day
const { data: existingSchedules, error: fetchError } = await supabase
  .from('doctor_schedules')
  .select('start_time, end_time')
  .eq('doctor_id', user.id)
  .gte('start_time', new Date(`${selectedDate}T00:00:00`).toISOString())
  .lt('start_time', new Date(`${selectedDate}T23:59:59`).toISOString());

if (fetchError) {
  console.error("Failed to check for conflicts:", fetchError.message);
  alert("❌ Could not verify schedule conflicts.");
  return;
}

// 2. Check for overlapping
const hasConflict = existingSchedules?.some((schedule) => {
  const existingStart = new Date(schedule.start_time);
  const existingEnd = new Date(schedule.end_time);
  return newStart < existingEnd && newEnd > existingStart;
});

if (hasConflict) {
  alert("⚠️ This schedule overlaps with an existing one. Please choose a different time.");
  return;
}

// 3. Insert into database if no conflict
const { error: insertError } = await supabase
  .from("doctor_schedules")
  .insert([
    {
      doctor_id: user.id,
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    },
  ]);

if (insertError) {
  console.error("Error inserting schedule:", insertError.message);
  alert("❌ Failed to publish schedule. Please try again.");
  return;
}


    alert(`✅ Schedule successfully published!`);
    setSelectedDate('');
    setSelectedStartTime('');
    setSelectedEndTime('');

    await fetchSchedules(); // Reload schedules after successful insert
  };

  const handleDeleteSchedule = async (idToDelete: string) => {
  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", idToDelete);

  if (error) {
    console.error("Failed to delete schedule:", error.message);
    alert("❌ Failed to delete schedule.");
    return;
  }

  // Remove from UI after successful DB delete
  setExistingSchedulesData(prev => prev.filter(schedule => schedule.id !== idToDelete));
  alert(`🗑️ Schedule deleted successfully.`);
};


  useEffect(() => {
    fetchSchedules();
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
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="schedule-start-time">Start Time:</label>
              <input
                type="time"
                id="schedule-start-time"
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="schedule-end-time">End Time:</label>
              <input
                type="time"
                id="schedule-end-time"
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            className="publish-schedule-button"
            onClick={handlePublishSchedule}
            disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
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
