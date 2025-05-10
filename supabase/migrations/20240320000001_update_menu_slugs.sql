-- 최상위 메뉴의 슬러그를 null로 설정
UPDATE menus
SET slug = null
WHERE parent_id IS NULL;

-- 자식 메뉴의 슬러그에서 부모 메뉴의 슬러그 제거
UPDATE menus m1
SET slug = REGEXP_REPLACE(m1.slug, '^[^/]+/', '')
FROM menus m2
WHERE m1.parent_id = m2.id
AND m1.slug LIKE '%/%'; 