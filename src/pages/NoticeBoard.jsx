import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDocuments, getDocumentsWithPagination, updateDocument } from '../lib/firebaseFirestore';
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
      const { data, error } = await getAllDocuments('menus', {
        where: [{ field: 'slug', operator: '==', value: 'notices' }],
        limit: 1
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setMenuTitle(data[0].title);
      }
    } catch (error) {
      console.error('메뉴 정보 로딩 실패:', error);
    }
  };

  const fetchNotices = async () => {
    try {
      // 중요 공지사항 조회 (페이지네이션 없이 모두 조회)
      const { data: importantNotices, error: importantError } = await getAllDocuments('notices', {
        where: [{ field: 'isImportant', operator: '==', value: true }],
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      });

      if (importantError) throw importantError;

      // 일반 공지사항 전체 개수 조회 (중요 공지 제외)
      const { data: allRegularNotices, error: countError } = await getAllDocuments('notices', {
        where: [{ field: 'isImportant', operator: '==', value: false }]
      });

      if (countError) throw countError;
      setTotalCount(allRegularNotices.length);

      // 일반 공지사항 페이지네이션 조회
      const { data: regularNotices, error } = await getDocumentsWithPagination('notices', {
        page: currentPage,
        pageSize: itemsPerPage,
        orderByField: 'createdAt',
        orderDirection: 'desc',
        whereConditions: [{ field: 'isImportant', operator: '==', value: false }]
      });

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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleNoticeClick = async (notice) => {
    try {
      // 조회수 증가
      const newViews = (notice.views || 0) + 1;
      await updateDocument('notices', notice.id, { views: newViews });
      navigate(`/notices/${notice.id}`);
    } catch (error) {
      console.error('조회수 업데이트 실패:', error);
      // 조회수 업데이트 실패해도 상세 페이지로 이동
      navigate(`/notices/${notice.id}`);
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
      <td className="notice-date">{formatDate(notice.createdAt)}</td>
      <td className="notice-views">{notice.views || 0}</td>
      <td className="notice-meta-cell" colSpan="2">
        <div className="notice-meta-row">
          <span className="notice-date">{formatDate(notice.createdAt)}</span>
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
          <div className="loading">로딩 중...</div>
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
