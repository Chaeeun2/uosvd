import React from 'react';

export default function MobileCheck() {
  return (
    <div className="admin-mobile-warning">
      <div className="admin-mobile-warning-content">
        <h2>PC 환경에서 접속해주세요</h2>
        <p>관리자 페이지는 PC 환경에 최적화되어 있습니다.<br />원활한 사용을 위해 PC로 접속해주세요.</p>
        <div className="admin-mobile-warning-icon">💻</div>
      </div>
    </div>
  );
} 