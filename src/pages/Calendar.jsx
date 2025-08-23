import './calendar.css';
import { useState } from 'react';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Build calendar grid
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={"empty-" + i} className="calendar-day empty"></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(<div key={d} className="calendar-day">{d}</div>);
  }

  function prevMonth() {
    setMonth(m => {
      if (m === 0) {
        setYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  }
  function nextMonth() {
    setMonth(m => {
      if (m === 11) {
        setYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  return (
    <div className="page-container calendar-flex-row">
      <div className="calendar-col calendar-col-left">
        <div className="calendar-filter-bar">
          <select className="calendar-filter-select">
            <option>All Topics</option>
            <option>Space</option>
            <option>Science</option>
            <option>Tech</option>
          </select>
          <select className="calendar-filter-select">
            <option>All Languages</option>
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
          <input className="calendar-filter-search" type="text" placeholder="Search host..." />
          <button className="calendar-filter-clear">Clear Filters</button>
        </div>
        <div className="calendar-content">
          <div className="calendar-widget">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={prevMonth}>&lt;</button>
              {monthNames[month]} {year}
              <button className="calendar-nav-btn" onClick={nextMonth}>&gt;</button>
            </div>
            <div className="calendar-grid">
              <div className="calendar-day calendar-day-label">Sun</div>
              <div className="calendar-day calendar-day-label">Mon</div>
              <div className="calendar-day calendar-day-label">Tue</div>
              <div className="calendar-day calendar-day-label">Wed</div>
              <div className="calendar-day calendar-day-label">Thu</div>
              <div className="calendar-day calendar-day-label">Fri</div>
              <div className="calendar-day calendar-day-label">Sat</div>
              {days}
            </div>
          </div>
        </div>
      </div>
      <div className="calendar-col calendar-col-right">
        <div className="calendar-content">Right Side (1/2)<br/>Put your details or upcoming events here.</div>
      </div>
    </div>
  );
}
