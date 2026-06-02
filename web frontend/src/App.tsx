import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Home from './pages/student/Home';
import Profile from './pages/student/Profile';
import LearningPath from './pages/student/LearningPath';
import Resources from './pages/student/Resources';
import Tutor from './pages/student/Tutor';
import Quiz from './pages/student/Quiz';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/home" replace />} />
          <Route path="student/home" element={<Home />} />
          <Route path="student/profile" element={<Profile />} />
          <Route path="student/learning-path" element={<LearningPath />} />
          <Route path="student/resources" element={<Resources />} />
          <Route path="student/tutor" element={<Tutor />} />
          <Route path="student/quiz" element={<Quiz />} />
        </Route>
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
