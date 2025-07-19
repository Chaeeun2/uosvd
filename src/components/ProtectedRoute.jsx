import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const location = useLocation();

  if (loading || adminLoading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // 관리자 권한이 없는 사용자는 대시보드로 리디렉션
    return <Navigate to="/" replace />;
  }

  return children;
}
