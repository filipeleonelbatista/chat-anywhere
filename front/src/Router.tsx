import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import App from './App';

const NotFoundRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const roomName = location.pathname.slice(1);

  useEffect(() => {
    if (roomName) {
      navigate(`/?room=${roomName}`);
    }
  }, [roomName, navigate]);

  return null;
};

const RouterComponent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </Router>
  );
};

export default RouterComponent;
