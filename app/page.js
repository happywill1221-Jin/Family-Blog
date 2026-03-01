'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function HomePage() {
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
  }, [router]);

useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(list);
        setLoading(false);
      },
      (error) => {
        console.error('글 불러오기 에러:', error);
        // orderBy 실패 시 정렬 없이 다시 시도
        const q2 = query(collection(db, 'posts'));
        onSnapshot(q2, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => {
            const ta = a.createdAt?.seconds || 0;
            const tb = b.createdAt?.seconds || 0;
            return tb - ta;
          });
          setPosts(list);
          setLoading(false);
        });
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 20px', color: 'white'
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '22px' }}>🏠 우리 가족 블로그</h1>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {user.emoji} {user.name} 로그인 중
            </p>
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontSize: '13px'
          }}>로그아웃</button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* 버튼 영역 */}
        <div style={{
          display: 'flex', gap: '12px', marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <Link href="/write" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(102,126,234,0.4)'
          }}>
            ✏️ 새 글 쓰기
          </Link>

          <Link href="/calendar" style={{
            display: 'inline-block',
            background: 'white',
            color: '#667eea',
            padding: '12px 24px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            📅 가족 캘린더
          </Link>
        </div>

        {/* 글 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            불러오는 중...
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: 'white', borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📝</p>
            <p style={{ color: '#999', margin: 0 }}>
              아직 글이 없습니다. 첫 번째 글을 작성해보세요!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => (
              <Link
                key={post.id}
                href={'/post/' + post.id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <h2 style={{
                    margin: '0 0 8px', fontSize: '18px',
                    fontWeight: '700', color: '#333'
                  }}>
                    {post.title}
                  </h2>
                  <p style={{
                    margin: '0 0 12px', fontSize: '14px',
                    color: '#777', lineHeight: '1.6',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {post.content}
                  </p>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: '13px', color: '#aaa'
                  }}>
                    <span>{post.emoji} {post.author}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}