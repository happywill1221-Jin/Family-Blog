'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
    fetchPosts();
  }, [router]);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const postList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(postList);
    } catch (error) {
      console.error('글 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>🏠 우리 가족 블로그</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
            {user.emoji} {user.name}님 환영합니다!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/write" style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            ✏️ 새 글쓰기
          </Link>
          <Link href="/change-password" style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            🔒 비밀번호 변경
          </Link>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            🚪 로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2 style={{ marginBottom: '16px' }}>📝 전체 글 ({posts.length}개)</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>불러오는 중...</p>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'white', borderRadius: '16px', color: '#888'
          }}>
            <p style={{ fontSize: '48px' }}>📭</p>
            <p>아직 작성된 글이 없어요</p>
            <Link href="/write" style={{
              display: 'inline-block', marginTop: '12px', padding: '10px 20px',
              background: '#764ba2', color: 'white', borderRadius: '8px', textDecoration: 'none'
            }}>
              첫 글 작성하기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map(post => (
              <div key={post.id} style={{
                background: 'white', borderRadius: '12px',
                padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{post.title}</h3>
                <p style={{
                  margin: '0 0 12px', color: '#666', fontSize: '14px',
                  lineHeight: '1.6', whiteSpace: 'pre-wrap',
                  maxHeight: '100px', overflow: 'hidden'
                }}>
                  {post.content}
                </p>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                  {post.emoji} {post.author} · {formatDate(post.createdAt)}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href={'/edit/' + post.id} style={{
                    padding: '6px 14px', background: '#667eea', color: 'white',
                    borderRadius: '6px', textDecoration: 'none', fontSize: '13px'
                  }}>
                    ✏️ 수정
                  </Link>
                  <button onClick={() => handleDelete(post.id)} style={{
                    padding: '6px 14px', background: '#e74c3c', color: 'white',
                    borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px'
                  }}>
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}