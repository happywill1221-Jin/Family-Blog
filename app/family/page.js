'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function FamilyPage() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { window.location.href = '/login'; return; }
    setUser(JSON.parse(saved));
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = [];
      for (const d of snap.docs) {
        const data = d.data();
        const postsSnap = await getDocs(
          query(collection(db, 'posts'), where('authorId', '==', d.id))
        );
        list.push({ id: d.id, ...data, postCount: postsSnap.size });
      }
      setMembers(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const colors = [
    { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
    { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
    { bg: '#fce4ec', color: '#c62828', border: '#ef9a9a' },
    { bg: '#f3e5f5', color: '#6a1b9a', border: '#ce93d8' },
    { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍👩‍👧‍👦</p>
        <p style={{ color: '#999' }}>가족 정보를 불러오는 중...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white', textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <a href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>← 홈</a>
            <a href="/calendar" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '13px' }}>📅 캘린더</a>
          </div>
          <p style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍👩‍👧‍👦</p>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>우리 가족 소개</h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.85 }}>소중한 우리 가족 구성원들이에요</p>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        {/* 가족 통계 */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '20px', textAlign: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#667eea', margin: '0' }}>{members.length}</p>
              <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0' }}>가족 구성원</p>
            </div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#764ba2', margin: '0' }}>
                {members.reduce((sum, m) => sum + (m.postCount || 0), 0)}
              </p>
              <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0' }}>전체 게시글</p>
            </div>
          </div>
        </div>

        {/* 가족 구성원 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {members.map((member, idx) => {
            const c = colors[idx % colors.length];
            return (
              <a key={member.id} href={'/profile/' + member.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: '20px', padding: '24px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  border: '2px solid ' + c.border, cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', background: c.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px', flexShrink: 0
                  }}>{member.emoji || '👤'}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>
                      {member.name}
                    </h3>
                    {member.role && (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
                        background: c.bg, color: c.color, fontSize: '12px', fontWeight: '600'
                      }}>{member.role}</span>
                    )}
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#999' }}>
                      게시글 {member.postCount || 0}개 작성
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', color: '#ccc' }}>›</span>
                </div>
              </a>
            );
          })}
        </div>

        {members.length === 0 && (
          <div style={{
            background: 'white', borderRadius: '20px', padding: '40px',
            textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
          }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏠</p>
            <p style={{ color: '#999' }}>아직 등록된 가족이 없어요</p>
            <p style={{ color: '#ccc', fontSize: '13px' }}>가족들이 회원가입하면 여기에 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}