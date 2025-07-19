import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { getAllDocuments, addDocument, updateDocument, deleteDocument, getDocument } from '../../lib/firebaseFirestore';
import { uploadToR2, deleteFromR2 } from '../../lib/cloudflareR2';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import '../../styles/admin.css';
import { v4 as uuidv4 } from 'uuid';

const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;

function MyEditorComponent({ content, setContent }) {
  // 에디터 외부 이미지 업로드 핸들러
  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      // 확장자 및 크기 체크
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('허용된 이미지 형식이 아닙니다. (JPG, PNG, GIF, WEBP)');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        continue;
      }
      try {
        const fileName = `notice-images/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
        const { url, error } = await uploadToR2(file, fileName);
        
        if (error) {
          alert('이미지 업로드 실패: ' + error);
          continue;
        }
        
        // 에디터에 이미지 삽입
        if (window.tinymce && window.tinymce.activeEditor) {
          window.tinymce.activeEditor.insertContent(`<img src="${url}" style="max-width:100%;" />`);
        }
      } catch (error) {
        alert('이미지 업로드 실패: ' + error.message);
      }
    }
    // 파일 input 초기화
    e.target.value = '';
  };

  return (
    <>
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
    </>
  );
}

const NoticeManager = () => {
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [files, setFiles] = useState([]);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const itemsPerPage = 10;
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      // 모든 공지사항을 가져온 후 클라이언트에서 필터링 (임시 해결책)
      const { data, error } = await getAllDocuments('notices', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      });

      if (error) {
        throw error;
      }

      // 클라이언트에서 필터링
      let filteredData = data || [];
      
      if (showImportantOnly) {
        filteredData = filteredData.filter(notice => {
          // 여러 가능한 필드명 확인
          const isImportant = notice.isImportant || notice.is_important || false;
          return isImportant === true;
        });
      }

      // 페이지네이션 적용
      const totalCount = filteredData.length;
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setTotalCount(totalCount);
      setTotalPages(totalPages);
      setNotices(paginatedData);
    } catch (error) {
      alert('공지사항을 불러오는데 실패했습니다.');
    }
  };

  // 필터나 페이지가 변경될 때마다 공지사항을 다시 불러옴
  useEffect(() => {
    fetchNotices();
  }, [currentPage, showImportantOnly]);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [showImportantOnly]);

  const handleFileUpload = async (uploadFiles) => {
    try {
      // FileList를 배열로 변환
      const filesArray = Array.from(uploadFiles);
      
      for (const file of filesArray) {
        // 파일 크기 제한 (20MB)
        const MAX_FILE_SIZE = 20 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          alert(`${file.name}: 파일 크기는 20MB 이하여야 합니다. 현재 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          continue;
        }

        // 확장자 체크
        const allowedExts = ['gif', 'jpg', 'jpeg', 'png', 'webp', 'pdf', 'hwp', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip'];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          alert(`${file.name}: 허용된 파일 형식이 아닙니다. (이미지: gif, jpg, jpeg, png, webp / 문서: pdf, hwp, docx, doc, xls, xlsx, ppt, pptx, txt, zip)`);
          continue;
        }

        // 파일 이름에서 확장자 추출
        const fileExt = file.name.split('.').pop();
        // uuid로 고유한 파일 이름 생성
        const fileName = `${uuidv4()}.${fileExt}`;
        
        // 파일 업로드
        const { url, error: uploadError } = await uploadToR2(file, `notice-files/${fileName}`);

        if (uploadError) {
          alert(`${file.name} 업로드 실패: ${uploadError}`);
          continue;
        }

        // 파일 정보 저장 (원본 파일 이름 유지)
        setFiles(prev => [...prev, {
          name: file.name, // 사용자에게 보여줄 원본 파일 이름
          url: url,
          size: file.size,
          type: file.type
        }]);
      }
    } catch (error) {
      alert(`파일 업로드 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  const handleImagesUpload = async (files) => {
    const urls = [];
    for (const file of files) {
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('허용된 이미지 형식이 아닙니다. (JPG, PNG, GIF, WEBP)');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        continue;
      }
      
      try {
        const fileName = `notice-images/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
        const { url, error } = await uploadToR2(file, fileName);
        
        if (error) {
          alert('이미지 업로드 실패: ' + error);
          continue;
        }
        
        urls.push(url);
      } catch (error) {
        alert('이미지 업로드 실패: ' + error.message);
      }
    }
    setImageUrls(prev => [...prev, ...urls]);
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
    
    try {
      const fileName = `notice-images/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
      const { url, error } = await uploadToR2(file, fileName);
      
      if (error) {
        alert('이미지 업로드 실패: ' + error);
        return;
      }
      
      setImageUrls(prev => [...prev, url]);
    } catch (error) {
      alert('이미지 업로드 실패: ' + error.message);
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrls.length > 0) {
      for (const url of imageUrls) {
        try {
          // R2에서 이미지 삭제
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await deleteFromR2(`notice-images/${fileName}`);
        } catch (error) {
          // 이미지 삭제 실패 시 무시
        }
      }
    }
    setImageUrls([]);
    setImageFiles([]);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!title.trim()) {
        alert('제목을 입력해주세요.');
        return;
      }

      const noticeData = {
        title: title.trim(),
        content: content.trim(),
        files: files,
        isImportant: isImportant,
        imageUrls: imageUrls,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingNoticeId) {
        // 먼저 문서가 존재하는지 확인
        const { data: existingNotice, error: checkError } = await getDocument('notices', editingNoticeId);
        
        if (checkError || !existingNotice) {
          alert('수정할 공지사항을 찾을 수 없습니다. 새로 작성해주세요.');
          setEditingNoticeId(null);
          return;
        }

        const { error } = await updateDocument('notices', editingNoticeId, {
          title: noticeData.title,
          content: noticeData.content,
          files: noticeData.files,
          imageUrls: noticeData.imageUrls,
          isImportant: noticeData.isImportant,
          updatedAt: new Date().toISOString()
        });

        if (error) throw error;
      } else {
        const { error } = await addDocument('notices', noticeData);

        if (error) throw error;
      }

      closeModal(true);
      fetchNotices();
    } catch (error) {
      alert(`공지사항 저장에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      // 1. 삭제하려는 공지의 첨부파일 정보 가져오기
      const noticeToDelete = notices.find(notice => notice.id === id);
      if (noticeToDelete && Array.isArray(noticeToDelete.files)) {
        for (const file of noticeToDelete.files) {
          if (file.url) {
            try {
              // R2에서 파일 삭제
              const urlParts = file.url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const deleteResult = await deleteFromR2(`notice-files/${fileName}`);
              if (!deleteResult.success) {
                // 파일 삭제 실패 시 무시
              }
            } catch (error) {
              // 파일 삭제 실패 시 무시
            }
          }
        }
      }
      
      // 2. DB에서 공지사항 삭제
      const { error } = await deleteDocument('notices', id);

      if (error) throw error;
      fetchNotices();
    } catch (error) {
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const openModal = (notice = null) => {
    if (notice) {
      setEditingNoticeId(notice.id);
      setTitle(notice.title);
      setContent(notice.content || '');
      setFiles(notice.files || []);
      setIsImportant(notice.isImportant || notice.is_important || false);
      setImageUrls(notice.imageUrls || notice.image_urls || []);
    } else {
      setEditingNoticeId(null);
      setTitle('');
      setContent('');
      setFiles([]);
      setIsImportant(false);
      setImageUrls([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = (isSubmitting = false) => {
    if (!isSubmitting) {
      const hasContent = title.trim() || content.trim() || files.length > 0;
      
      if (hasContent) {
        const confirmed = window.confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?');
        if (!confirmed) {
          return;
        }
      }
    }

    setIsModalOpen(false);
    setEditingNoticeId(null);
    setTitle('');
    setContent('');
    setFiles([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) return <></>;

  return (
    <AdminLayout>
      <div className="admin-content">
        <h2 className="admin-page-title">공지사항 관리</h2>
        <div className="admin-content-layout">
          {/* 공지사항 목록 */}
          <div className="admin-content-main">
            <div className="admin-content-header">
              <div className="admin-content-controls">
                <h3 className="admin-content-title">게시글 목록</h3>
                <label className="admin-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={showImportantOnly}
                    onChange={(e) => {
                      setShowImportantOnly(e.target.checked);
                    }}
                  />
                  <span className="checkmark"></span>
                  중요 공지만 보기
                </label>
              </div>
              <button onClick={() => openModal()} className="admin-button">
                새 공지사항 작성
              </button>
            </div>

            <div className="admin-content-list">
              {notices.length > 0 ? (
                <>
                  {notices.map((notice, index) => (
                    <div key={`${notice.id}-${index}`} className="admin-notice-item">
                      <div className="admin-notice-info">
                        <h3>
                          {(notice.isImportant || notice.is_important) && <span className="admin-important-badge">중요</span>}
                          {notice.title}
                        </h3>
                        <div className="admin-notice-meta">
                          <span>작성일: {formatDate(notice.createdAt || notice.created_at)}</span>
                          <span>조회수: {notice.views || 0}</span>
                        </div>
                      </div>
                      <div className="admin-notice-actions">
                        <button onClick={() => openModal(notice)} className="admin-button">
                          수정
                        </button>
                        <button onClick={() => handleDelete(notice.id)} className="admin-button">
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination Controls */}
                  <div className="admin-pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="admin-button"
                    >
                      이전
                    </button>
                    <span className="admin-page-info">
                      {currentPage} / {totalPages} 페이지
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="admin-button"
                    >
                      다음
                    </button>
                  </div>
                </>
              ) : (
                <div className="admin-no-notices">등록된 공지사항이 없습니다.</div>
              )}
            </div>
          </div>

          {isModalOpen && (
            <Modal isOpen={isModalOpen} onClose={closeModal}>
              <div className="admin-content-form">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                  <h3 className="admin-modal-title" style={{ marginBottom: 0 }}>
                    {editingNoticeId ? '공지사항 수정' : '새 공지사항 작성'}
                  </h3>
                  <div className="admin-important-checkbox" style={{ marginLeft: 'auto' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isImportant}
                        onChange={(e) => setIsImportant(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      중요 공지로 설정
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notice-title">제목</label>
                  <input
                    type="text"
                    id="notice-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요."
                    className="admin-input" 
                  />
                </div>
                <div className="form-group">
                  <label>내용</label>
                  <MyEditorComponent content={content} setContent={setContent}  style={{ flex: 10 }} />
                </div>
                                                <div className="form-group">
                  <label>이미지</label>
                  <div style={{ flex: 10 }}>
                    <input
                      type="file"
                      id="image"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        await handleImagesUpload(files);
                        e.target.value = '';
                      }}
                      className="admin-input"
                    />
                    <small className="admin-file-restrictions">
                      * 허용 형식: JPG, PNG, GIF, WEBP (최대 5MB)
                    </small>
                    {imageUrls.length > 0 && (
                      <div className="admin-image-preview">
                        {imageUrls.map((url, idx) => (
                          <div className="admin-image-wrap" key={idx}>
                            <img src={url} alt="미리보기" style={{ maxWidth: 120, maxHeight: 120 }} />
                            <button
                              onClick={async () => {
                                try {
                                  // R2에서 이미지 삭제
                                  const urlParts = url.split('/');
                                  const fileName = urlParts[urlParts.length - 1];
                                  const deleteResult = await deleteFromR2(`notice-images/${fileName}`);
                                  if (!deleteResult.success) {
                                    // 이미지 삭제 실패 시 무시
                                  }
                                } catch (error) {
                                  // 이미지 삭제 실패 시 무시
                                }
                                setImageUrls(imageUrls.filter((_, i) => i !== idx));
                              }}
                              className="admin-button"
                            >
                              이미지 제거
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>첨부파일</label>
                  <div style={{ flex: 10 }}>
                    <input
                      type="file"
                      multiple
                      accept=".gif,.jpg,.jpeg,.png,.webp,.pdf,.hwp,.docx,.doc,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleFileUpload(files);
                        }
                      }}
                      className="admin-input"
                    />
                    <small className="admin-file-restrictions">
                      * 최대 파일 크기: 20MB
                    </small>
                    {files.length > 0 && (
                      <div className="admin-attached-files">
                        <h4>첨부된 파일:</h4>
                        <ul>
                          {files.map((file, index) => (
                            <li key={index}>
                              {file.name}
                              <button
                                onClick={async () => {
                                  try {
                                    // R2에서 파일 삭제
                                    if (file.url) {
                                      const urlParts = file.url.split('/');
                                      const fileName = urlParts[urlParts.length - 1];
                                      const deleteResult = await deleteFromR2(`notice-files/${fileName}`);
                                      if (!deleteResult.success) {
                                        console.warn('파일 삭제 실패:', deleteResult.error);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('파일 삭제 실패:', error);
                                  }
                                  setFiles(files.filter((_, i) => i !== index));
                                }}
                                className="admin-remove-file"
                              >
                                삭제
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="admin-button-group">
                  <button
                    onClick={handleSubmit}
                    className="admin-button"
                    disabled={isLoading}
                  >
                    {isLoading ? '처리중...' : (editingNoticeId ? '수정' : '등록')}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); closeModal(); }}
                    className="admin-button"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NoticeManager; 