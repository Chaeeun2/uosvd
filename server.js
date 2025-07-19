const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

// 보안 헤더 설정
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tiny.cloud; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
    "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://storage.googleapis.com; " +
    "frame-src 'self' https://accounts.google.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 라우팅을 위한 catch-all 핸들러
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
}); 