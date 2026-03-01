'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function WritePage() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
  }, [router]);

  const handleSave = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return; }
    if (!content.trim()) { alert('내용을 입력해주세요'); return; }

    setSaving(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        author: user.name,
        authorId: user.id,
        emoji: user.emoji,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      router.push('/');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>✏️ 새 글 작성</h1>
        <button onClick={() => router.push('/')} style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '8px 16px', borderRadius: '8px', border: 'none',
          cursor: 'pointer', fontSize: '14px'
        }}>
          ← 돌아가기
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#888' }}>
            {user.emoji} {user.name}
          </div>

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '2px solid #e0e0e0', fontSize: '18px', fontWeight: 'bold',
              marginBottom: '16px', outline: 'none', boxSizing: 'border-box'
            }}
          />

          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '2px solid #e0e0e0', fontSize: '16px', lineHeight: '1.8',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              marginBottom: '16px'
            }}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', fontSize: '16px', fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? '저장 중...' : '💾 저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}