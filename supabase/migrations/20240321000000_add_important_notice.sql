-- notices 테이블에 is_important 컬럼 추가
ALTER TABLE notices
ADD COLUMN is_important BOOLEAN DEFAULT false;

-- 기존 레코드의 is_important를 false로 설정
UPDATE notices
SET is_important = false
WHERE is_important IS NULL; 