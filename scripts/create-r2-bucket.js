// scripts/create-r2-bucket.js
import pkg from '@aws-sdk/client-s3';
const { S3Client, CreateBucketCommand } = pkg;
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// Cloudflare R2 클라이언트 설정
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const r2BucketName = process.env.R2_BUCKET_NAME;

// R2 버킷 생성
const createR2Bucket = async () => {
  console.log('🚀 Cloudflare R2 버킷 생성');
  console.log('=' .repeat(50));
  
  try {
    console.log(`📦 버킷 이름: ${r2BucketName}`);
    console.log(`🔗 엔드포인트: ${process.env.R2_ENDPOINT}`);
    
    // 버킷 생성
    console.log('\n🔨 버킷 생성 중...');
    const createBucketCommand = new CreateBucketCommand({
      Bucket: r2BucketName
    });
    
    await r2Client.send(createBucketCommand);
    console.log('✅ 버킷 생성 성공!');
    
    console.log('\n🎉 R2 버킷 설정 완료!');
    console.log(`📁 버킷: ${r2BucketName}`);
    console.log(`🌐 공개 URL: ${process.env.R2_PUBLIC_URL}`);
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ 버킷 생성 실패:', error.message);
    
    if (error.message.includes('BucketAlreadyOwnedByYou')) {
      console.log('\n💡 이미 버킷이 존재합니다. 계속 진행합니다.');
    } else if (error.message.includes('Access Denied')) {
      console.log('\n💡 해결 방법:');
      console.log('1. Cloudflare Dashboard에서 R2 API 토큰 권한 확인');
      console.log('2. Account R2 Storage:Edit 권한 필요');
      console.log('3. 새로운 API 토큰 생성 시도');
    }
  }
};

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  createR2Bucket();
}

export { createR2Bucket }; 