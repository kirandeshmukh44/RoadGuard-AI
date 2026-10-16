import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();98
  const publicLinks = [['/', 'Overview'], ['/about', 'About'], ['/how-it-works', 'How it works'], ['/map', 'Road map']];
  const privateLinks = [['/dashboard', 'Dashboard'], ['/detect', 'Detect'], ['/report', 'Report'], ['/my-reports', 'My reports'], ['/map', 'Map']];
  const navLinkClass = ({ isActive }) =>
    `rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/70 shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
      <nav className="page-container navbar min-h-[68px] px-0" aria-label="Main navigation">
        <div className="navbar-start gap-2">
          <div className="dropdown">
            <button type="button" tabIndex={0} className="btn btn-ghost btn-square text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Open navigation menu">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
            </button>
            <ul tabIndex={0} className="menu dropdown-content z-[1] mt-3 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl text-slate-700">
              {(user ? [...privateLinks, ['/history', 'History'], ['/profile', 'Profile']] : publicLinks).map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className={`rounded-xl ${location.pathname === to ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-50'}`}>
                    {label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <>
                  <li className="menu-title text-slate-400 font-bold uppercase text-[10px] tracking-wider mt-2">Admin Module</li>
                  <li>
                    <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="text-sky-600 hover:text-sky-700 font-semibold">
                      Open Admin Console ↗
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>

          <Link to="/" className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition hover:opacity-90" aria-label="RoadGuard AI home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 font-bold">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path d="M8 3 5 21M16 3l3 18M12 4v3m0 3v3m0 3v3" strokeLinecap="round" /></svg>
            </span>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              RoadGuard <span className="text-sky-600 font-semibold">AI</span>
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <div className="flex items-center gap-1.5">
            {(user ? privateLinks : publicLinks).map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="navbar-end gap-2.5">
          {user && location.pathname !== '/login' ? (
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn btn-ghost h-10 gap-2.5 rounded-xl px-3 border border-slate-200/80 bg-slate-50 hover:bg-slate-100" aria-label="Open account menu">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-xs">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-800 sm:inline">
                  {user.username}
                </span>
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3 text-slate-500" fill="currentColor"><path d="m3 6 5 5 5-5z" /></svg>
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-[1] mt-3 w-60 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xl text-slate-700">
                <li className="menu-title text-slate-400 font-bold uppercase text-[10px] tracking-wider">Your workspace</li>
                <li><Link to="/dashboard" className="rounded-xl hover:bg-slate-50">Dashboard</Link></li>
                <li><Link to="/detect" className="rounded-xl hover:bg-slate-50">Detect potholes</Link></li>
                <li><Link to="/report" className="rounded-xl hover:bg-slate-50">Report a pothole</Link></li>
                <li><Link to="/my-reports" className="rounded-xl hover:bg-slate-50">My reports</Link></li>
                <li><Link to="/map" className="rounded-xl hover:bg-slate-50">Shared pothole map</Link></li>
                <li><Link to="/history" className="rounded-xl hover:bg-slate-50">Detection history</Link></li>
                <li><Link to="/profile" className="rounded-xl hover:bg-slate-50">Profile</Link></li>
                {isAdmin && (
                  <>
                    <li className="menu-title text-slate-400 font-bold uppercase text-[10px] tracking-wider mt-2">Admin Module</li>
                    <li><a href="http://localhost:5174" target="_blank" rel="noreferrer" className="text-sky-600 hover:text-sky-700 font-semibold rounded-xl hover:bg-slate-50">Open Admin Console ↗</a></li>
                  </>
                )}
                <li className="mt-1.5 border-t border-slate-100 pt-1.5">
                  <button onClick={logout} className="text-rose-600 hover:text-rose-700 font-semibold rounded-xl hover:bg-rose-50">Sign out</button>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm px-3.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm rounded-xl px-4.5 font-bold shadow-md shadow-sky-500/20 transition active:scale-95">
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
