import { Navigate, Route, Routes } from 'react-router-dom'
import CalendarPage from '@/modules/Calendar/pages/CalendarPage'

/**
 * Two routes, one page.
 *
 * The POC runs both portals' calendars side by side so the differences can be
 * seen as they are built; in Student 2.0 only the student route travels across.
 */
const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/tpo/calendar" replace />} />
    <Route path="/tpo/calendar" element={<CalendarPage title="Campus Calendar — TPO" />} />
    <Route path="/student/calendar" element={<CalendarPage title="Campus Calendar — Student" />} />
    <Route path="*" element={<Navigate to="/tpo/calendar" replace />} />
  </Routes>
)

export default App
