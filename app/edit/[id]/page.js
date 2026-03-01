'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function EditPage() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
    fetchPost();
  }, [router, params.id]);

  const fetchPost = async () => {
    try {
      const docRef = doc(db, 'posts', params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTitle(docSnap.data().title);
        setContent(docSnap.data().content);
      } else {
        alert('글을 찾을 수 없습니다');
        router.push('/');
      }
    } catch (error) {
      console.error('글 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return; }
    if (!content.trim()) { alert('내용을 입력해주세요'); return; }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', params.id), {
        title: title.trim(),
        content: content.trim(),
        updatedAt: serverTimestamp()
      });
      router.push('/');
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'posts', params.id));
      router.push('/');
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  if (!user || loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>📝 글 수정</h1>
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
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '2px solid #e0e0e0', fontSize: '18px', fontWeight: 'bold',
              marginBottom: '16px', outline: 'none', boxSizing: 'border-box'
            }}
          />

          <textarea
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleUpdate}
              disabled={saving}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontSize: '16px', fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? '저장 중...' : '💾 수정 완료'}
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '14px 24px', borderRadius: '12px', border: 'none',
                background: '#e74c3c', color: 'white', fontSize: '16px',
                fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}