import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/student/home', label: '学习首页', icon: '🏠' },
  { path: '/student/profile', label: '学生画像', icon: '👤' },
  { path: '/student/learning-path', label: '学习路径', icon: '📚' },
  { path: '/student/resources', label: '资源生成', icon: '📄' },
  { path: '/student/tutor', label: '智能答疑', icon: '💬' },
  { path: '/student/quiz', label: '测验评估', icon: '📝' },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          🎓 智学工坊
        </div>
        <nav className="nav-menu">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            当前用户: {user?.username}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
            退出登录
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
