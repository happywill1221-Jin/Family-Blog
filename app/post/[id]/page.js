'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PostDetailPage() {
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const docRef = doc(db, 'posts', params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error('글 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '40px',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <p style={{ fontSize: '36px', margin: '0 0 12px' }}>📖</p>
          <p style={{ color: '#888', margin: 0 }}>글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '40px',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>😢</p>
          <p style={{ color: '#666', margin: '0 0 20px' }}>글을 찾을 수 없습니다</p>
          <Link href="/" style={{
            display: 'inline-block', padding: '10px 24px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', borderRadius: '10px', textDecoration: 'none'
          }}>
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 상단 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏠 우리 가족 블로그</h1>
        <Link href="/" style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '8px 16px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '14px'
        }}>
          ← 목록으로
        </Link>
      </div>

      {/* 글 내용 */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          {/* 제목 */}
          <h1 style={{
            margin: '0 0 16px', fontSize: '26px', color: '#222',
            lineHeight: '1.4', fontWeight: '700'
          }}>
            {post.title}
          </h1>

          {/* 작성자 정보 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            paddingBottom: '20px', marginBottom: '24px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: '22px'
            }}>
              {post.emoji || '👤'}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#333', fontSize: '15px' }}>
                {post.author}
              </p>
              <p style={{ margin: 0, color: '#999', fontSize: '13px' }}>
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* 본문 */}
          <div style={{
            fontSize: '16px', lineHeight: '2', color: '#444',
            whiteSpace: 'pre-wrap', minHeight: '200px',
            wordBreak: 'keep-all'
          }}>
            {post.content}
          </div>

          {/* 하단 버튼 */}
          {user && user.name === post.author && (
            <div style={{
              marginTop: '36px', paddingTop: '20px',
              borderTop: '2px solid #f0f0f0',
              display: 'flex', gap: '10px', justifyContent: 'flex-end'
            }}>
              <Link href={'/edit/' + post.id} style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', borderRadius: '10px',
                textDecoration: 'none', fontSize: '14px', fontWeight: '600'
              }}>
                ✏️ 수정하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}