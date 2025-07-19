import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllDocuments, getDocument } from '../lib/firebaseFirestore';
import Layout from '../components/Layout';
import 'react-quill/dist/quill.snow.css';
import '../styles/Layout.css';
import '../styles/common.css';
import '../styles/Notice.css';

const NoticeBoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuTitle, setMenuTitle] = useState('공지사항');

  useEffect(() => {
    Promise.all([fetchNotice(), fetchMenuTitle()]);
  }, [id]);

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

  const fetchNotice = async () => {
    try {
      const { data, error } = await getDocument('notices', id);

      if (error) throw error;
      setNotice(data);
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
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleBack = () => {
    navigate('/notices');
  };

  if (loading) {
    return (
      <Layout>
        <h1 className="page-title">{menuTitle}</h1>
        <div className="loading">로딩 중...</div>
      </Layout>
    );
  }

  if (!notice) {
    return (
      <Layout>
        <h1 className="page-title">{menuTitle}</h1>
        <div className="notice-not-found">공지사항을 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="page-title">{menuTitle}</h1>
      <div className="notice-detail-container">
        <h2>{notice.title}</h2>
        
        <div className="notice-meta">
          <p><span>작성일</span>{formatDate(notice.createdAt)}</p>
          <p><span>조회수</span>{notice.views || 0}</p>
        </div>

        {/* 이미지 배열이 있으면 본문 위에 모두 렌더링 */}
        {Array.isArray(notice.imageUrls) && notice.imageUrls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {notice.imageUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`공지 이미지 ${idx + 1}`}
                style={{ maxWidth: '100%', marginBottom: 8, display: 'block' }}
              />
            ))}
          </div>
        )}

        <div className="notice-content" dangerouslySetInnerHTML={{ __html: notice.content }} />

        {notice.files && notice.files.length > 0 && (
          <div className="notice-files">
            <h3>첨부파일</h3>
            <ul>
              {notice.files.map((file, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleFileDownload(file.url, file.name)}
                    className="file-download-button"
                  >
                    {file.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={handleBack} className="back-button">목록으로</button>
      </div>
    </Layout>
  );
};

export default NoticeBoardDetail; 