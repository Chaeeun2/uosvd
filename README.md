# UOSVD - React + Vite + Firebase

이 프로젝트는 React와 Vite를 사용하여 구축된 웹 애플리케이션입니다. Firebase를 백엔드로 사용하여 인증, 데이터베이스, 파일 저장소 기능을 제공합니다.

## 기술 스택

- **Frontend**: React 18, Vite
- **Backend**: Firebase (Authentication, Firestore)
- **File Storage**: Cloudflare R2 (또는 Firebase Storage)
- **UI**: Custom CSS, React Router DOM
- **Editor**: CKEditor 5, TinyMCE

## Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성
3. 웹 앱 추가

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Cloudflare R2 Configuration (권장)
VITE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=your-access-key-id
VITE_R2_SECRET_ACCESS_KEY=your-secret-access-key
VITE_R2_BUCKET_NAME=your-bucket-name
VITE_R2_PUBLIC_URL=https://your-public-domain.com

# Storage Type (r2 또는 firebase)
VITE_STORAGE_TYPE=r2
```

### 3. Firebase 서비스 활성화

Firebase Console에서 다음 서비스들을 활성화하세요:

- **Authentication**: 이메일/비밀번호 로그인 활성화
- **Firestore Database**: 데이터베이스 생성

### 4. Cloudflare R2 설정 (권장)

파일 저장소로 Cloudflare R2를 사용하려면 [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md) 문서를 참고하세요.

### 4. Firestore 보안 규칙 설정

Firestore Database > Rules에서 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 읽기/쓰기 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Storage 보안 규칙 설정

Storage > Rules에서 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 인증된 사용자만 파일 업로드/다운로드 가능
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 프로젝트 구조

```
src/
├── lib/
│   ├── firebase.js          # Firebase 초기화
│   ├── firebaseAuth.js      # 인증 관련 함수
│   ├── firebaseFirestore.js # Firestore 데이터베이스 함수
│   ├── firebaseStorage.js   # Firebase Storage 파일 관리 함수
│   ├── cloudflareR2.js      # Cloudflare R2 파일 관리 함수
│   └── fileManager.js       # 통합 파일 관리 유틸리티
├── components/              # React 컴포넌트
├── pages/                   # 페이지 컴포넌트
├── contexts/                # React Context
└── styles/                  # CSS 스타일
```

## 주요 기능

- **사용자 인증**: Firebase Authentication을 사용한 로그인/로그아웃
- **콘텐츠 관리**: Firestore를 사용한 데이터 CRUD 작업
- **파일 업로드**: Cloudflare R2 또는 Firebase Storage를 사용한 파일 관리
- **관리자 패널**: 콘텐츠 및 사용자 관리 기능
- **반응형 디자인**: 모바일 및 데스크톱 지원

## 라이선스

MIT License
