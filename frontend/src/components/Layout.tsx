import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, FileText, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/documents', icon: FileText, label: 'Documents' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          MOZ<span style={{ color: '#04a89a' }}>U</span>K
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={onLogout} style={{ width: '100%' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
