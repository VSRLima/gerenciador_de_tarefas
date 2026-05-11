import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AppShell = (): JSX.Element => {
  const { authState, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div>
            <div className="eyebrow">Task Manager</div>
            <h1>{authState?.user.displayName ?? authState?.user.username}</h1>
            <p className="muted">
              {authState?.user.role === 'ADMIN'
                ? 'Administrator'
                : 'Basic user'}
            </p>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/">Dashboard</NavLink>
            {authState?.user.role === 'ADMIN' ? (
              <NavLink to="/users">Users</NavLink>
            ) : null}
          </nav>
        </div>

        <button
          className="ghost-button sidebar-logout"
          onClick={() => {
            void logout();
          }}
          type="button"
        >
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
