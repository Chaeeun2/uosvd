import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DynamicPage from './pages/DynamicPage';
import NoticeBoard from './pages/NoticeBoard';
import NoticeBoardDetail from './pages/NoticeBoardDetail';
import Dashboard from './pages/admin/Dashboard';
import MenuManager from './pages/admin/MenuManager';
import ContentManager from './pages/admin/ContentManager';
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { MobileProvider } from './contexts/MobileContext';
import NoticeManager from './pages/admin/NoticeManager';
import { supabase } from './lib/supabase';
import AdminLayout from './components/AdminLayout';

function App() {
  useEffect(() => {
    const countVisit = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 오늘 방문 여부 확인
        const lastVisit = localStorage.getItem('lastVisit');
        if (lastVisit === today) {
          // 이미 오늘 방문한 경우
          return;
        }

        // 오늘 날짜의 방문 기록 확인
        const { data: existingVisit } = await supabase
          .from('visits')
          .select('*')
          .eq('visit_date', today);

        if (existingVisit && existingVisit.length > 0) {
          // 기존 방문 기록이 있으면 카운트 증가
          await supabase
            .from('visits')
            .update({ count: existingVisit[0].count + 1 })
            .eq('visit_date', today);
        } else {
          // 새로운 날짜의 첫 방문이면 새 레코드 생성
          await supabase
            .from('visits')
            .insert([{ visit_date: today, count: 1 }]);
        }

        // 방문 날짜 저장
        localStorage.setItem('lastVisit', today);
      } catch (error) {
        console.error('방문자 수 카운트 실패:', error);
      }
    };

    // 관리자 페이지 방문은 카운트하지 않음
    if (!window.location.pathname.startsWith('/admin')) {
      countVisit();
    }
  }, []);

  console.log("App 컴포넌트 렌더링");
  return (
    <MobileProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notices" element={<NoticeBoard />} />
            <Route path="/notices/:id" element={<NoticeBoardDetail />} />
            <Route path="/admin/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/menus" 
              element={
                <ProtectedRoute>
                  <MenuManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/content" 
              element={
                <ProtectedRoute>
                  <ContentManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/notice" 
              element={
                <ProtectedRoute>
                  <NoticeManager />
                </ProtectedRoute>
              } 
            />
            <Route path="/:slug" element={<DynamicPage />} />
            <Route path="/:parent/:slug" element={<DynamicPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MobileProvider>
  );
}

export default App;
