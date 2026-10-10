import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  );
}
