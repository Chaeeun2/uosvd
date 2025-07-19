// src/lib/firebaseFirestore.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// 타임스탬프 변환 함수
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Firestore 데이터 변환 함수
const convertFirestoreData = (doc) => {
  const data = doc.data();
  const converted = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    } else if (Array.isArray(value)) {
      converted[key] = value.map(item => {
        if (item && typeof item === 'object' && item.seconds) {
          return new Date(item.seconds * 1000);
        }
        return item;
      });
    } else {
      converted[key] = value;
    }
  });
  
  return {
    id: doc.id,
    ...converted
  };
};

// 컬렉션에서 모든 문서 가져오기
export const getAllDocuments = async (collectionName, options = {}) => {
  try {
    let q = collection(db, collectionName);
    
    // 쿼리 조건 추가
    if (options.where) {
      options.where.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
    }
    
    // 정렬 조건 추가
    if (options.orderBy) {
      options.orderBy.forEach(order => {
        q = query(q, orderBy(order.field, order.direction || 'asc'));
      });
    }
    
    // 제한 조건 추가
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach(doc => {
      documents.push(convertFirestoreData(doc));
    });
    
    return { data: documents, error: null };
  } catch (error) {
    console.error('문서 조회 오류:', error);
    return { data: [], error: error.message };
  }
};

// 단일 문서 가져오기
export const getDocument = async (collectionName, documentId) => {
  try {
    // documentId가 숫자인 경우 문자열로 변환
    const stringId = String(documentId);
    const docRef = doc(db, collectionName, stringId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: convertFirestoreData(docSnap), error: null };
    } else {
      return { data: null, error: '문서를 찾을 수 없습니다.' };
    }
  } catch (error) {
    console.error('문서 조회 오류:', error);
    return { data: null, error: error.message };
  }
};

// 새 문서 추가
export const addDocument = async (collectionName, data) => {
  try {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, collectionName), docData);
    
    return { 
      id: docRef.id, 
      data: { ...data, id: docRef.id }, 
      error: null 
    };
  } catch (error) {
    console.error('문서 추가 오류:', error);
    return { id: null, data: null, error: error.message };
  }
};

// 문서 업데이트
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    // documentId가 숫자인 경우 문자열로 변환
    const stringId = String(documentId);
    const docRef = doc(db, collectionName, stringId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('문서 업데이트 오류:', error);
    return { success: false, error: error.message };
  }
};

// 문서 삭제
export const deleteDocument = async (collectionName, documentId) => {
  try {
    // documentId가 숫자인 경우 문자열로 변환
    const stringId = String(documentId);
    const docRef = doc(db, collectionName, stringId);
    await deleteDoc(docRef);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('문서 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// 페이지네이션을 위한 문서 가져오기
export const getDocumentsWithPagination = async (collectionName, options = {}) => {
  try {
    const { page = 1, pageSize = 10, orderByField = 'createdAt', orderDirection = 'desc', whereConditions = [] } = options;
    
    let q = collection(db, collectionName);
    
    // 쿼리 조건 추가
    whereConditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    // 정렬 조건 추가
    q = query(q, orderBy(orderByField, orderDirection));
    
    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    if (startIndex > 0) {
      // 이전 페이지의 마지막 문서를 가져와서 startAfter에 사용
      const prevQuery = query(q, limit(startIndex));
      const prevSnapshot = await getDocs(prevQuery);
      const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      if (lastDoc) {
        q = query(q, startAfter(lastDoc), limit(pageSize));
      }
    } else {
      q = query(q, limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = [];
    
    querySnapshot.forEach(doc => {
      documents.push(convertFirestoreData(doc));
    });
    
    return { data: documents, error: null };
  } catch (error) {
    console.error('페이지네이션 문서 조회 오류:', error);
    return { data: [], error: error.message };
  }
};

// 실시간 업데이트를 위한 구독 함수 (선택사항)
export const subscribeToCollection = (collectionName, callback, options = {}) => {
  // 실시간 구독 로직은 필요에 따라 구현
  // onSnapshot을 사용하여 실시간 업데이트 처리
  console.log('실시간 구독 기능은 별도 구현이 필요합니다.');
  return () => {
    // 구독 해제 함수
    console.log('구독 해제');
  };
};

// 검색 기능
export const searchDocuments = async (collectionName, searchField, searchTerm, options = {}) => {
  try {
    // Firestore는 전체 텍스트 검색을 지원하지 않으므로
    // 클라이언트 사이드에서 필터링하거나
    // Algolia 등의 외부 검색 서비스를 사용하는 것을 권장
    
    const { data, error } = await getAllDocuments(collectionName, options);
    
    if (error) {
      return { data: [], error };
    }
    
    // 클라이언트 사이드 필터링
    const filteredData = data.filter(doc => {
      const fieldValue = doc[searchField];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
    
    return { data: filteredData, error: null };
  } catch (error) {
    console.error('검색 오류:', error);
    return { data: [], error: error.message };
  }
};

// 배치 작업을 위한 유틸리티
export const batchOperations = {
  // 여러 문서 일괄 추가
  addMultiple: async (collectionName, documents) => {
    try {
      const results = [];
      for (const doc of documents) {
        const result = await addDocument(collectionName, doc);
        results.push(result);
      }
      return { results, error: null };
    } catch (error) {
      console.error('배치 추가 오류:', error);
      return { results: [], error: error.message };
    }
  },
  
  // 여러 문서 일괄 업데이트
  updateMultiple: async (collectionName, updates) => {
    try {
      const results = [];
      for (const update of updates) {
        const result = await updateDocument(collectionName, update.id, update.data);
        results.push(result);
      }
      return { results, error: null };
    } catch (error) {
      console.error('배치 업데이트 오류:', error);
      return { results: [], error: error.message };
    }
  },
  
  // 여러 문서 일괄 삭제
  deleteMultiple: async (collectionName, documentIds) => {
    try {
      const results = [];
      for (const id of documentIds) {
        const result = await deleteDocument(collectionName, id);
        results.push(result);
      }
      return { results, error: null };
    } catch (error) {
      console.error('배치 삭제 오류:', error);
      return { results: [], error: error.message };
    }
  }
}; 