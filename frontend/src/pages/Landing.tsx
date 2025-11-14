import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--fg-primary)' }}>
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
          Leada Chat
        </h1>
        <p className="text-xl mb-8" style={{ color: 'var(--fg-secondary)' }}>
          Ihr KI-gestützter Lern- und Umsetzungs-Coach für Führungskräfte
        </p>
        <div className="space-x-4">
          <Link
            to="/login"
            className="inline-block px-8 py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Jetzt starten
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
