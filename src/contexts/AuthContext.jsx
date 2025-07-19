import { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChange, getCurrentUser, signInWithEmail, signOutUser, checkAdminPermission } from '../lib/firebaseAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변화 구독
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      setLoading(false);
      
      // 관리자 권한 확인
      if (user) {
        setAdminLoading(true);
        try {
          const { isAdmin: adminStatus } = await checkAdminPermission();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('관리자 권한 확인 오류:', error);
          setIsAdmin(false);
        }
        setAdminLoading(false);
      } else {
        setIsAdmin(false);
        setAdminLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const { user: loggedInUser, error } = await signInWithEmail(email, password);
      if (error) {
        return { success: false, error };
      }
      
      // 관리자 권한 확인
      const { isAdmin: adminStatus } = await checkAdminPermission();
      setIsAdmin(adminStatus);
      
      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false, error: error.message };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      const { success, error } = await signOutUser();
      if (success) {
        setUser(null);
        setIsAdmin(false);
      }
      return { success, error };
    } catch (error) {
      console.error('로그아웃 오류:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    adminLoading,
    login,
    logout,
    getCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
