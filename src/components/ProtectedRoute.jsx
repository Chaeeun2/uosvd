import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
