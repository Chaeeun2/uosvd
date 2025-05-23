import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
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
      // 모든 메뉴 가져오기
      const { data: allMenus, error } = await supabase
        .from('menus')
        .select('*')
        .order('order_seq');

      if (error) throw error;

      // 부모 메뉴와 자식 메뉴 분리
      const parents = allMenus.filter(menu => !menu.parent_id);
      const children = allMenus.filter(menu => menu.parent_id);

      // 정렬된 메뉴 리스트 생성
      const formattedMenus = [];
      parents.forEach(parent => {
        // 부모 메뉴는 선택 불가능하게 처리
        formattedMenus.push({
          ...parent,
          title: parent.title,
          disabled: true
        });
        
        // 해당 부모의 자식 메뉴들 추가
        const childMenus = children
          .filter(child => child.parent_id === parent.id)
          .sort((a, b) => a.order_seq - b.order_seq);
          
        childMenus.forEach(child => {
          formattedMenus.push({
            ...child,
            title: child.title,
            disabled: false
          });
        });
      });

      setMenus(formattedMenus);
      
      // 첫 번째 선택 가능한 메뉴를 기본값으로 설정
      if (formattedMenus.length > 0 && !selectedMenuId) {
        const firstSelectableMenu = formattedMenus.find(menu => !menu.disabled);
        if (firstSelectableMenu) {
          setSelectedMenuId(firstSelectableMenu.id);
          setSelectedFilterMenuId(firstSelectableMenu.id);
        }
      }
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
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('menu_id', menuId)
        .order('order_seq', { ascending: true });

      if (error) throw error;
      setContents(data || []);
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
      // 1. storage 이미지 삭제 (image_url이 있을 때만)
      if (contentToDelete.image_url) {
        // 예: https://xxxx.supabase.co/storage/v1/object/public/content-images/파일명
        const matches = contentToDelete.image_url.match(/public\/([^/]+)\/(.+)$/);
        if (matches) {
          const bucket = matches[1];
          const path = matches[2];
          await supabase.storage.from(bucket).remove([path]);
        }
      }
      // 2. DB에서 콘텐츠 삭제
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
      setSelectedMenuId(contentToEdit.menu_id);
      setImageUrl(contentToEdit.image_url || '');
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

      // 현재 메뉴의 마지막 order_seq 구하기
      let nextOrderSeq = 1;
      if (!editingContentId) {
        const { data: maxOrder, error: maxOrderError } = await supabase
          .from('contents')
          .select('order_seq')
          .eq('menu_id', selectedMenuId)
          .order('order_seq', { ascending: false })
          .limit(1)
          .single();
        if (!maxOrderError && maxOrder && maxOrder.order_seq) {
          nextOrderSeq = maxOrder.order_seq + 1;
        }
      }

      const contentData = {
        title: title.trim(),
        content: content.trim(),
        menu_id: selectedMenuId,
        image_url: imageUrl || null
      };

      if (editingContentId) {
        const { error: updateError } = await supabase
          .from('contents')
          .update({
            ...contentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContentId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('contents')
          .insert([{
            ...contentData,
            order_seq: nextOrderSeq,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      closeModal(true);
      fetchContents(selectedMenuId);
    } catch (error) {
      console.error('콘텐츠 저장 실패:', error);
      alert(`콘텐츠 저장에 실패했습니다: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  // 콘텐츠 순서 변경 처리
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(contents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 순서 업데이트
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_seq: index + 1
    }));

    setContents(updatedItems);

    // DB 업데이트
    try {
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('contents')
          .update({ order_seq: item.order_seq })
          .eq('id', item.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('순서 업데이트 실패:', error);
      alert('순서 변경 저장에 실패했습니다.');
      fetchContents(); // 실패 시 다시 로드
    }
  };

  // HTML 태그 제거 함수
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // 콘텐츠 미리보기 텍스트 생성
  const getPreviewText = (content) => {
    const plainText = stripHtml(content);
    return plainText.length > 50 ? plainText.substring(0, 70) + '...' : plainText;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      alert('허용된 이미지 형식이 아닙니다. (JPG, PNG, GIF, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('content-images')
      .upload(fileName, file);
    if (error) {
      alert('이미지 업로드 실패: ' + error.message);
      return;
    }
    const { data: publicData } = supabase.storage.from('content-images').getPublicUrl(fileName);
    const publicUrl = publicData?.publicUrl;
    if (publicUrl && typeof publicUrl === 'string') {
      setImageUrl(publicUrl);
    }
  };

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
                    if (!menu.disabled && menu.title !== '공지') {
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
                            const matches = imageUrl.match(/public\/([^/]+)\/(.+)$/);
                            if (matches) {
                              const bucket = matches[1];
                              const path = matches[2];
                              await supabase.storage.from(bucket).remove([path]);
                            }
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
