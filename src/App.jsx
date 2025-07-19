import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DynamicPage from './pages/DynamicPage';
import NoticeBoard from './pages/NoticeBoard';
import NoticeBoardDetail from './pages/NoticeBoardDetail';
import { AuthProvider } from './contexts/AuthContext';
import { MobileProvider } from './contexts/MobileContext';

function App() {
  console.log("App 컴포넌트 렌더링");
  return (
    <MobileProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notices" element={<NoticeBoard />} />
          <Route path="/notices/:id" element={<NoticeBoardDetail />} />
          <Route path="/:slug" element={<DynamicPage />} />
          <Route path="/:parent/:slug" element={<DynamicPage />} />
        </Routes>
      </AuthProvider>
    </MobileProvider>
  );
}

export default App;
