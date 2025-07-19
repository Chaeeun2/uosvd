// scripts/test-r2-connection.js
import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

// R2 연결 테스트
const testR2Connection = async () => {
  console.log('🔍 Cloudflare R2 연결 테스트');
  console.log('=' .repeat(50));
  
  try {
    console.log('📋 환경 변수 확인:');
    console.log(`  R2_ENDPOINT: ${process.env.R2_ENDPOINT ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`  R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL ? '✅ 설정됨' : '❌ 미설정'}`);
    
    console.log('\n🔗 R2 연결 테스트...');
    
    // 버킷 목록 조회 테스트
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResult = await r2Client.send(listBucketsCommand);
    
    console.log('✅ R2 연결 성공!');
    console.log(`📦 사용 가능한 버킷: ${bucketsResult.Buckets?.length || 0}개`);
    
    if (bucketsResult.Buckets) {
      bucketsResult.Buckets.forEach(bucket => {
        console.log(`  - ${bucket.Name} (생성일: ${bucket.CreationDate})`);
      });
    }
    
    // 특정 버킷 접근 테스트
    if (r2BucketName) {
      console.log(`\n📁 ${r2BucketName} 버킷 접근 테스트...`);
      
      try {
        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: r2BucketName,
          MaxKeys: 10
        });
        
        const objectsResult = await r2Client.send(listObjectsCommand);
        console.log(`✅ ${r2BucketName} 버킷 접근 성공!`);
        console.log(`📄 파일 개수: ${objectsResult.Contents?.length || 0}개`);
        
        if (objectsResult.Contents) {
          objectsResult.Contents.forEach(obj => {
            console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
          });
        }
        
      } catch (bucketError) {
        console.error(`❌ ${r2BucketName} 버킷 접근 실패:`, bucketError.message);
        
        if (bucketError.message.includes('Access Denied')) {
          console.log('\n💡 해결 방법:');
          console.log('1. Cloudflare Dashboard에서 R2 API 토큰 권한 확인');
          console.log('2. Object Read & Write, Bucket Read & Write 권한 필요');
          console.log('3. 버킷이 존재하는지 확인');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ R2 연결 실패:', error.message);
    
    if (error.message.includes('Access Denied')) {
      console.log('\n💡 해결 방법:');
      console.log('1. Cloudflare Dashboard에서 R2 API 토큰 권한 확인');
      console.log('2. Object Read & Write, Bucket Read & Write 권한 필요');
    } else if (error.message.includes('InvalidAccessKeyId')) {
      console.log('\n💡 해결 방법:');
      console.log('1. R2_ACCESS_KEY_ID가 올바른지 확인');
      console.log('2. Cloudflare Dashboard에서 API 토큰 재생성');
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n💡 해결 방법:');
      console.log('1. R2_SECRET_ACCESS_KEY가 올바른지 확인');
      console.log('2. Cloudflare Dashboard에서 API 토큰 재생성');
    }
  }
};

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  testR2Connection();
}

export { testR2Connection }; 