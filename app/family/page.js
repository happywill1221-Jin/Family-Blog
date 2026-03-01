'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const familyMembers = [
  { id: 'dad', name: '아빠', emoji: '👨' },
  { id: 'mom', name: '엄마', emoji: '👩' },
  { id: 'son', name: '아들', emoji: '👦' },
  { id: 'daughter', name: '딸', emoji: '👧' },
];

export default function FamilyPage() {
  const [user, setUser] = useState(null);
  const [postCounts, setPostCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
    fetchPostCounts();
  }, []);

  const fetchPostCounts = async () => {
    try {
      const counts = {};
      for (const member of familyMembers) {
        const q = query(collection(db, 'posts'), where('authorId', '==', member.id));
        const snapshot = await getDocs(q);
        counts[member.id] = snapshot.size;
      }
      setPostCounts(counts);
    } catch (error) {
      console.error('멤버 글 수 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>👨‍👩‍👧‍👦 우리 가족</h1>
        <Link href="/" style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '8px 16px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '14px'
        }}>← 홈으로</Link>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '24px', fontSize: '14px' }}>
          가족 멤버를 클릭하면 작성한 글을 모아볼 수 있어요!
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px'
        }}>
          {familyMembers.map((member) => {
            const isMe = user.id === member.id;
            return (
              <Link key={member.id} href={`/profile/${member.id}`}
                style={{ textDecoration: 'none' }}>
                <div style={{
                  background: isMe
                    ? 'linear-gradient(135deg, #f0f0ff 0%, #fce4ff 100%)'
                    : 'white',
                  borderRadius: '20px', padding: '28px 20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  border: isMe ? '2px solid #667eea' : '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                }}>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>
                    {member.emoji}
                  </div>
                  <div style={{
                    fontSize: '18px', fontWeight: '700', color: '#333',
                    marginBottom: '8px'
                  }}>
                    {member.name}
                  </div>
                  {isMe && (
                    <div style={{
                      fontSize: '11px', color: '#667eea', fontWeight: '600',
                      marginBottom: '8px'
                    }}>✨ 나</div>
                  )}
                  <div style={{
                    fontSize: '13px', color: '#888',
                    background: 'rgba(102,126,234,0.1)',
                    borderRadius: '20px', padding: '6px 14px',
                    display: 'inline-block'
                  }}>
                    📝 {loading ? '..' : (postCounts[member.id] || 0)}개의 글
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}