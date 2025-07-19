import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDocuments } from '../../lib/firebaseFirestore';
import { getVisitorStats } from '../../lib/visitorStats';
import AdminLayout from '../../components/AdminLayout';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    menuCount: 0,
    contentCount: 0,
    noticeCount: 0,
    todayVisits: 0,
    monthlyVisits: 0
  });
  const [recentContents, setRecentContents] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentData();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      // 메뉴 개수
      const { data: menus, error: menuError } = await getAllDocuments('menus');
      if (menuError) throw menuError;
      
      // 콘텐츠 개수
      const { data: contents, error: contentError } = await getAllDocuments('contents');
      if (contentError) throw contentError;
      
      // 공지사항 개수
      const { data: notices, error: noticeError } = await getAllDocuments('notices');
      if (noticeError) throw noticeError;

      // 방문자 통계 조회
      const visitorStats = await getVisitorStats();
      
      setStats({
        menuCount: menus.length,
        contentCount: contents.length,
        noticeCount: notices.length,
        todayVisits: visitorStats.todayVisits,
        monthlyVisits: visitorStats.monthlyVisits
      });
    } catch (error) {
      // 통계 조회 오류 처리
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentData() {
    try {
      // 최근 콘텐츠 5개
      const { data: contents, error: contentsError } = await getAllDocuments('contents', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: 5
      });

      if (contentsError) throw contentsError;
      setRecentContents(contents || []);

      // 최근 공지사항 5개
      const { data: notices, error: noticesError } = await getAllDocuments('notices', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: 5
      });

      if (noticesError) throw noticesError;
      setRecentNotices(notices || []);
    } catch (error) {
      // 최근 데이터 로딩 실패 처리
    }
  }

  // 현재 월 이름 가져오기
  const currentMonth = new Date().toLocaleString('ko-KR', { month: 'long' });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="admin-content">
        <h2 className="admin-page-title">대시보드</h2>
        <div className="admin-content-layout">
          <div className="admin-content-main">
            {loading ? (
              <div className="admin-loading">로딩 중...</div>
            ) : (
              <>
                {/* 통계 섹션 */}
                <div className="admin-content-header">
                  <h3 className="admin-content-title">사이트 현황</h3>
                </div>
                <div className="admin-dashboard-guide">
                  <p>UOSVD 관리자 페이지에 오신 것을 환영합니다.<br />왼쪽 메뉴에서 관리할 항목을 선택해주세요.</p>
                </div>
                <div className="admin-dashboard-stats">
                  <div className="admin-stat-item">
                    <h4>오늘 방문자</h4>
                    <p>{stats.todayVisits}명</p>
                  </div>
                  <div className="admin-stat-item">
                    <h4>{currentMonth} 방문자</h4>
                    <p>{stats.monthlyVisits}명</p>
                  </div>
                  <div className="admin-stat-item">
                    <h4>메뉴</h4>
                    <p>{stats.menuCount}개</p>
                  </div>
                  <div className="admin-stat-item">
                    <h4>콘텐츠</h4>
                    <p>{stats.contentCount}개</p>
                  </div>
                  <div className="admin-stat-item">
                    <h4>공지사항</h4>
                    <p>{stats.noticeCount}개</p>
                  </div>
                </div>

                {/* 최근 콘텐츠 섹션 */}
                <div className="admin-dashboard-recent">
                  <div className="admin-recent-section">
                    <div className="admin-content-header">
                      <h3 className="admin-content-title">최근 추가된 콘텐츠</h3>
                      <button 
                        onClick={() => navigate('/content')} 
                        className="admin-button"
                      >
                        콘텐츠 관리
                      </button>
                    </div>
                    <div className="admin-recent-list">
                      {recentContents.length > 0 ? (
                        recentContents.map(content => (
                          <div key={content.id} className="admin-recent-item">
                            <span className="admin-recent-title">{content.title}</span>
                            <span className="admin-recent-date">{formatDate(content.createdAt)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="admin-no-items">등록된 콘텐츠가 없습니다.</div>
                      )}
                    </div>
                  </div>

                  {/* 최근 공지사항 섹션 */}
                  <div className="admin-recent-section">
                    <div className="admin-content-header">
                      <h3 className="admin-content-title">최근 공지사항</h3>
                      <button 
                        onClick={() => navigate('/notice')} 
                        className="admin-button"
                      >
                        공지사항 관리
                      </button>
                    </div>
                    <div className="admin-recent-list">
                      {recentNotices.length > 0 ? (
                        recentNotices.map(notice => (
                          <div key={notice.id} className="admin-recent-item">
                            <span className="admin-recent-title">{notice.title}</span>
                            <span className="admin-recent-date">{formatDate(notice.createdAt)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="admin-no-items">등록된 공지사항이 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
