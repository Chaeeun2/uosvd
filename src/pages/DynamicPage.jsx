import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // admin으로 시작하는 경로는 처리하지 않음
    if (slug?.startsWith('admin')) {
      return;
    }

    fetchMenuAndContent();
  }, [slug, parent]);

  async function fetchMenuAndContent() {
    try {
      if (!isMounted.current) return;
      setLoading(true);

      console.log('현재 slug:', slug);

      if (slug === '404') {
        setError('페이지를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 전체 메뉴 데이터 조회
      const { data: allMenus, error: menuError } = await supabase
        .from('menus')
        .select(`
          id, 
          title,
          slug,
          parent_id,
          parent:parent_id (
            id,
            title,
            slug
          )
        `);

      if (menuError) {
        console.error('메뉴 조회 에러:', menuError);
        throw menuError;
      }

      // slug의 마지막 부분과 일치하는 메뉴 찾기
      const currentMenu = allMenus.find(menu => {
        const menuShortSlug = menu.slug.split('/').pop();
        return menuShortSlug === slug;
      });

      console.log('찾은 메뉴:', currentMenu);

      if (!currentMenu) {
        console.log('메뉴를 찾을 수 없음');
        if (isMounted.current) {
          setError('페이지를 찾을 수 없습니다.');
          setLoading(false);
        }
        return;
      }

      if (isMounted.current) {
        setMenu(currentMenu);
      }

      // 콘텐츠 가져오기
      const { data: contentData, error: contentError } = await supabase
        .from('contents')
        .select('*')
        .eq('menu_id', currentMenu.id)
        .order('order_seq', { ascending: true });

      if (contentError) {
        console.error('콘텐츠 조회 에러:', contentError);
        throw contentError;
      }
      
      if (isMounted.current) {
        setContent(contentData);
        setLoading(false);
      }
    } catch (error) {
      console.error('전체 에러:', error);
      if (isMounted.current) {
        setError('페이지를 찾을 수 없습니다.');
        setLoading(false);
      }
    }
  }

  // admin 경로는 렌더링하지 않음
  if (slug?.startsWith('admin')) {
    return null;
  }

  if (loading) return <Layout></Layout>;
  if (error) return <Layout><div>{error}</div></Layout>;
  if (!menu) return <Layout><div>페이지를 찾을 수 없습니다.</div></Layout>;

  return (
    <Layout>
      <div className="dynamic-page">
        <h1 className="page-title">{menu.title}</h1>
        {content && content.length > 0 ? (
          content.map((item) => (
            <div key={item.id} className="content-item">
              {item.title && <h2>{item.title}</h2>}
              <div className="content-text">
                {item.image_url && (
                  <div className="content-image">
                    <img src={item.image_url} alt={item.title} />
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: item.content }} />
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