// src/pages/Home.jsx
import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import '../styles/Home.css';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [displayText, setDisplayText] = useState('');
  const fullText = "Hello,\nWe are UOSVD.";
  const [isTyping, setIsTyping] = useState(true);
  const timerRef = useRef(null);
  
  // 타이핑 효과를 위한 상태
  const [mainMenus, setMainMenus] = useState([]);
  const [subMenus, setSubMenus] = useState({});
  
  const [loading, setLoading] = useState(true);
  
  // 컴포넌트 마운트 시 타이핑 시작
  useEffect(() => {
    startTypingEffect();
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  
  // 타이핑 효과 함수
  const startTypingEffect = () => {
    let currentIndex = 0;
    setIsTyping(true);
    setDisplayText('');
    
    // 타이핑 효과
    const typeCharacter = () => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        timerRef.current = setTimeout(typeCharacter, 100);
      } else {
        // 타이핑 완료 후 3초 대기
        timerRef.current = setTimeout(() => {
          setDisplayText(''); // 텍스트 한번에 지우기
          // 대기 없이 바로 다시 시작
          startTypingEffect(); // 1초 대기시간 제거
        }, 5000);
      }
    };
    
    typeCharacter();
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  async function fetchMenus() {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Layout></Layout>;

  return (
    <Layout>
      <div className="hero-text">
        <h1>
          {displayText.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < displayText.split('\n').length - 1 && <br />}
            </span>
          ))}
          <span className="typing-cursor"></span>
        </h1>
      </div>
        <div className="info-container">
          <div className="school-info">
            <p>서울시립대학교 디자인학과 시각디자인전공</p>
            <p>University of Seoul, Visual Design</p>
          </div>
          <div className="contact-info">
            <h2>Contact</h2>
            <p>+82 (0)2 6490 2906</p>
            <p>서울 동대문구 서울시립대로 163,</p>
            <p>서울시립대학교 조형관</p>
          </div>
        </div>
    </Layout>
  );
}