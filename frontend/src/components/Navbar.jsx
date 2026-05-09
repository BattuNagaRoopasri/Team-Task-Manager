import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
      <div className="container flex justify-between items-center">
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <LayoutDashboard size={24} style={{ color: 'var(--primary-color)' }} />
          Nexus<span style={{ color: 'var(--primary-color)' }}>Wave</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                   {user.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</span>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  <LayoutDashboard size={18} style={{ marginRight: '0.5rem' }} /> Dashboard
                </Link>
                <Link to="/projects" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Projects
                </Link>
              </div>
              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
