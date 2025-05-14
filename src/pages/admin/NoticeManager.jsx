import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import '../../styles/admin.css';
import { v4 as uuidv4 } from 'uuid';

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

  // 에디터 설정
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'align',
    'color', 'background',
    'link', 'image'
  ];

  useEffect(() => {
    checkAuth();
    fetchNotices();
  }, []);

  const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.error('인증 오류:', error);
      alert('로그인이 필요합니다.');
      return false;
    }
    return true;
  };

  const fetchNotices = async () => {
    try {
      let query = supabase
        .from('notices')
        .select('*', { count: 'exact' });

      // 중요 공지사항 필터 적용
      if (showImportantOnly) {
        query = query.eq('is_important', true);
      }

      // Get total count first
      const { count, error: countError } = await query;

      if (countError) {
        throw countError;
      }

      setTotalCount(count);
      setTotalPages(Math.ceil(count / itemsPerPage));

      // Then get paginated data
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) {
        throw error;
      }
      setNotices(data || []);
    } catch (error) {
      console.error('공지사항 로딩 실패:', error);
      alert('공지사항을 불러오는데 실패했습니다.');
    }
  };

  // 필터나 페이지가 변경될 때마다 공지사항을 다시 불러옴
  useEffect(() => {
    fetchNotices();
  }, [currentPage, showImportantOnly]);

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
        const allowedExts = ['gif', 'jpg', 'jpeg', 'png', 'webp', 'pdf', 'hwp', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          alert(`${file.name}: 허용된 파일 형식이 아닙니다. (이미지: gif, jpg, jpeg, png, webp / 문서: pdf, hwp, docx, doc, xls, xlsx, ppt, pptx, txt)`);
          continue;
        }

        // 파일 이름에서 확장자 추출
        const fileExt = file.name.split('.').pop();
        // uuid로 고유한 파일 이름 생성
        const fileName = `${uuidv4()}.${fileExt}`;
        
        console.log('업로드할 파일 이름:', fileName);

        // 파일 업로드
        const { data, error: uploadError } = await supabase.storage
          .from('notice-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          if (uploadError.message.includes('bucket')) {
            alert('스토리지 버킷이 설정되지 않았습니다. 관리자에게 문의해주세요.');
            return;
          }
          alert(`${file.name} 업로드 실패: ${uploadError.message}`);
          continue;
        }

        // 파일 URL 가져오기
        const { data: { publicUrl }, error: urlError } = supabase.storage
          .from('notice-files')
          .getPublicUrl(fileName);

        if (urlError) {
          console.error('Get public URL error:', urlError);
          alert(`${file.name} URL 가져오기 실패: ${urlError.message}`);
          continue;
        }

        // 파일 정보 저장 (원본 파일 이름 유지)
        setFiles(prev => [...prev, {
          name: file.name, // 사용자에게 보여줄 원본 파일 이름
          url: publicUrl,
          size: file.size,
          type: file.type
        }]);
      }
    } catch (error) {
      console.error('파일 업로드 상세 에러:', error);
      alert(`파일 업로드 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
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
        is_important: isImportant
      };

      if (editingNoticeId) {
        const { error: updateError } = await supabase
          .from('notices')
          .update({
            ...noticeData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNoticeId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('notices')
          .insert([{
            ...noticeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      closeModal(true);
      fetchNotices();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
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
            // 예: https://xxxx.supabase.co/storage/v1/object/public/notice-files/파일명
            const matches = file.url.match(/public\/([^/]+)\/(.+)$/);
            if (matches) {
              const bucket = matches[1];
              const path = matches[2];
              await supabase.storage.from(bucket).remove([path]);
            }
          }
        }
      }
      // 2. DB에서 공지사항 삭제
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNotices();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const openModal = (notice = null) => {
    if (notice) {
      setEditingNoticeId(notice.id);
      setTitle(notice.title);
      setContent(notice.content || '');
      setFiles(notice.files || []);
      setIsImportant(notice.is_important || false);
    } else {
      setEditingNoticeId(null);
      setTitle('');
      setContent('');
      setFiles([]);
      setIsImportant(false);
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
                      setCurrentPage(1); // 필터 변경시 첫 페이지로 이동
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
                  {notices.map(notice => (
                    <div key={notice.id} className="admin-notice-item">
                      <div className="admin-notice-info">
                        <h3>
                          {notice.is_important && <span className="admin-important-badge">중요</span>}
                          {notice.title}
                        </h3>
                        <div className="admin-notice-meta">
                          <span>작성일: {formatDate(notice.created_at)}</span>
                          <span>조회수: {notice.views}</span>
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
                  <div style={{ flex: 10 }}>
                    <ReactQuill
                      key={editorKey}
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={modules}
                      formats={formats}
                      className="admin-quill-editor"
                    />
                    <small className="admin-editor-guide">
                      * 허용 형식: JPG, PNG, GIF, WEBP (최대 5MB)
                    </small>
                  </div>
                </div>
                <div className="form-group">
                  <label>첨부파일</label>
                  <div style={{ flex: 10 }}>
                    <input
                      type="file"
                      multiple
                      accept=".gif,.jpg,.jpeg,.png,.webp,.pdf,.hwp,.docx,.doc,.xls,.xlsx,.ppt,.pptx,.txt"
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
                                  // storage에서 파일 삭제
                                  if (file.url) {
                                    const matches = file.url.match(/public\/([^/]+)\/(.+)$/);
                                    if (matches) {
                                      const bucket = matches[1];
                                      const path = matches[2];
                                      await supabase.storage.from(bucket).remove([path]);
                                    }
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