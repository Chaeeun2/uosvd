import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import '../styles/Layout.css';
import '../styles/common.css';
import '../styles/Notice.css';

const NoticeBoard = () => {
  const [notices, setNotices] = useState({ important: [], regular: [] });
  const [loading, setLoading] = useState(true);
  const [menuTitle, setMenuTitle] = useState('공지');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchNotices(), fetchMenuTitle()]);
  }, [currentPage]);

  const fetchMenuTitle = async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('title')
        .eq('slug', 'notices')
        .single();

      if (error) throw error;
      if (data) {
        setMenuTitle(data.title);
      }
    } catch (error) {
      console.error('메뉴 정보 로딩 실패:', error);
    }
  };

  const fetchNotices = async () => {
    try {
      // 중요 공지사항 조회 (페이지네이션 없이 모두 조회)
      const { data: importantNotices, error: importantError } = await supabase
        .from('notices')
        .select('*')
        .eq('is_important', true)
        .order('created_at', { ascending: false });

      if (importantError) throw importantError;

      // 일반 공지사항 전체 개수 조회 (중요 공지 제외)
      const { count, error: countError } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_important', false);

      if (countError) throw countError;
      setTotalCount(count);

      // 일반 공지사항 페이지네이션 조회
      const { data: regularNotices, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_important', false)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      
      setNotices({
        important: importantNotices || [],
        regular: regularNotices || []
      });
    } catch (error) {
      console.error('공지사항 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleNoticeClick = async (notice) => {
    try {
      await supabase.rpc('increment_notice_views', { notice_id: notice.id });
      navigate(`/notices/${notice.id}`);
    } catch (error) {
      console.error('조회수 업데이트 실패:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const pageGroupSize = 5; // 한 번에 표시할 페이지 수
  const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        {totalPages > pageGroupSize && currentGroup > 0 && (
          <button 
            onClick={() => handlePageChange(startPage - 1)}
          >
            이전
          </button>
        )}
        {Array.from(
          { length: endPage - startPage + 1 }, 
          (_, i) => startPage + i
        ).map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page}
          </button>
        ))}
        {totalPages > pageGroupSize && endPage < totalPages && (
          <button 
            onClick={() => handlePageChange(endPage + 1)}
          >
            다음
          </button>
        )}
      </div>
    );
  };

  const renderNoticeRow = (notice, isImportant = false) => (
    <tr 
      key={notice.id} 
      onClick={() => handleNoticeClick(notice)} 
      style={{ cursor: 'pointer' }}
      className={isImportant ? 'important-row' : ''}
    >
      <td className="notice-title">
        {notice.title}
      </td>
      <td className="notice-date">{formatDate(notice.created_at)}</td>
      <td className="notice-views">{notice.views || 0}</td>
      <td className="notice-meta-cell" colSpan="2">
        <div className="notice-meta-row">
          <span className="notice-date">{formatDate(notice.created_at)}</span>
          <span className="notice-sep">ㅣ</span>
          <span className="notice-views">조회수 {notice.views || 0}</span>
        </div>
      </td>
    </tr>
  );

  return (
    <Layout>
      <h1 className="page-title">{menuTitle}</h1>
      <div className="notice-board">
        {loading ? (
          <></>
        ) : (
          <>
            <table className="notice-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성일</th>
                  <th>조회수</th>
                </tr>
              </thead>
              <tbody>
                {notices.important.map(notice => renderNoticeRow(notice, true))}
                {notices.regular.length > 0 ? (
                  notices.regular.map(notice => renderNoticeRow(notice))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-data">등록된 공지사항이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {renderPagination()}
          </>
        )}
      </div>
    </Layout>
  );
};

export default NoticeBoard;
