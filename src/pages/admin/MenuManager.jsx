import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getAllDocuments, addDocument, updateDocument, deleteDocument } from '../../lib/firebaseFirestore';
import AdminLayout from '../../components/AdminLayout';
import '../../styles/admin.css';
import Modal from '../../components/Modal';

export default function MenuManager() {
  const [menus, setMenus] = useState([]);
  const [parentMenus, setParentMenus] = useState([]);
  const [newMenu, setNewMenu] = useState({ 
    title: '', 
    slug: '', 
    parent_id: null, 
    order_seq: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);

  useEffect(() => {
    fetchMenus();
  }, []);

  async function fetchMenus() {
    try {
      setLoading(true);
      
      const { data, error } = await getAllDocuments('menus', {
        orderBy: [{ field: 'orderSeq', direction: 'asc' }]
      });
      
      if (error) throw error;
      
      // 모든 메뉴 저장
      setMenus(data || []);
      
      // 부모 메뉴만 필터링 (parentId가 없는 항목)
      const parents = data.filter(menu => !menu.parentId);
      
      // 원하는 순서대로 정렬
      const desiredOrder = ['학과', '게시판', '아카이빙', '프린트룸', '기타'];
      const sortedParents = parents.sort((a, b) => {
        const aIndex = desiredOrder.indexOf(a.title);
        const bIndex = desiredOrder.indexOf(b.title);
        
        // 원하는 순서에 없는 메뉴는 맨 뒤로
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
      
      setParentMenus(sortedParents);
      
    } catch (error) {
      console.error('메뉴 로딩 오류:', error);
      setError('메뉴를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 특정 부모 메뉴의 자식 메뉴 찾기
  const getChildMenus = (parentId) => {
    return menus
      .filter(menu => menu.parentId === parentId)
      .sort((a, b) => (a.orderSeq || 0) - (b.orderSeq || 0));
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index && 
        result.destination.droppableId === result.source.droppableId) return;

    console.log('드래그 결과:', result);

    const sourceId = result.source.droppableId;
    const destinationId = result.destination.droppableId;

    // 같은 그룹 내에서 이동 (부모 메뉴 그룹 또는 동일한 부모 아래의 서브메뉴)
    if (sourceId === destinationId) {
      let itemsToReorder = [];
      
      // "parent-menus"인 경우 부모 메뉴 배열, 그렇지 않으면 특정 부모의 자식 메뉴 배열
      if (sourceId === "parent-menus") {
        itemsToReorder = [...parentMenus];
      } else {
        // 드롭 영역 ID가 부모 ID (예: "children-5")
        const parentId = sourceId.split('-')[1];
        itemsToReorder = getChildMenus(parentId);
      }

      // 드래그한 항목 이동
      const [removed] = itemsToReorder.splice(result.source.index, 1);
      itemsToReorder.splice(result.destination.index, 0, removed);

      // 순서 업데이트
      const updatedMenus = itemsToReorder.map((menu, index) => ({
        ...menu,
        orderSeq: index + 1
      }));

      try {
        // Firebase 데이터베이스 업데이트
        for (const menu of updatedMenus) {
          await updateDocument('menus', menu.id, {
            orderSeq: menu.orderSeq
          });
        }
        
        // 메뉴 다시 불러오기
        await fetchMenus();
        console.log('메뉴 순서가 업데이트 되었습니다.');
      } catch (error) {
        console.error('메뉴 순서 업데이트 실패:', error);
      }
    }
  };

  async function handleAddMenu(e) {
    e.preventDefault();
    try {
      console.log('메뉴 추가 시작:', newMenu);
      
      // parentId 처리 확인
      const parentId = newMenu.parent_id ? 
        (typeof newMenu.parent_id === 'string' ? newMenu.parent_id : newMenu.parent_id) : 
        null;
      
      console.log('처리된 parentId:', parentId);
      
      let orderSeq = 1;
      
      // 새 메뉴의 순서 결정
      if (parentId) {
        // 같은 부모를 가진 메뉴들 중 가장 큰 orderSeq + 1
        const siblings = menus.filter(m => m.parentId === parentId);
        if (siblings.length > 0) {
          orderSeq = Math.max(...siblings.map(m => m.orderSeq || 0)) + 1;
        }
      } else {
        // 최상위 메뉴 중 가장 큰 orderSeq + 1
        const topMenus = menus.filter(m => !m.parentId);
        if (topMenus.length > 0) {
          orderSeq = Math.max(...topMenus.map(m => m.orderSeq || 0)) + 1;
        }
      }
      
      console.log('계산된 orderSeq:', orderSeq);

      // slug 생성 로직
      let slug = newMenu.slug;
      if (!parentId) {
        // 최상위 메뉴의 경우 title을 기반으로 slug 생성
        slug = newMenu.title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, '-') // 특수문자를 하이픈으로 변경
          .replace(/--+/g, '-')           // 연속된 하이픈을 하나로
          .replace(/^-|-$/g, '')          // 시작과 끝의 하이픈 제거
          .replace(/[가-힣]/g, '')        // 한글 제거
          .replace(/^$/, 'menu');         // 빈 문자열이면 'menu'로 설정
      }

      const menuData = { 
        title: newMenu.title,
        slug: slug,
        parentId: parentId,
        orderSeq: orderSeq,
        isActive: true
      };

      console.log('추가할 메뉴 데이터:', menuData);

      const { id, error } = await addDocument('menus', menuData);

      console.log('Firebase 응답:', { id, error });

      if (error) throw error;
      
      console.log('메뉴 추가 성공, 목록 새로고침');
      await fetchMenus();
      setNewMenu({ title: '', slug: '', parent_id: null, order_seq: 0 });
    } catch (error) {
      console.error('메뉴 추가 실패:', error);
      alert('메뉴 추가에 실패했습니다: ' + error.message);
    }
  }

  async function handleDeleteMenu(id) {
    try {
      // 삭제하려는 메뉴 정보 찾기
      const menuToDelete = menus.find(menu => menu.id === id);
      if (!menuToDelete) return;

      // 하위 메뉴가 있는지 확인
      const children = menus.filter(menu => menu.parentId === id);
      
      let confirmMessage = `"${menuToDelete.title}" 메뉴를 삭제하시겠습니까?`;
      
      if (children.length > 0) {
        confirmMessage = `"${menuToDelete.title}" 메뉴에는 ${children.length}개의 하위 메뉴가 있습니다.\n삭제하시면 모든 하위 메뉴도 함께 삭제됩니다.\n\n정말 삭제하시겠습니까?`;
      }
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      // 하위 메뉴 먼저 삭제
      if (children.length > 0) {
        for (const child of children) {
          await deleteDocument('menus', child.id);
        }
      }
      
      await deleteDocument('menus', id);
      await fetchMenus();
    } catch (error) {
      console.error('메뉴 삭제 실패:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  }

  function handleEditMenu(menu) {
    setEditingMenu(menu);
    setNewMenu({
      title: menu.title,
      slug: menu.slug,
      parent_id: menu.parentId,
      order_seq: menu.orderSeq
    });
    
    // 페이지 상단으로 부드럽게 스크롤
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function handleUpdateMenu(e) {
    e.preventDefault();
    if (!editingMenu) return;
    
    try {
      const parentId = newMenu.parent_id ? 
        (typeof newMenu.parent_id === 'string' ? newMenu.parent_id : newMenu.parent_id) : 
        null;

      const menuData = {
        title: newMenu.title,
        slug: parentId ? newMenu.slug : null, // 최상위 메뉴인 경우 slug를 null로 설정
        parentId: parentId
      };

      const { error } = await updateDocument('menus', editingMenu.id, menuData);

      if (error) throw error;
      
      await fetchMenus();
      setEditingMenu(null);
      setNewMenu({ title: '', slug: '', parent_id: null, order_seq: 0 });
    } catch (error) {
      console.error('메뉴 수정 실패:', error);
      alert('메뉴 수정에 실패했습니다: ' + error.message);
    }
  }

  if (loading) return <></>;
  if (error) return <AdminLayout><div className="error-message">{error}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-content">
        <h2 className="admin-page-title">메뉴 관리</h2>
        <div className="admin-content-layout">
          {/* 메뉴 목록 */}
          <div className="admin-content-main">
            <div className="admin-content-header">
              <h3 className="admin-content-title">메뉴 구조</h3>
            </div>
            <p className="menu-structure-guide">드래그하여 메뉴 순서를 변경할 수 있습니다.</p>

            <DragDropContext onDragEnd={handleDragEnd}>
              {/* 최상위 메뉴 목록 */}
              <Droppable droppableId="parent-menus">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="admin-menu-list"
                  >
                    {parentMenus.map((menu, index) => (
                      <Draggable
                        key={menu.id}
                        draggableId={`parent-${menu.id}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="admin-menu-menu-item parent"
                          >
                            <div className="admin-menu-menu-item-header">
                              <div className="drag-handle"></div>
                              <h3>{menu.title}</h3>
                              <div className="admin-menu-menu-actions">
                                <button onClick={() => handleEditMenu(menu)} className="admin-button">
                                  수정
                                </button>
                                <button onClick={() => handleDeleteMenu(menu.id)} className="admin-button delete">
                                  삭제
                                </button>
                              </div>
                            </div>

                            {/* 하위 메뉴 목록 */}
                            <Droppable droppableId={`children-${menu.id}`}>
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="admin-submenu-list"
                                >
                                  {getChildMenus(menu.id).map((childMenu, childIndex) => (
                                    <Draggable
                                      key={childMenu.id}
                                      draggableId={`child-${childMenu.id}`}
                                      index={childIndex}
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className="admin-menu-menu-item child"
                                        >
                                          <div className="admin-menu-menu-item-header">
                                            <div className="drag-handle"></div>
                                            <h3>
                                              {childMenu.title}
                                              {childMenu.slug && (
                                                <span className="menu-url">/{childMenu.slug}</span>
                                              )}
                                            </h3>
                                            <div className="admin-menu-menu-actions">
                                              <button onClick={() => handleEditMenu(childMenu)} className="admin-button">
                                                수정
                                              </button>
                                              <button onClick={() => handleDeleteMenu(childMenu.id)} className="admin-button delete">
                                                삭제
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* 메뉴 추가/수정 폼 */}
          <div className="admin-menu-nav">
            <div className="admin-content-header">
              <h3 className="admin-content-title">
                {editingMenu ? '메뉴 수정' : '메뉴 추가'}
              </h3>
            </div>
            <form onSubmit={editingMenu ? handleUpdateMenu : handleAddMenu} className="admin-form">
              <div className="form-group">
                <label htmlFor="title">메뉴 이름</label>
                <input
                  type="text"
                  id="title"
                  value={editingMenu ? editingMenu.title : newMenu.title}
                  onChange={(e) => 
                    editingMenu 
                      ? setEditingMenu({ ...editingMenu, title: e.target.value })
                      : setNewMenu({ ...newMenu, title: e.target.value })
                  }
                  placeholder="메뉴 이름을 입력하세요"
                  className="admin-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="parent">상위 메뉴</label>
                <select
                  id="parent"
                  value={editingMenu ? editingMenu.parent_id || '' : newMenu.parent_id || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null;
                    editingMenu
                      ? setEditingMenu({ ...editingMenu, parent_id: value })
                      : setNewMenu({ ...newMenu, parent_id: value });
                  }}
                  className="admin-input"
                  disabled={editingMenu}
                >
                  <option value="">최상위 메뉴로 생성</option>
                  {parentMenus.map(menu => (
                    <option key={menu.id} value={menu.id}>{menu.title}</option>
                  ))}
                </select>
              </div>
              {(editingMenu?.parent_id || (!editingMenu && newMenu.parent_id)) && (
                <div className="form-group">
                  <label htmlFor="slug">URL</label>
                  <div>
                    <input
                      type="text"
                      id="slug"
                      value={editingMenu ? editingMenu.slug || '' : newMenu.slug}
                      onChange={(e) => 
                        editingMenu
                          ? setEditingMenu({ ...editingMenu, slug: e.target.value })
                          : setNewMenu({ ...newMenu, slug: e.target.value })
                      }
                      placeholder="영문, 숫자, 하이픈(-)만 사용"
                      className="admin-input"
                      required
                    />
                    <small className="admin-input-guide">
                      URL은 다른 메뉴와 겹치지 않아야 합니다.
                    </small>
                  </div>
                </div>
              )}
              <div className="admin-button-group">
                <button type="submit" className="admin-button">
                  {editingMenu ? '메뉴 수정' : '메뉴 추가'}
                </button>
                {editingMenu && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingMenu(null);
                      setNewMenu({ title: '', slug: '', parent_id: null, order_seq: 0 });
                    }} 
                    className="admin-button"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
