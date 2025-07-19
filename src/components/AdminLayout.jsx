import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MobileCheck from './MobileCheck';
import { useMobile } from '../contexts/MobileContext';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { user, isAdmin, adminLoading, logout } = useAuth();
  const location = useLocation();
  const { isMobile } = useMobile();

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      // 현재 경로가 유효한지 확인 (HashRouter 경로)
      const validPaths = ['/', '/menus', '/content', '/notice'];
      if (!validPaths.includes(location.pathname)) {
        // 유효하지 않은 경로면 대시보드로 리다이렉트
        navigate('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate]);

  // 인증 상태 확인
  useEffect(() => {
    if (!adminLoading) {
      if (!user || !isAdmin) {
        navigate('/login');
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  if (adminLoading) return <div className="admin-loading">로딩 중...</div>;
  if (!user || !isAdmin) return null;

  if (isMobile) {
    return <MobileCheck />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>UOSVD Admin</h2>
        <nav>
          <ul>
            <li className={location.pathname === '/' ? 'active' : ''}>
              <Link to="/">대시보드</Link>
            </li>
            <li className={location.pathname === '/menus' ? 'active' : ''}>
              <Link to="/menus">메뉴 관리</Link>
            </li>
            <li className={location.pathname === '/content' ? 'active' : ''}>
              <Link to="/content">콘텐츠 관리</Link>
            </li>
            <li className={location.pathname === '/notice' ? 'active' : ''}>
              <Link to="/notice">공지사항 관리</Link>
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
