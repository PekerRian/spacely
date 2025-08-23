import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './navbar.css';
import User from './pages/User.jsx';
import Calendar from './pages/Calendar.jsx';
import Ecosystem from './pages/Ecosystem.jsx';
import { WalletProvider } from './contexts/WalletContext';
import { WalletConnect } from './components/WalletConnect';

function Starfield() {
  // Spiral starfield: each star gets a unique angle and speed
  const stars = Array.from({ length: 80 }).map((_, i) => {
    const size = Math.random() * 2 + 1;
    const angle = Math.random() * 2 * Math.PI; // random angle in radians
    const spiralTurns = Math.random() * 2 + 1.5; // 1.5 to 3.5 turns
    const duration = Math.random() * 3 + 12; // 8s to 16s (slower)
    const delay = Math.random() * 6;
    const opacity = Math.random() * 0.5 + 0.5;
    // Each star will animate from center (50vw, 50vh) outward in a spiral
    return (
      <div
        key={i}
        className="star spiral-star"
        style={{
          width: size + 'px',
          height: size + 'px',
          left: '50vw',
          top: '50vh',
          opacity,
          // Custom properties for animation
          '--spiral-angle': angle + 'rad',
          '--spiral-turns': spiralTurns,
          animationDuration: duration + 's',
          animationDelay: delay + 's',
        }}
      />
    );
  });
  return <div className="stars">{stars}</div>;
}

function App() {
  return (
    <WalletProvider>
      <Router>
        <div>
          <Starfield />
          <nav className="navbar">
            <div className="navbar-container">
              <div className="navbar-links">
                <NavLink to="/user" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>👾 USER</NavLink>
                <NavLink to="/calendar" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>🛸 CALENDAR</NavLink>
                <NavLink to="/ecosystem" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>🚀 ECOSYSTEM</NavLink>
              </div>
              <WalletConnect />
            </div>
          </nav>
          <Routes>
            <Route path="/user" element={<User />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/ecosystem" element={<Ecosystem />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
