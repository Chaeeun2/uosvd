import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// 방문자 카운트 증가
export async function incrementVisitorCount() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');

    // 오늘 방문자 카운트 증가 (문서가 없으면 생성)
    const todayDoc = doc(db, 'visitorStats', todayStr);
    const todaySnapshot = await getDoc(todayDoc);
    if (!todaySnapshot.exists()) {
      await setDoc(todayDoc, {
        date: todayStr,
        count: 1,
        lastUpdated: new Date()
      });
    } else {
      await updateDoc(todayDoc, {
        count: increment(1),
        lastUpdated: new Date()
      });
    }

    // 이번 달 방문자 카운트 증가 (문서가 없으면 생성)
    const monthDoc = doc(db, 'visitorStats', currentMonth);
    const monthSnapshot = await getDoc(monthDoc);
    if (!monthSnapshot.exists()) {
      await setDoc(monthDoc, {
        month: currentMonth,
        count: 1,
        lastUpdated: new Date()
      });
    } else {
      await updateDoc(monthDoc, {
        count: increment(1),
        lastUpdated: new Date()
      });
    }

    // 전체 방문자 카운트 증가 (문서가 없으면 생성)
    const totalDoc = doc(db, 'visitorStats', 'total');
    const totalSnapshot = await getDoc(totalDoc);
    if (!totalSnapshot.exists()) {
      await setDoc(totalDoc, {
        totalCount: 1,
        lastUpdated: new Date()
      });
    } else {
      await updateDoc(totalDoc, {
        totalCount: increment(1),
        lastUpdated: new Date()
      });
    }

    console.log('방문자 카운트 증가됨');
  } catch (error) {
    console.error('방문자 카운트 증가 실패:', error);
  }
}

// 방문자 통계 조회
export async function getVisitorStats() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');

    // 오늘 방문자 수 조회
    const todayDoc = doc(db, 'visitorStats', todayStr);
    const todaySnapshot = await getDoc(todayDoc);
    let todayVisits = 0;
    
    if (!todaySnapshot.exists()) {
      // 오늘 통계가 없으면 초기화
      await setDoc(todayDoc, {
        date: todayStr,
        count: 0,
        lastUpdated: new Date()
      });
    } else {
      todayVisits = todaySnapshot.data().count;
    }

    // 이번 달 방문자 수 조회
    const monthDoc = doc(db, 'visitorStats', currentMonth);
    const monthSnapshot = await getDoc(monthDoc);
    let monthlyVisits = 0;
    
    if (!monthSnapshot.exists()) {
      // 이번 달 통계가 없으면 초기화
      await setDoc(monthDoc, {
        month: currentMonth,
        count: 0,
        lastUpdated: new Date()
      });
    } else {
      monthlyVisits = monthSnapshot.data().count;
    }

    // 전체 방문자 수 조회
    const totalDoc = doc(db, 'visitorStats', 'total');
    const totalSnapshot = await getDoc(totalDoc);
    let totalVisits = 0;
    
    if (!totalSnapshot.exists()) {
      // 전체 통계가 없으면 초기화
      await setDoc(totalDoc, {
        totalCount: 0,
        lastUpdated: new Date()
      });
    } else {
      totalVisits = totalSnapshot.data().totalCount;
    }

    return {
      todayVisits,
      monthlyVisits,
      totalVisits
    };
  } catch (error) {
    console.error('방문자 통계 조회 실패:', error);
    return {
      todayVisits: 0,
      monthlyVisits: 0,
      totalVisits: 0
    };
  }
}

// 방문자 통계 초기화 (필요시)
export async function initializeVisitorStats() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');

    // 오늘 방문자 통계 초기화
    const todayDoc = doc(db, 'visitorStats', todayStr);
    await setDoc(todayDoc, {
      date: todayStr,
      count: 0,
      lastUpdated: new Date()
    });

    // 이번 달 방문자 통계 초기화
    const monthDoc = doc(db, 'visitorStats', currentMonth);
    await setDoc(monthDoc, {
      month: currentMonth,
      count: 0,
      lastUpdated: new Date()
    });

    // 전체 방문자 통계 초기화
    const totalDoc = doc(db, 'visitorStats', 'total');
    await setDoc(totalDoc, {
      totalCount: 0,
      lastUpdated: new Date()
    });

    console.log('방문자 통계 초기화 완료');
  } catch (error) {
    console.error('방문자 통계 초기화 실패:', error);
  }
} 