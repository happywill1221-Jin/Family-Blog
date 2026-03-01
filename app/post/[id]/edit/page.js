'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { CATEGORIES } from '@/lib/categories';
import { getUserName, getUserEmoji, getUserId } from '@/lib/user';

export default function EditPost() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    setUser(u);

    const uId = getUserId(u);

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'posts', id));
        if (snap.exists()) {
          const data = snap.data();
          const docAuthorId = data.authorId || data.uid || data.userId || '';
          if (docAuthorId !== uId) { router.push('/'); return; }
          setTitle(data.title || '');
          setContent(data.content || '');
          setCategory(data.category || 'etc');
        } else { router.push('/'); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const currentName = getUserName(user);
  const currentEmoji = getUserEmoji(user);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', id), {
        title: title.trim(),
        content: content.trim(),
        category
      });
      router.push(`/post/${id}`);
    } catch (e) { console.error(e); alert('수정에 실패했습니다'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <p style={{ color: '#999' }}>로딩 중...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 20px', color: 'white'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/post/${id}`} style={{ color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>← 돌아가기</Link>
          <span style={{ fontSize: '14px' }}>{currentEmoji} {currentName}</span>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '32px 28px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '800', color: '#1a1a2e' }}>
            ✏️ 글 수정
          </h2>

          {/* 카테고리 선택 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
              🏷️ 카테고리
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button key={cat.id} type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '20px',
                      border: isSelected ? `2px solid ${cat.color}` : '2px solid #e8e8e8',
                      background: isSelected ? cat.bg : 'white',
                      color: isSelected ? cat.color : '#888',
                      fontSize: '13px', fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="제목"
            style={{
              width: '100%', padding: '14px 16px', marginBottom: '14px',
              border: '2px solid #e0e0e0', borderRadius: '12px',
              fontSize: '15px', outline: 'none', boxSizing: 'border-box',
              transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#667eea'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="내용" rows={10}
            style={{
              width: '100%', padding: '14px 16px',
              border: '2px solid #e0e0e0', borderRadius: '12px',
              fontSize: '15px', resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', lineHeight: '1.7', transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#667eea'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '12px 32px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
            }}>{saving ? '저장 중...' : '💾 저장하기'}</button>
            <Link href={`/post/${id}`} style={{
              padding: '12px 24px', borderRadius: '12px',
              background: '#f0f0f0', color: '#666',
              textDecoration: 'none', fontSize: '15px',
              display: 'flex', alignItems: 'center'
            }}>취소</Link>
          </div>
        </div>
      </div>
    </div>
  );
}