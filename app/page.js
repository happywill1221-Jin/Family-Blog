'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const postList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postList);
    } catch (error) {
      console.error('글 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 헤더 */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🏠</span>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              우리 가족 블로그
            </h1>
            <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>
              {user.emoji} {user.name} 로그인 중
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/search')}
            style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🔍 검색
          </button>
          <button
            onClick={() => router.push('/change-password')}
            style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🔒 비밀번호
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>

        {/* 환영 카드 */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>{user.emoji}</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>
            {user.name}, 안녕하세요! 👋
          </h2>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            오늘도 좋은 하루 보내세요!
          </p>
        </div>

        {/* 새 글 쓰기 버튼 */}
        <button
          onClick={() => router.push('/write')}
          style={{
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: '24px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ✍️ 새 글 쓰기
        </button>

        {/* 글 목록 */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
            📝 최근 글 ({posts.length}개)
          </h3>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#888',
          }}>
            로딩 중...
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#888', fontSize: '15px' }}>
              아직 글이 없습니다. 첫 번째 글을 작성해보세요!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => router.push('/post/' + post.id)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1a1a2e',
                    margin: 0,
                    flex: 1,
                  }}>
                    {post.title || '제목 없음'}
                  </h4>
                  <span style={{ fontSize: '20px', marginLeft: '8px' }}>
                    {post.emoji || '👤'}
                  </span>
                </div>
                <p style={{
                  color: '#888',
                  fontSize: '14px',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {post.content
                    ? post.content.substring(0, 80) + '...'
                    : '내용 없음'}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#aaa',
                }}>
                  <span>{post.author || '익명'}</span>
                  <span>
                    {post.createdAt?.toDate
                      ? post.createdAt.toDate().toLocaleDateString('ko-KR')
                      : '날짜 없음'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}