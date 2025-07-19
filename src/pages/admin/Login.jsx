import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin.css';
import { useMobile } from '../../contexts/MobileContext';
import MobileCheck from '../../components/MobileCheck';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const { user, isAdmin, adminLoading, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // 이미 로그인되어 있고 관리자인 경우 대시보드로 이동
    if (user && isAdmin && !adminLoading) {
      navigate('/'); // HashRouter에서는 루트 경로로 이동
    }
  }, [user, isAdmin, adminLoading, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { success, error: loginError } = await login(credentials.email, credentials.password);
      
      if (!success) {
        setError(loginError);
        return;
      }

      // 관리자 권한 확인은 AuthContext에서 자동으로 처리됨
    } catch (error) {
      setError('로그인에 실패했습니다: ' + (error.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  if (isMobile) {
    return <MobileCheck />;
  }

  // 로딩 중이거나 이미 로그인된 경우
  if (adminLoading || (user && isAdmin)) {
    return (
      <div className="admin-login">
        <div className="admin-form">
          <h2 className="admin-page-title">UOSVD Admin</h2>
          <div className="admin-loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <form onSubmit={handleLogin} className="admin-form">
        <h2 className="admin-page-title">UOSVD Admin</h2>
        <div className="admin-login-guide">
          관리자 계정은 학과사무실로 문의 바랍니다.<br />
          시크릿 브라우저에서는 로그인이 불가능할 수 있습니다.
        </div>
        {error && <div className="admin-error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            className="admin-input"
            required
            autoComplete="username"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="admin-input"
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="admin-button">
          {loading ? '로그인 중...' : '관리자 로그인'}
        </button>
      </form>
    </div>
  );
}
