import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getAllDocuments, addDocument, updateDocument, deleteDocument } from '../../lib/firebaseFirestore';
import { uploadImage, deleteFile } from '../../lib/fileManager';
import Modal from '../../components/Modal';
import AdminLayout from '../../components/AdminLayout';
import '../../styles/admin.css';
import { v4 as uuidv4 } from 'uuid';
import { Editor } from '@tinymce/tinymce-react';

const ContentManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [menus, setMenus] = useState([]);
  const [contents, setContents] = useState([]);
  const [editingContentId, setEditingContentId] = useState(null);
  const [selectedFilterMenuId, setSelectedFilterMenuId] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;

  // 메뉴 데이터 가져오기
  const fetchMenus = async () => {
    try {
      console.log('=== 메뉴 데이터 가져오기 시작 ===');
      
      // 모든 메뉴 가져오기
      const { data: allMenus, error } = await getAllDocuments('menus', {
        orderBy: [{ field: 'orderSeq', direction: 'asc' }]
      });

      if (error) throw error;

      console.log('Firebase에서 가져온 모든 메뉴:', allMenus);

      // 부모 메뉴와 자식 메뉴 분리
      const parents = allMenus.filter(menu => !menu.parentId);
      const children = allMenus.filter(menu => menu.parentId);

      console.log('부모 메뉴 (parentId가 없는 것):', parents);
      console.log('자식 메뉴 (parentId가 있는 것):', children);

      // 정렬된 메뉴 리스트 생성
      const formattedMenus = [];
      
      // 원하는 순서로 부모 메뉴 정렬
      const desiredOrder = ['학과', '아카이빙', '프린트룸', '기타'];
      const sortedParents = parents.sort((a, b) => {
        const aIndex = desiredOrder.indexOf(a.title);
        const bIndex = desiredOrder.indexOf(b.title);
        return aIndex - bIndex;
      });
      
      sortedParents.forEach(parent => {
        console.log(`부모 메뉴 "${parent.title}" 처리 중...`);
        
        // 게시판 메뉴는 숨김
        if (parent.title === '게시판') {
          console.log(`게시판 메뉴 숨김 처리`);
          return;
        }
        
        // 부모 메뉴는 선택 불가능하게 처리
        formattedMenus.push({
          ...parent,
          title: parent.title,
          disabled: true
        });
        
        // 해당 부모의 자식 메뉴들 추가
        const childMenus = children
          .filter(child => child.parentId === parent.id)
          .sort((a, b) => (a.orderSeq || 0) - (b.orderSeq || 0));
          
        console.log(`부모 "${parent.title}"의 자식 메뉴들:`, childMenus);
        
        childMenus.forEach(child => {
          // 공지 메뉴는 숨김
          if (child.title === '공지') {
            console.log(`공지 메뉴 숨김 처리`);
            return;
          }
          
          formattedMenus.push({
            ...child,
            title: child.title,
            disabled: false
          });
        });
      });

      console.log('최종 포맷된 메뉴:', formattedMenus);
      setMenus(formattedMenus);
      
      // 첫 번째 선택 가능한 메뉴를 기본값으로 설정
      if (formattedMenus.length > 0 && !selectedMenuId) {
        const firstSelectableMenu = formattedMenus.find(menu => !menu.disabled);
        if (firstSelectableMenu) {
          console.log('기본 메뉴 설정:', firstSelectableMenu.title, firstSelectableMenu.id);
          setSelectedMenuId(firstSelectableMenu.id);
          setSelectedFilterMenuId(firstSelectableMenu.id);
        } else {
          console.log('선택 가능한 메뉴가 없습니다!');
        }
      }
      
      console.log('=== 메뉴 데이터 가져오기 완료 ===');
    } catch (error) {
      console.error('메뉴 로딩 실패:', error);
    }
  };

  // 메뉴 선택 처리
  const handleMenuChange = (e) => {
    const menuId = e.target.value;
    setSelectedFilterMenuId(menuId);
    // 선택된 메뉴의 콘텐츠만 다시 불러오기
    fetchContents(menuId);
  };

  // 콘텐츠 데이터 가져오기
  const fetchContents = async (menuId = selectedFilterMenuId) => {
    try {
      console.log('=== 콘텐츠 로딩 시작 ===');
      console.log('요청한 메뉴 ID:', menuId);
      console.log('현재 selectedFilterMenuId:', selectedFilterMenuId);
      
      const { data, error } = await getAllDocuments('contents', {
        where: [{ field: 'menuId', operator: '==', value: menuId }],
        orderBy: [{ field: 'orderSeq', direction: 'asc' }]
      });

      if (error) throw error;
      console.log('Firebase에서 가져온 콘텐츠:', data);
      console.log('콘텐츠 개수:', data ? data.length : 0);
      setContents(data || []);
      
      console.log('=== 콘텐츠 로딩 완료 ===');
    } catch (error) {
      console.error('콘텐츠 로딩 실패:', error);
    }
  };

  // 콘텐츠 삭제 처리
  const handleDelete = async (id) => {
    // 삭제하려는 콘텐츠 찾기
    const contentToDelete = contents.find(content => content.id === id);
    if (!contentToDelete) return;

    // 현재 선택된 메뉴 찾기
    const currentMenu = menus.find(menu => menu.id === selectedFilterMenuId);
    const confirmMessage = `"${currentMenu?.title}" 메뉴의 "${contentToDelete.title}" 콘텐츠를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      // 1. storage 이미지 삭제 (imageUrl이 있을 때만)
      if (contentToDelete.imageUrl) {
        // R2에서 이미지 삭제
        const imagePath = contentToDelete.imageUrl.split('/').slice(-2).join('/'); // content-images/filename.jpg
        await deleteFile(imagePath);
      }
      
      // 2. DB에서 콘텐츠 삭제
      const { success, error } = await deleteDocument('contents', id);
      if (!success) throw error;
      
      fetchContents();
    } catch (error) {
      console.error('콘텐츠 삭제 실패:', error);
      alert('콘텐츠 삭제에 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchMenus();
  }, []);

  // 선택된 메뉴가 변경될 때마다 콘텐츠 다시 로드
  useEffect(() => {
    if (selectedFilterMenuId) {
      fetchContents(selectedFilterMenuId);
    }
  }, [selectedFilterMenuId]);

  const openModal = (contentToEdit = null) => {
    if (contentToEdit) {
      setEditingContentId(contentToEdit.id);
      setTitle(contentToEdit.title);
      setContent(contentToEdit.content || '');
      setSelectedMenuId(contentToEdit.menuId);
      setImageUrl(contentToEdit.imageUrl || '');
    } else {
      setEditingContentId(null);
      setTitle('');
      setContent('');
      setSelectedMenuId(selectedFilterMenuId);
      setImageUrl('');
    }
    setEditorKey(prev => prev + 1);
    setIsModalOpen(true);
  };

  const closeModal = (isSubmitting = false) => {
    if (!isSubmitting) {
      // 입력된 내용이 있는지 확인
      const hasContent = title.trim() || content.trim() || imageUrl;
      
      if (hasContent) {
        const confirmed = window.confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?');
        if (!confirmed) {
          return;
        }
      }
    }

    setIsModalOpen(false);
    setEditingContentId(null);
    setTitle('');
    setContent('');
    setSelectedMenuId('');
    setImageUrl('');
    setEditorKey(prev => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        alert('제목을 입력해주세요.');
        return;
      }
      if (!content.trim()) {
        alert('내용을 입력해주세요.');
        return;
      }
      if (!selectedMenuId) {
        alert('메뉴를 선택해주세요.');
        return;
      }

      const contentData = {
        title: title.trim(),
        content: content.trim(),
        menuId: selectedMenuId,
        imageUrl: imageUrl,
        orderSeq: editingContentId ? contents.find(c => c.id === editingContentId)?.orderSeq || 0 : contents.length
      };

      if (editingContentId) {
        // 수정
        const { success, error } = await updateDocument('contents', editingContentId, contentData);
        if (!success) throw error;
      } else {
        // 새로 추가
        const { id, error } = await addDocument('contents', contentData);
        if (error) throw error;
      }

      closeModal(true);
      fetchContents();
    } catch (error) {
      console.error('콘텐츠 저장 실패:', error);
      alert('콘텐츠 저장에 실패했습니다.');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(contents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setContents(items);

    // 순서 업데이트
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        data: { orderSeq: index }
      }));

      for (const update of updates) {
        await updateDocument('contents', update.id, update.data);
      }
    } catch (error) {
      console.error('순서 업데이트 실패:', error);
      // 실패 시 원래 순서로 복원
      fetchContents();
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getPreviewText = (content) => {
    const text = stripHtml(content);
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const handleImageUpload = async (file) => {
    try {
      const path = `content-images/${Date.now()}_${file.name}`;
      const result = await uploadImage(file, path);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setImageUrl(result.url);
      return result.url;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  console.log('=== 렌더링 상태 ===');
  console.log('menus:', menus);
  console.log('contents:', contents);
  console.log('selectedFilterMenuId:', selectedFilterMenuId);
  console.log('selectedMenuId:', selectedMenuId);

  return (
    <AdminLayout>
      <div className="admin-content">
        <h2 className="admin-page-title">콘텐츠 관리</h2>
        <div className="admin-content-layout">
          {/* 사이드 메뉴 네비게이션 */}
          <div className="admin-content-nav">
            <div className="admin-menu-list">
              {menus.map(menu => (
                <div 
                  key={menu.id}
                  className={`admin-menu-item ${menu.disabled ? 'parent' : 'child'} ${selectedFilterMenuId === menu.id ? 'active' : ''}`}
                  onClick={() => {
                    if (!menu.disabled) {
                      console.log('메뉴 선택:', menu.title, menu.id);
                      setSelectedFilterMenuId(menu.id);
                      fetchContents(menu.id);
                    }
                  }}
                >
                  {menu.title}
                </div>
              ))}
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="admin-content-main">
            <div className="admin-content-header">
              <h3 className="admin-content-title">
                '{menus.find(m => m.id === selectedFilterMenuId)?.title || ''}' 콘텐츠 목록
              </h3>
              <button onClick={() => openModal()} className="admin-button">
                새 콘텐츠 추가
              </button>
            </div>
            <p className="menu-structure-guide">드래그하여 게시글 순서를 변경할 수 있습니다.</p>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="contents">
                {(provided) => (
                  <div
                    className="admin-content-list"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {contents.length > 0 ? (
                      contents.map((content, index) => (
                        <Draggable
                          key={content.id}
                          draggableId={content.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="admin-content-item"
                            >
                              <div className="drag-handle"></div>
                              <div className="admin-content-item-body">
                                <div className="admin-content-item-header">
                                  <h3>{content.title}</h3>
                                  <div className="admin-content-actions">
                                    <button onClick={() => openModal(content)} className="admin-button">
                                      수정
                                    </button>
                                    <button onClick={() => handleDelete(content.id)} className="admin-button delete">
                                      삭제
                                    </button>
                                  </div>
                                </div>
                                <div className="admin-content-preview">
                                  <p>{getPreviewText(content.content)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="no-content-message">콘텐츠가 없습니다</div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <div className="admin-content-form">
              <h3 className="admin-modal-title">
                콘텐츠 {editingContentId ? '수정' : '추가'}
              </h3>
              <p className="current-menu">
                {menus.find(m => m.id === selectedMenuId)?.title || ''}
              </p>
              <div className="form-group">
                <label htmlFor="title">글 제목</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="10자 내외의 제목을 입력하세요."
                  className="admin-input"
                />
              </div>
              
              {/* 이미지 업로드 필드 */}
              <div className="admin-image-upload form-group">
                <label htmlFor="image">이미지</label>
                <div style={{ flex: 10 }}>
                  <input
                    type="file"
                    id="image"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        await handleImageUpload(file);
                      }
                      e.target.value = '';
                    }}
                    className="admin-input"
                  />
                  <small className="admin-file-restrictions">
                    * 허용 형식: JPG, PNG, GIF, WEBP (최대 5MB)
                  </small>
                  {imageUrl && (
                    <div className="admin-image-preview">
                      <div className="admin-image-wrap">
                        <img src={imageUrl} alt="미리보기" style={{ maxWidth: 120, maxHeight: 120 }} />
                        <button
                          onClick={async () => {
                            const imagePath = imageUrl.split('/').slice(-2).join('/');
                            await deleteFile(imagePath);
                            setImageUrl('');
                          }}
                          className="admin-button"
                        >
                          이미지 제거
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>내용</label>
                <div style={{ flex: 10 }}>
                  <Editor
                    apiKey={apiKey}
                    value={content}
                    init={{
                      height: 400,
                      menubar: false,
                      plugins: [
                        'lists',
                        'link',
                        'table',
                        'code',
                        'advlist'
                      ],
                      toolbar: 'undo redo | ' +
                        'bold italic underline forecolor backcolor | ' +
                        'alignleft aligncenter alignright alignjustify | ' +
                        'bullist numlist | link table | code',
                      formats: {
                        forecolor: { inline: 'span', styles: { color: '%value' } },
                        backcolor: { inline: 'span', styles: { 'background-color': '%value' } }
                      },
                      base_url: 'https://cdn.jsdelivr.net/npm/tinymce@6.8.3',
                      setup: (editor) => {
                        editor.on('init', () => {
                          const container = editor.getContainer();
                          const editorElement = editor.getBody();
                          
                          const passiveEvents = ['scroll', 'wheel', 'touchstart', 'touchmove'];
                          passiveEvents.forEach(eventType => {
                            container.addEventListener(eventType, () => {}, { passive: true });
                            editorElement.addEventListener(eventType, () => {}, { passive: true });
                          });
                        });
                      },
                      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 18px; }',
                      branding: false,
                      promotion: false,
                      resize: false,
                      statusbar: false,
                      browser_spellcheck: true,
                      contextmenu: false,
                      paste_data_images: true,
                      paste_as_text: false,
                      paste_webkit_styles: 'all',
                      paste_merge_formats: true,
                      paste_preprocess: function(plugin, args) {
                        const allowedStyles = [
                          'color', 'font-size', 'text-decoration', 'font-weight',
                          'text-align', 'text-align-last', 'text-justify'
                        ];
                        args.content = args.content.replace(/style="([^"]*)"/g, (match, styleStr) => {
                          const filtered = styleStr
                            .split(';')
                            .map(s => s.trim())
                            .filter(s => allowedStyles.some(a => s.startsWith(a)))
                            .join('; ');
                          return filtered ? `style="${filtered}"` : '';
                        });
                      },
                      default_link_target: '_blank',
                      link_assume_external_targets: true,
                      link_default_protocol: 'https',
                      onboarding: false,
                      quickbars_selection_toolbar: false,
                      quickbars_insert_toolbar: false,
                      quickbars_image_toolbar: false
                    }}
                    onEditorChange={(newValue) => setContent(newValue)}
                  />
                </div>
              </div>
              <div className="admin-button-group">
                <button onClick={handleSubmit} className="admin-button">
                  {editingContentId ? '수정' : '추가'}
                </button>
                <button onClick={e => { e.stopPropagation(); closeModal(); }} className="admin-button">
                  취소
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContentManager;
