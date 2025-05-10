import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MobileCheck from './MobileCheck';
import { useMobile } from '../contexts/MobileContext';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { isMobile } = useMobile();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin/login');
        return;
      }

      if (session.user.email === import.meta.env.VITE_ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('관리자 권한 확인 실패:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>로딩 중...</div>;
  if (!isAdmin) return null;

  if (isMobile) {
    return <MobileCheck />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>UOSVD Admin</h2>
        <nav>
          <ul>
            <li className={location.pathname === '/admin' ? 'active' : ''}>
              <Link to="/admin">대시보드</Link>
            </li>
            <li className={location.pathname === '/admin/menus' ? 'active' : ''}>
              <Link to="/admin/menus">메뉴 관리</Link>
            </li>
            <li className={location.pathname === '/admin/content' ? 'active' : ''}>
              <Link to="/admin/content">콘텐츠 관리</Link>
            </li>
            <li className={location.pathname === '/admin/notice' ? 'active' : ''}>
              <Link to="/admin/notice">공지사항 관리</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="admin-content-wrapper">
        {children}
      </div>
    </div>
  );
}
