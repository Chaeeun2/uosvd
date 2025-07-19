const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCurrentMenus() {
  try {
    console.log('🔍 현재 Firebase 메뉴 데이터 확인 중...\n');

    // 메뉴 데이터 가져오기
    const menusRef = collection(db, 'menus');
    const q = query(menusRef, orderBy('orderSeq', 'asc'));
    const querySnapshot = await getDocs(q);

    const menus = [];
    querySnapshot.forEach((doc) => {
      menus.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('📋 현재 메뉴 구조:');
    menus.forEach((menu, index) => {
      const parentInfo = menu.parentId ? `(부모: ${menu.parentId})` : '(최상위)';
      const slugInfo = menu.slug ? ` - /${menu.slug}` : '';
      console.log(`${index + 1}. [${menu.id}] ${menu.title}${slugInfo} ${parentInfo}`);
    });

    // sitemap.xml에 포함될 URL들 생성
    console.log('\n🗺️  Sitemap.xml에 포함될 URL들:');
    console.log('1. https://vd.design.ac.kr/ (메인 페이지)');
    
    // 하위 메뉴들 (slug가 있는 것들만)
    const subMenus = menus.filter(menu => menu.parentId && menu.slug);
    subMenus.forEach((menu, index) => {
      console.log(`${index + 2}. https://vd.design.ac.kr/${menu.slug} (${menu.title})`);
    });

    console.log(`\n📊 총 ${subMenus.length + 1}개의 URL이 sitemap에 포함됩니다.`);

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkCurrentMenus(); 