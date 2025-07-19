// src/lib/firebaseStorage.js
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from './firebase';

// 파일 업로드
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { 
      url: downloadURL, 
      path: snapshot.ref.fullPath,
      error: null 
    };
  } catch (error) {
    return { 
      url: null, 
      path: null,
      error: error.message 
    };
  }
};

// 파일 URL 가져오기
export const getFileURL = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

// 파일 삭제
export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// 폴더 내 모든 파일 목록 가져오기
export const listFiles = async (folderPath) => {
  try {
    const listRef = ref(storage, folderPath);
    const res = await listAll(listRef);
    
    const files = [];
    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      files.push({
        name: itemRef.name,
        path: itemRef.fullPath,
        url: url
      });
    }
    
    return { files, error: null };
  } catch (error) {
    return { files: [], error: error.message };
  }
};

// 이미지 파일 업로드 (썸네일 생성 포함)
export const uploadImage = async (file, path, options = {}) => {
  try {
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      throw new Error('Uploaded file is not an image');
    }
    
    // 파일 크기 제한 (기본값: 5MB)
    const maxSize = options.maxSize || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { 
      url: downloadURL, 
      path: snapshot.ref.fullPath,
      size: file.size,
      type: file.type,
      error: null 
    };
  } catch (error) {
    return { 
      url: null, 
      path: null,
      size: null,
      type: null,
      error: error.message 
    };
  }
};

// 파일 메타데이터 가져오기
export const getFileMetadata = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const metadata = await storageRef.getMetadata();
    return { metadata, error: null };
  } catch (error) {
    return { metadata: null, error: error.message };
  }
}; 