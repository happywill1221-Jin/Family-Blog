'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export default function NewEssayPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([{ id: uid(), type: 'text', content: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const textareaRefs = useRef({});
  const fileInputRef = useRef(null);
  const blocksRef = useRef(blocks);

  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const addTextBlock = () => {
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '' }]);
  };

  const handleTextChange = (blockId, value) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, content: value } : b
    ));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const blockId = uid();
      setBlocks(prev => [...prev, { id: blockId, type: 'image', url: '', caption: '', uploading: true }]);

      try {
        const storageRef = ref(storage, `essays/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setBlocks(prev => prev.map(b =>
          b.id === blockId ? { ...b, url, uploading: false } : b
        ));
      } catch (err) {
        console.error('이미지 업로드 실패:', err);
        setBlocks(prev => prev.filter(b => b.id !== blockId));
        alert('이미지 업로드에 실패했습니다.');
      }
    }
    e.target.value = '';
  };

  const removeBlock = (blockId) => {
    setBlocks(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(b => b.id !== blockId);
    });
  };

  const moveBlock = (index, direction) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prev;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  const handleCaptionChange = (blockId, caption) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, caption } : b
    ));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }

    const hasContent = blocks.some(b =>
      (b.type === 'text' && b.content.trim()) ||
      (b.type === 'image' && b.url)
    );
    if (!hasContent) {
      setError('내용을 입력해주세요');
      return;
    }

    if (blocks.some(b => b.uploading)) {
      setError('이미지 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const blocksToSave = blocks
        .filter(b => (b.type === 'text' && b.content.trim()) || (b.type === 'image' && b.url))
        .map(({ uploading, ...rest }) => rest);

      const docRef = await addDoc(collection(db, 'essays'), {
        title: title.trim(),
        blocks: blocksToSave,
        author: user.name,
        authorEmoji: user.emoji,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/essays/${docRef.id}`);
    } catch (err) {
      console.error('저장 실패:', err);
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* 네비게이션 */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250,250,248,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'slideDown 0.6s ease',
      }}>
        <button
          onClick={() => {
            if (title || blocks.some(b => b.content || b.url)) {
              if (!window.confirm('작성 중인 내용이 있습니다. 나가시겠습니까?')) return;
            }
            router.push('/essays');
          }}
          style={{
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 15, fontWeight: 600,
            color: 'var(--text)', fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 20 }}>←</span> 취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? 'var(--text-light)' : 'var(--gradient)',
            color: 'white', border: 'none',
            padding: '8px 24px', borderRadius: 'var(--radius-full)',
            fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: saving ? 'none' : 'var(--shadow-glow)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {saving ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              저장 중...
            </>
          ) : (
            '발행하기 ✨'
          )}
        </button>
      </nav>

      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px',
        animation: 'slideUp 0.7s ease',
      }}>
        {/* 에러 메시지 */}
        {error && (
          <div style={{
            background: '#FFF5F5', color: 'var(--danger)',
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            fontSize: 14, marginBottom: 20, animation: 'fadeIn 0.3s ease',
          }}>
            {error}
          </div>
        )}

        {/* 제목 */}
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
          style={{
            width: '100%', border: 'none', outline: 'none',
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 900, background: 'transparent',
            marginBottom: 32, letterSpacing: '-0.02em',
            fontFamily: 'inherit', color: 'var(--text)',
          }}
        />

        {/* 블록 에디터 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {blocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                position: 'relative',
                background: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {/* 블록 컨트롤 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
                background: '#fafaf8',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>
                  {block.type === 'text' ? '📝 텍스트' : '🖼️ 이미지'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => moveBlock(index, -1)}
                    disabled={index === 0}
                    style={{
                      background: 'none', border: 'none',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      opacity: index === 0 ? 0.3 : 1,
                      fontSize: 14, padding: '2px 6px', borderRadius: 4,
                    }}
                    title="위로 이동"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveBlock(index, 1)}
                    disabled={index === blocks.length - 1}
                    style={{
                      background: 'none', border: 'none',
                      cursor: index === blocks.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: index === blocks.length - 1 ? 0.3 : 1,
                      fontSize: 14, padding: '2px 6px', borderRadius: 4,
                    }}
                    title="아래로 이동"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeBlock(block.id)}
                    disabled={blocks.length <= 1}
                    style={{
                      background: 'none', border: 'none',
                      cursor: blocks.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: blocks.length <= 1 ? 0.3 : 1,
                      fontSize: 14, padding: '2px 6px', borderRadius: 4,
                      color: 'var(--danger)',
                    }}
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 블록 내용 */}
              {block.type === 'text' ? (
                <textarea
                  ref={el => {
                    if (el) textareaRefs.current[block.id] = el;
                  }}
                  value={block.content}
                  onChange={(e) => {
                    handleTextChange(block.id, e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="이야기를 적어보세요..."
                  style={{
                    width: '100%', border: 'none', outline: 'none',
                    resize: 'none', overflow: 'hidden',
                    padding: '16px 20px', fontSize: 15, lineHeight: 1.8,
                    minHeight: 120, background: 'transparent',
                    fontFamily: 'inherit', color: 'var(--text)',
                  }}
                />
              ) : (
                <div style={{ padding: '16px 20px' }}>
                  {block.uploading ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '40px 20px', gap: 12,
                      color: 'var(--text-secondary)',
                    }}>
                      <div className="spinner" />
                      <span>업로드 중...</span>
                    </div>
                  ) : block.url ? (
                    <div>
                      <img
                        src={block.url}
                        alt=""
                        style={{
                          width: '100%', borderRadius: 'var(--radius-md)',
                          marginBottom: 8,
                        }}
                      />
                      <input
                        type="text"
                        placeholder="사진 설명 (선택)"
                        value={block.caption || ''}
                        onChange={(e) => handleCaptionChange(block.id, e.target.value)}
                        style={{
                          width: '100%', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px', fontSize: 13,
                          outline: 'none', fontFamily: 'inherit',
                          color: 'var(--text-secondary)',
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 블록 추가 버튼 */}
        <div style={{
          display: 'flex', gap: 12, marginTop: 20,
          justifyContent: 'center',
        }}>
          <button
            onClick={addTextBlock}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              padding: '12px 20px', borderRadius: 'var(--radius-full)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'var(--transition)', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            📝 텍스트 추가
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              padding: '12px 20px', borderRadius: 'var(--radius-full)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'var(--transition)', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            🖼️ 이미지 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}