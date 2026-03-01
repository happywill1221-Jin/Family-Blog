'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PostDetailPage() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
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
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <p style={{ fontSize: '48px' }}>😢</p>
        <p>글을 찾을 수 없습니다</p>
        <Link href="/" style={{ marginTop: '12px', color: '#667eea' }}>← 홈으로</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏠 우리 가족 블로그</h1>
        <Link href="/" style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px'
        }}>
          ← 목록으로
        </Link>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h1 style={{ margin: '0 0 12px', fontSize: '24px', color: '#333' }}>
            {post.title}
          </h1>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
            {post.emoji} {post.author} · {formatDate(post.createdAt)}
          </div>
          <div style={{
            fontSize: '16px', lineHeight: '1.8', color: '#444',
            whiteSpace: 'pre-wrap'
          }}>
            {post.content}
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Link href={'/edit/' + post.id} style={{
              padding: '8px 16px', background: '#667eea', color: 'white',
              borderRadius: '8px', textDecoration: 'none', fontSize: '14px'
            }}>
              ✏️ 수정
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}