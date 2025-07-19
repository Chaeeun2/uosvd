import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllDocuments } from '../lib/firebaseFirestore';
import '../styles/Layout.css';
import { useMobile } from '../contexts/MobileContext';

export default function Layout({ children }) {
  const location = useLocation();
  const [mainMenus, setMainMenus] = useState([]);
  const [subMenus, setSubMenus] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isMobile } = useMobile();

  useEffect(() => {
    fetchMenus();
  }, []);

  async function fetchMenus() {
    try {
      const { data: menuData, error } = await getAllDocuments('menus', {
        orderBy: [{ field: 'orderSeq', direction: 'asc' }]
      });
      
      if (error) {
        console.error('Error fetching menus:', error);
        return;
      }

      const mains = menuData.filter(menu => !menu.parentId);
      const subs = menuData.filter(menu => menu.parentId);

      const subMenuGroups = {};
      subs.forEach(menu => {
        if (!subMenuGroups[menu.parentId]) {
          subMenuGroups[menu.parentId] = [];
        }
        subMenuGroups[menu.parentId].push(menu);
      });

      Object.values(subMenuGroups).forEach(group => {
        group.sort((a, b) => (a.orderSeq || 0) - (b.orderSeq || 0));
      });

      // 원하는 순서대로 정렬 (어드민과 동일)
      const desiredOrder = ['학과', '게시판', '아카이빙', '프린트룸', '기타'];
      const sortedMains = mains.sort((a, b) => {
        const aIndex = desiredOrder.indexOf(a.title);
        const bIndex = desiredOrder.indexOf(b.title);
        
        // 원하는 순서에 없는 메뉴는 맨 뒤로
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });

      setMainMenus(sortedMains);
      setSubMenus(subMenuGroups);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <>
      <header className="top-header">
        <Link to="/">UOSVD</Link>
        <p>서울시립대학교 디자인학과 시각디자인전공</p>
        {isMobile && (
          <button
            className={`hamburger-button${isMenuOpen ? ' open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        )}
      </header>
      <div className="layout-container">
        <nav className={`side-menu ${isMobile ? (isMenuOpen ? 'open' : 'closed') : ''}`}>
          {mainMenus.map((menu) => (
            <div key={menu.id} className="menu-category">
              <h2>{menu.title}</h2>
              {subMenus[menu.id]?.map((submenu) => {
                const shortSlug = submenu.slug.split('/').pop();
                const isActive = location.pathname === `/${shortSlug}`;
                return (
                  <Link 
                    key={submenu.id} 
                    to={`/${shortSlug}`}
                    className={`submenu-item ${isActive ? 'active' : ''}`}
                    onClick={() => isMobile && setIsMenuOpen(false)}
                  >
                    {submenu.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}
