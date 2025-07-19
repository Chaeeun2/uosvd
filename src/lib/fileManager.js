// src/lib/fileManager.js
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { uploadToR2, deleteFromR2, getR2Url, validateFile } from './cloudflareR2';

// 저장소 타입 (환경 변수에서 가져오기)
const STORAGE_TYPE = import.meta.env.VITE_STORAGE_TYPE || 'r2';

// 파일 업로드 함수 (통합)
export const uploadFile = async (file, path, options = {}) => {
  // 파일 유효성 검사
  const validation = validateFile(file);
  if (!validation.isValid) {
    return {
      url: null,
      path: null,
      error: validation.errors.join(', ')
    };
  }

  try {
    if (STORAGE_TYPE === 'r2') {
      // Cloudflare R2 사용
      return await uploadToR2(file, path);
    } else {
      // Firebase Storage 사용
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file, options);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        error: null
      };
    }
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return {
      url: null,
      path: null,
      error: error.message
    };
  }
};

// 파일 삭제 함수 (통합)
export const deleteFile = async (path) => {
  try {
    if (STORAGE_TYPE === 'r2') {
      // Cloudflare R2 사용
      return await deleteFromR2(path);
    } else {
      // Firebase Storage 사용
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true, error: null };
    }
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// 파일 URL 가져오기 함수 (통합)
export const getFileUrl = (path) => {
  if (STORAGE_TYPE === 'r2') {
    // Cloudflare R2 사용
    return getR2Url(path);
  } else {
    // Firebase Storage는 동적 URL이므로 path만 반환
    return path;
  }
};

// 이미지 업로드 함수 (최적화)
export const uploadImage = async (file, path, options = {}) => {
  // 이미지 파일 검증
  if (!file.type.startsWith('image/')) {
    return {
      url: null,
      path: null,
      error: '이미지 파일만 업로드 가능합니다.'
    };
  }

  // 이미지 최적화 옵션 추가
  const imageOptions = {
    ...options,
    cacheControl: 'public, max-age=31536000', // 1년 캐시
    metadata: {
      ...options.metadata,
      imageType: 'uploaded',
      originalSize: file.size.toString()
    }
  };

  return await uploadFile(file, path, imageOptions);
};

// 문서 업로드 함수
export const uploadDocument = async (file, path, options = {}) => {
  // 문서 파일 검증
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/x-hwp'
  ];

  if (!documentTypes.includes(file.type)) {
    return {
      url: null,
      path: null,
      error: '지원하지 않는 문서 형식입니다.'
    };
  }

  const documentOptions = {
    ...options,
    cacheControl: 'public, max-age=86400', // 1일 캐시
    metadata: {
      ...options.metadata,
      documentType: 'uploaded',
      originalName: file.name
    }
  };

  return await uploadFile(file, path, documentOptions);
};

// 파일 경로 생성 함수
export const generateFilePath = (file, category, prefix = '') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop().toLowerCase();
  const fileName = `${timestamp}_${randomId}.${extension}`;
  
  if (prefix) {
    return `${category}/${prefix}/${fileName}`;
  }
  return `${category}/${fileName}`;
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
    'hwp': 'document',
    
    // 스프레드시트
    'xls': 'spreadsheet',
    'xlsx': 'spreadsheet',
    
    // 프레젠테이션
    'ppt': 'presentation',
    'pptx': 'presentation',
    
    // 압축
    'zip': 'archive',
    'rar': 'archive',
    '7z': 'archive'
  };
  
  return fileTypes[extension] || 'unknown';
};

// 저장소 타입 확인
export const getStorageType = () => {
  return STORAGE_TYPE;
};

// 저장소 정보
export const getStorageInfo = () => {
  return {
    type: STORAGE_TYPE,
    name: STORAGE_TYPE === 'r2' ? 'Cloudflare R2' : 'Firebase Storage',
    publicUrl: STORAGE_TYPE === 'r2' ? import.meta.env.VITE_R2_PUBLIC_URL : null
  };
}; 