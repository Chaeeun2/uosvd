import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllDocuments } from '../lib/firebaseFirestore';
import Layout from '../components/Layout';
import '../styles/DynamicPage.css';

export default function DynamicPage() {
  const { slug, parent } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    isMounted.current = true; // 마운트 시점에 true로 설정
    
    return () => {
      isMounted.current = false;
    };
  }, []); // 컴포넌트 마운트/언마운트 시에만 실행

  useEffect(() => {
    // admin으로 시작하는 경로는 처리하지 않음
    if (slug?.startsWith('admin')) {
      return;
    }

    let isCurrentRequest = true; // 현재 요청을 추적하기 위한 플래그

    async function fetchData() {
      try {
        if (!isMounted.current) return;
        setLoading(true);

        if (slug === '404') {
          setError('페이지를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        // 전체 메뉴 데이터 조회
        const { data: allMenus, error: menuError } = await getAllDocuments('menus');

        if (!isCurrentRequest) return; // 요청이 더 이상 유효하지 않으면 중단

        if (menuError) {
          throw menuError;
        }

        // slug의 마지막 부분과 일치하는 메뉴 찾기
        const currentMenu = allMenus.find(menu => {
          const menuShortSlug = menu.slug.split('/').pop();
          return menuShortSlug === slug;
        });

        if (!currentMenu) {
          setError('페이지를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        // 부모 메뉴 정보 추가
        if (currentMenu.parentId) {
          const parentMenu = allMenus.find(m => m.id === currentMenu.parentId);
          if (parentMenu) {
            currentMenu.parent = parentMenu;
          }
        }

        setMenu(currentMenu);

        // 콘텐츠 가져오기
        const { data: contentData, error: contentError } = await getAllDocuments('contents', {
          where: [{ field: 'menuId', operator: '==', value: currentMenu.id }],
          orderBy: [{ field: 'orderSeq', direction: 'asc' }]
        });

        if (!isCurrentRequest) return; // 요청이 더 이상 유효하지 않으면 중단

        if (contentError) {
          throw contentError;
        }

        setContent(contentData || []);
        setLoading(false);
      } catch (error) {
        if (!isCurrentRequest) return;
        setError('페이지를 찾을 수 없습니다.');
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      isCurrentRequest = false; // cleanup 시 현재 요청을 무효화
    };
  }, [slug, parent]);

  // admin 경로는 렌더링하지 않음
  if (slug?.startsWith('admin')) {
    return null;
  }

  if (loading) return <Layout><div className="loading">로딩 중...</div></Layout>;
  if (error) return <Layout><div className="error">{error}</div></Layout>;
  if (!menu) return <Layout><div className="error">페이지를 찾을 수 없습니다.</div></Layout>;

  return (
    <Layout>
      <div className="dynamic-page">
        <h1 className="page-title">{menu.title}</h1>
        {content && content.length > 0 ? (
          content.map((item) => (
            <div key={item.id} className="content-item">
              <h2>{item.title}</h2>
              <div>
                <div className="content-text">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} />
                  )}
                  <div dangerouslySetInnerHTML={{ __html: item.content }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-content">등록된 콘텐츠가 없습니다.</div>
        )}
      </div>
    </Layout>
  );
}