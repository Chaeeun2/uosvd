import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
      console.log("Layout: 메뉴 로딩 시작");
      const { data: menuData, error } = await supabase
        .from('menus')
        .select('*')
        .order('order_seq');
      
      if (error) {
        console.error('Error fetching menus:', error);
        return;
      }

      const mains = menuData.filter(menu => !menu.parent_id);
      const subs = menuData.filter(menu => menu.parent_id);

      const subMenuGroups = {};
      subs.forEach(menu => {
        if (!subMenuGroups[menu.parent_id]) {
          subMenuGroups[menu.parent_id] = [];
        }
        subMenuGroups[menu.parent_id].push(menu);
      });

      Object.values(subMenuGroups).forEach(group => {
        group.sort((a, b) => a.order_seq - b.order_seq);
      });

      mains.sort((a, b) => a.order_seq - b.order_seq);

      setMainMenus(mains);
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
