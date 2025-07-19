// src/lib/firebaseAuth.js
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  TwitterAuthProvider
} from 'firebase/auth';
import { auth } from './firebase';

// 이메일/비밀번호 로그인
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      user: userCredential.user, 
      error: null 
    };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code) 
    };
  }
};

// 이메일/비밀번호 회원가입
export const signUpWithEmail = async (email, password, displayName = null) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 프로필 업데이트 (displayName이 제공된 경우)
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return { 
      user: userCredential.user, 
      error: null 
    };
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code) 
    };
  }
};

// 로그아웃
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
};

// 인증 상태 변경 감지
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = () => {
  return auth.currentUser;
};

// 프로필 업데이트
export const updateUserProfile = async (updates) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인된 사용자가 없습니다.');
    }
    
    await updateProfile(user, updates);
    return { success: true, error: null };
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
};

// 비밀번호 재설정 이메일 발송
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    console.error('비밀번호 재설정 이메일 발송 오류:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
};

// 이메일 인증 메일 발송
export const sendEmailVerificationMail = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('로그인된 사용자가 없습니다.');
    }
    
    await sendEmailVerification(user);
    return { success: true, error: null };
  } catch (error) {
    console.error('이메일 인증 메일 발송 오류:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
};

// Google 로그인
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { 
      user: userCredential.user, 
      error: null 
    };
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code) 
    };
  }
};

// Facebook 로그인
export const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { 
      user: userCredential.user, 
      error: null 
    };
  } catch (error) {
    console.error('Facebook 로그인 오류:', error);
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code) 
    };
  }
};

// Twitter 로그인
export const signInWithTwitter = async () => {
  try {
    const provider = new TwitterAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { 
      user: userCredential.user, 
      error: null 
    };
  } catch (error) {
    console.error('Twitter 로그인 오류:', error);
    return { 
      user: null, 
      error: getAuthErrorMessage(error.code) 
    };
  }
};

// 사용자 권한 확인
export const checkUserPermission = (requiredRole = 'user') => {
  const user = getCurrentUser();
  if (!user) {
    return { hasPermission: false, message: '로그인이 필요합니다.' };
  }
  
  // 사용자 역할 확인 (Firestore에서 사용자 정보를 가져와서 확인)
  // 이 부분은 프로젝트에 맞게 구현해야 합니다.
  return { hasPermission: true, message: '권한이 있습니다.' };
};

// 관리자 권한 확인
export const checkAdminPermission = async () => {
  const user = getCurrentUser();
  if (!user) {
    return { isAdmin: false, message: '로그인이 필요합니다.' };
  }
  
  // 관리자 권한 확인 로직
  // Firestore에서 사용자 역할을 확인하는 로직을 구현해야 합니다.
  try {
    // 예시: Firestore에서 사용자 정보 조회
    // const userDoc = await getDocument('users', user.uid);
    // return { isAdmin: userDoc.data?.role === 'admin', message: '권한 확인 완료' };
    
    // 환경 변수에서 관리자 이메일 가져오기
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    
    const isAdmin = user.email === adminEmail;
    return { 
      isAdmin, 
      message: isAdmin ? '관리자 권한이 있습니다.' : '관리자 권한이 없습니다.' 
    };
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    return { isAdmin: false, message: '권한 확인 중 오류가 발생했습니다.' };
  }
};

// 인증 오류 메시지 변환
const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 약합니다. (최소 6자)',
    'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
    'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
    'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
    'auth/cancelled-popup-request': '로그인이 취소되었습니다.',
    'auth/popup-blocked': '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.',
    'auth/account-exists-with-different-credential': '다른 방법으로 가입된 계정입니다.',
    'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
    'auth/user-disabled': '비활성화된 계정입니다.',
    'auth/operation-not-allowed': '허용되지 않는 작업입니다.',
    'auth/invalid-credential': '유효하지 않은 인증 정보입니다.',
    'auth/user-mismatch': '사용자 정보가 일치하지 않습니다.',
    'auth/invalid-verification-code': '유효하지 않은 인증 코드입니다.',
    'auth/invalid-verification-id': '유효하지 않은 인증 ID입니다.',
    'auth/missing-verification-code': '인증 코드가 누락되었습니다.',
    'auth/missing-verification-id': '인증 ID가 누락되었습니다.',
    'auth/quota-exceeded': '할당량을 초과했습니다.',
    'auth/credential-already-in-use': '이미 사용 중인 인증 정보입니다.',
    'auth/timeout': '요청 시간이 초과되었습니다.',
    'auth/unauthorized-domain': '허용되지 않는 도메인입니다.',
    'auth/unsupported-persistence-type': '지원되지 않는 지속성 타입입니다.',
    'auth/invalid-persistence-type': '유효하지 않은 지속성 타입입니다.',
    'auth/invalid-tenant-id': '유효하지 않은 테넌트 ID입니다.',
    'auth/tenant-id-mismatch': '테넌트 ID가 일치하지 않습니다.',
    'auth/unsupported-first-factor': '지원되지 않는 첫 번째 인증 요소입니다.',
    'auth/email-change-needs-verification': '이메일 변경을 위해 인증이 필요합니다.',
    'auth/second-factor-already-in-use': '이미 사용 중인 두 번째 인증 요소입니다.',
    'auth/maximum-second-factor-count-exceeded': '최대 두 번째 인증 요소 수를 초과했습니다.',
    'auth/unsupported-tenant-operation': '지원되지 않는 테넌트 작업입니다.',
    'auth/invalid-phone-number': '유효하지 않은 전화번호입니다.',
    'auth/missing-phone-number': '전화번호가 누락되었습니다.',
    'auth/invalid-recaptcha-token': '유효하지 않은 reCAPTCHA 토큰입니다.',
    'auth/invalid-recaptcha-action': '유효하지 않은 reCAPTCHA 액션입니다.',
    'auth/missing-recaptcha-token': 'reCAPTCHA 토큰이 누락되었습니다.',
    'auth/missing-recaptcha-action': 'reCAPTCHA 액션이 누락되었습니다.',
    'auth/invalid-recaptcha-score': '유효하지 않은 reCAPTCHA 점수입니다.',
    'auth/session-expired': '세션이 만료되었습니다.',
    'auth/invalid-app-credential': '유효하지 않은 앱 인증 정보입니다.',
    'auth/invalid-app-check-token': '유효하지 않은 앱 체크 토큰입니다.',
    'auth/missing-app-check-token': '앱 체크 토큰이 누락되었습니다.',
    'auth/invalid-oauth-provider': '유효하지 않은 OAuth 제공자입니다.',
    'auth/invalid-oauth-client-id': '유효하지 않은 OAuth 클라이언트 ID입니다.',
    'auth/unauthorized-continue-uri': '허용되지 않는 계속 URI입니다.',
    'auth/invalid-continue-uri': '유효하지 않은 계속 URI입니다.',
    'auth/missing-continue-uri': '계속 URI가 누락되었습니다.',
    'auth/invalid-dynamic-link-domain': '유효하지 않은 동적 링크 도메인입니다.',
    'auth/argument-error': '인수 오류가 발생했습니다.',
    'auth/invalid-persistence-type': '유효하지 않은 지속성 타입입니다.',
    'auth/unsupported-persistence-type': '지원되지 않는 지속성 타입입니다.',
    'auth/invalid-tenant-id': '유효하지 않은 테넌트 ID입니다.',
    'auth/tenant-id-mismatch': '테넌트 ID가 일치하지 않습니다.',
    'auth/unsupported-first-factor': '지원되지 않는 첫 번째 인증 요소입니다.',
    'auth/email-change-needs-verification': '이메일 변경을 위해 인증이 필요합니다.',
    'auth/second-factor-already-in-use': '이미 사용 중인 두 번째 인증 요소입니다.',
    'auth/maximum-second-factor-count-exceeded': '최대 두 번째 인증 요소 수를 초과했습니다.',
    'auth/unsupported-tenant-operation': '지원되지 않는 테넌트 작업입니다.',
    'auth/invalid-phone-number': '유효하지 않은 전화번호입니다.',
    'auth/missing-phone-number': '전화번호가 누락되었습니다.',
    'auth/invalid-recaptcha-token': '유효하지 않은 reCAPTCHA 토큰입니다.',
    'auth/invalid-recaptcha-action': '유효하지 않은 reCAPTCHA 액션입니다.',
    'auth/missing-recaptcha-token': 'reCAPTCHA 토큰이 누락되었습니다.',
    'auth/missing-recaptcha-action': 'reCAPTCHA 액션이 누락되었습니다.',
    'auth/invalid-recaptcha-score': '유효하지 않은 reCAPTCHA 점수입니다.',
    'auth/session-expired': '세션이 만료되었습니다.',
    'auth/invalid-app-credential': '유효하지 않은 앱 인증 정보입니다.',
    'auth/invalid-app-check-token': '유효하지 않은 앱 체크 토큰입니다.',
    'auth/missing-app-check-token': '앱 체크 토큰이 누락되었습니다.',
    'auth/invalid-oauth-provider': '유효하지 않은 OAuth 제공자입니다.',
    'auth/invalid-oauth-client-id': '유효하지 않은 OAuth 클라이언트 ID입니다.',
    'auth/unauthorized-continue-uri': '허용되지 않는 계속 URI입니다.',
    'auth/invalid-continue-uri': '유효하지 않은 계속 URI입니다.',
    'auth/missing-continue-uri': '계속 URI가 누락되었습니다.',
    'auth/invalid-dynamic-link-domain': '유효하지 않은 동적 링크 도메인입니다.',
    'auth/argument-error': '인수 오류가 발생했습니다.'
  };
  
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
}; 