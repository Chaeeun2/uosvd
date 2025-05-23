import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import '../../styles/admin.css';
import { useMobile } from '../../contexts/MobileContext';
import MobileCheck from '../../components/MobileCheck';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user && user.email === import.meta.env.VITE_ADMIN_EMAIL) {
      navigate('/');
    }
  }, [user, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // 세션 확인
      const session = await supabase.auth.getSession();
      console.log('session:', session);
      const { data: { user } } = await supabase.auth.getUser();
      console.log('user:', user);
      if (!(user && user.email === import.meta.env.VITE_ADMIN_EMAIL)) {
        setError('관리자 계정이 아닙니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('로그인에 실패했습니다: ' + (error.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  if (isMobile) {
    return <MobileCheck />;
  }

  return (
    <div className="admin-login">
      <form onSubmit={handleLogin} className="admin-form">
              <h2 className="admin-page-title">UOSVD Admin</h2>
              <div className="admin-login-guide">관리자 계정은 학과사무실로 문의 바랍니다.<br />시크릿 브라우저에서는 로그인이 불가능합니다.</div>
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
          />
        </div>
        <button type="submit" disabled={loading} className="admin-button">
          {loading ? '로그인 중...' : '관리자 로그인'}
        </button>
      </form>
    </div>
  );
}
