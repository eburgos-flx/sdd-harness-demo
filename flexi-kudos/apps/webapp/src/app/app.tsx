import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { MembersCategoriesProvider } from '../context/MembersCategoriesProvider';
import { KudosWallPage } from '../pages/KudosWallPage';
import { NewKudoPage } from '../pages/NewKudoPage';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MembersCategoriesProvider>
        <div style={layoutStyle}>
          <header style={headerStyle}>
            <Link to="/" style={brandStyle}>
              <span aria-hidden>👏</span>
              <span>Flexi Kudos</span>
            </Link>
          </header>
          <main style={mainStyle}>
            <Routes>
              <Route path="/" element={<KudosWallPage />} />
              <Route path="/nuevo" element={<NewKudoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </MembersCategoriesProvider>
    </BrowserRouter>
  );
}

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f9fafb',
  color: '#111827',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

const headerStyle: React.CSSProperties = {
  padding: '1rem 2rem',
  borderBottom: '1px solid #e5e7eb',
  background: '#fff',
};

const brandStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: '0.5rem',
  alignItems: 'center',
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 700,
  fontSize: '1.1rem',
};

const mainStyle: React.CSSProperties = {
  padding: '2rem',
  maxWidth: '72rem',
  margin: '0 auto',
};
