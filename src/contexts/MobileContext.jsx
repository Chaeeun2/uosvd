import React, { createContext, useState, useContext, useEffect } from 'react';

const MobileContext = createContext(null);

export function MobileProvider({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    // 초기 체크
    checkMobile();

    // 리사이즈 이벤트에 대한 체크
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  return useContext(MobileContext);
} 