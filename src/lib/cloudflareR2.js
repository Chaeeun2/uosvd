// src/lib/cloudflareR2.js
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// R2 클라이언트 설정
const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const r2BucketName = import.meta.env.VITE_R2_BUCKET_NAME;
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

// Content-Type 추정 함수
const getContentType = (fileName) => {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    case 'zip':
      return 'application/zip';
    case 'rar':
      return 'application/x-rar-compressed';
    case 'hwp':
      return 'application/x-hwp';
    default:
      return 'application/octet-stream';
  }
};

// 파일 업로드 함수
export const uploadToR2 = async (file, path) => {
  try {
    const contentType = getContentType(file.name);
    
    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: path,
      Body: file,
      ContentType: contentType,
    });

    await r2Client.send(command);
    const publicUrl = `${r2PublicUrl}/${path}`;
    
    return {
      url: publicUrl,
      path: path,
      error: null
    };
  } catch (error) {
    console.error('R2 업로드 오류:', error);
    return {
      url: null,
      path: null,
      error: error.message
    };
  }
};

// 파일 삭제 함수
export const deleteFromR2 = async (path) => {
  try {
    if (!r2BucketName) {
      throw new Error('R2 버킷 이름이 설정되지 않았습니다.');
    }
    
    const command = new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: path,
    });

    await r2Client.send(command);
    return { success: true, error: null };
  } catch (error) {
    console.error('R2 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// 파일 다운로드 함수
export const downloadFromR2 = async (path) => {
  try {
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: path,
    });

    const response = await r2Client.send(command);
    return response.Body;
  } catch (error) {
    console.error('R2 다운로드 오류:', error);
    throw error;
  }
};

// 파일 URL 생성 함수
export const getR2Url = (path) => {
  return `${r2PublicUrl}/${path}`;
};

// 파일 크기 제한 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 허용된 파일 타입
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  presentation: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  archive: ['application/zip', 'application/x-rar-compressed'],
  text: ['text/plain'],
  hwp: ['application/x-hwp']
};

// 파일 유효성 검사
export const validateFile = (file) => {
  const errors = [];
  
  // 파일 크기 검사
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 허용됩니다.`);
  }
  
  // 파일 타입 검사
  const allowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!allowedTypes.includes(file.type)) {
    errors.push('지원하지 않는 파일 타입입니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 