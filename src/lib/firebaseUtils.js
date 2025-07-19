// src/lib/firebaseUtils.js
import { auth, db, storage } from './firebase';

// Firebase 앱이 제대로 초기화되었는지 확인
export const isFirebaseInitialized = () => {
  return auth && db && storage;
};

// 사용자 권한 확인
export const checkUserPermission = (requiredRole = 'admin') => {
  const user = auth.currentUser;
  if (!user) return false;
  
  // 여기서 사용자 역할을 확인하는 로직을 구현할 수 있습니다
  // 예: Firestore에서 사용자 문서를 가져와서 역할 확인
  return true;
};

// 에러 메시지 변환
export const getFirebaseErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': '사용자를 찾을 수 없습니다.',
    'auth/wrong-password': '잘못된 비밀번호입니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 약합니다.',
    'auth/invalid-email': '유효하지 않은 이메일입니다.',
    'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'permission-denied': '권한이 없습니다.',
    'not-found': '요청한 데이터를 찾을 수 없습니다.',
    'already-exists': '이미 존재하는 데이터입니다.',
    'unavailable': '서비스를 사용할 수 없습니다.',
    'deadline-exceeded': '요청 시간이 초과되었습니다.',
    'resource-exhausted': '리소스가 소진되었습니다.',
    'failed-precondition': '사전 조건이 충족되지 않았습니다.',
    'aborted': '작업이 중단되었습니다.',
    'out-of-range': '범위를 벗어났습니다.',
    'unimplemented': '구현되지 않은 기능입니다.',
    'internal': '내부 오류가 발생했습니다.',
    'data-loss': '데이터 손실이 발생했습니다.',
    'unauthenticated': '인증되지 않은 사용자입니다.'
  };
  
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 타입 확인
export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const fileTypes = {
    // 이미지
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'webp': 'image',
    'svg': 'image',
    
    // 문서
    'pdf': 'document',
    'doc': 'document',
    'docx': 'document',
    'txt': 'document',
    
    // 비디오
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'wmv': 'video',
    
    // 오디오
    'mp3': 'audio',
    'wav': 'audio',
    'ogg': 'audio',
    
    // 압축
    'zip': 'archive',
    'rar': 'archive',
    '7z': 'archive'
  };
  
  return fileTypes[extension] || 'unknown';
};

// 파일 업로드 진행률 계산
export const calculateUploadProgress = (loaded, total) => {
  return Math.round((loaded * 100) / total);
};

// 타임스탬프를 읽기 쉬운 형식으로 변환
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 데이터 검증
export const validateData = (data, requiredFields = []) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field}는 필수 입력 항목입니다.`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 