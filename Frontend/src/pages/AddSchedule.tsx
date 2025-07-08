import React, { useState, useEffect } from 'react';
import './AddSchedule.css';
import supabase from '../lib/supabaseClient';
import { Clock } from 'lucide-react';

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
}

interface TimeValue {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

const ClockTimePicker: React.FC<{
  onTimeSelect: (time: TimeValue) => void;
  selectedTime: TimeValue | null;
  placeholder?: string;
}> = ({ onTimeSelect, selectedTime, placeholder = '--:-- --' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [tempHour, setTempHour] = useState(selectedTime?.hour || 12);
  const [tempMinute, setTempMinute] = useState(selectedTime?.minute || 0);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(selectedTime?.period || 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const getClockPosition = (value: number, max: number, radius = 80) => {
    const angle = (value * 360) / max - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(radian),
      y: 100 + radius * Math.sin(radian)
    };
  };

  const handleClockClick = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    
    if (mode === 'hours') {
      const hour = Math.round(angle / 30) || 12;
      setTempHour(hour);
      setMode('minutes');
    } else {
      const minute = Math.round(angle / 30) * 5;
      setTempMinute(minute === 60 ? 0 : minute);
      
      const finalTime: TimeValue = {
        hour: tempHour,
        minute: minute === 60 ? 0 : minute,
        period: tempPeriod
      };
      onTimeSelect(finalTime);
      setIsOpen(false);
      setMode('hours');
    }
  };

  const formatTime = (time: TimeValue | null): string => {
    if (!time) return placeholder;
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute} ${time.period}`;
  };

  return (
    <div className="clock-time-picker-container">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="clock-time-picker-button"
      >
        <span className="clock-time-picker-text">
          {formatTime(selectedTime)}
        </span>
        <Clock className="clock-time-picker-icon" />
      </button>

      {isOpen && (
        <div className="clock-time-picker-dropdown">
          <div className="clock-time-picker-header">
            <div className="clock-time-picker-mode-title">
              {mode === 'hours' ? 'Select Hour' : 'Select Minutes'}
            </div>
            <div className="clock-time-picker-current-time">
              Current: {formatTime({ hour: tempHour, minute: tempMinute, period: tempPeriod })}
            </div>
          </div>

          <div className="clock-time-picker-clock-container">
            <svg
              width="200"
              height="200"
              className="clock-time-picker-svg"
              onClick={handleClockClick}
            >
              {/* Clock face */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />

              {/* Hour markers or minute markers */}
              {(mode === 'hours' ? hours : minutes).map((value, index) => {
                const pos = getClockPosition(
                  mode === 'hours' ? value === 12 ? 0 : value : index,
                  12,
                  80
                );
                const isSelected = mode === 'hours' ? value === tempHour : value === tempMinute;
                
                return (
                  <g key={value}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="16"
                      fill={isSelected ? '#3b82f6' : '#f3f4f6'}
                      stroke={isSelected ? '#2563eb' : '#d1d5db'}
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`clock-time-picker-number ${isSelected ? 'selected' : ''}`}
                    >
                      {mode === 'hours' ? value : value.toString().padStart(2, '0')}
                    </text>
                  </g>
                );
              })}

              {/* Center dot */}
              <circle cx="100" cy="100" r="3" fill="#3b82f6" />

              {/* Clock hand */}
              {(() => {
                const currentValue = mode === 'hours' ? (tempHour === 12 ? 0 : tempHour) : tempMinute / 5;
                const pos = getClockPosition(currentValue, 12, 65);
                return (
                  <line
                    x1="100"
                    y1="100"
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })()}
            </svg>
          </div>

          {/* AM/PM toggle */}
          <div className="clock-time-picker-ampm">
            <div className="clock-time-picker-ampm-container">
              <button
                type="button"
                onClick={() => setTempPeriod('AM')}
                className={`clock-time-picker-ampm-button ${tempPeriod === 'AM' ? 'active' : ''}`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setTempPeriod('PM')}
                className={`clock-time-picker-ampm-button ${tempPeriod === 'PM' ? 'active' : ''}`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="clock-time-picker-instructions">
            {mode === 'hours' ? 'Click on an hour' : 'Click on minutes'}
          </div>
        </div>
      )}
    </div>
  );
};

const AddSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState<TimeValue | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<TimeValue | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [existingSchedulesData, setExistingSchedulesData] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const timeValueTo24Hour = (time: TimeValue): string => {
    let hour = time.hour;
    if (time.period === 'AM' && hour === 12) hour = 0;
    if (time.period === 'PM' && hour !== 12) hour += 12;
    return `${hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
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

    const startTime24 = timeValueTo24Hour(selectedStartTime);
    const endTime24 = timeValueTo24Hour(selectedEndTime);

    const startDateTime = new Date(`${selectedDate}T${startTime24}:00`);
    const endDateTime = new Date(`${selectedDate}T${endTime24}:00`);

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

    const newStart = new Date(`${selectedDate}T${startTime24}:00`);
    const newEnd = new Date(`${selectedDate}T${endTime24}:00`);

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

    const hasConflict = existingSchedules?.some((schedule) => {
      const existingStart = new Date(schedule.start_time);
      const existingEnd = new Date(schedule.end_time);
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      alert("⚠️ This schedule overlaps with an existing one. Please choose a different time.");
      return;
    }

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
    setSelectedStartTime(null);
    setSelectedEndTime(null);

    await fetchSchedules();
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
              <ClockTimePicker
                selectedTime={selectedStartTime}
                onTimeSelect={setSelectedStartTime}
                placeholder="Select start time"
              />
            </div>
            <div className="input-group">
              <label htmlFor="schedule-end-time">End Time:</label>
              <ClockTimePicker
                selectedTime={selectedEndTime}
                onTimeSelect={setSelectedEndTime}
                placeholder="Select end time"
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
              <p style={{ color: '#800000' }}>No schedules published yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddSchedule;