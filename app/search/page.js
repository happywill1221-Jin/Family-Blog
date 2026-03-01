'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [allPosts, setAllPosts] = useState([]);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllPosts(posts);
    } catch (error) {
      console.error('글 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!keyword.trim()) return;
    const k = keyword.trim().toLowerCase();
    const filtered = allPosts.filter(post =>
      (post.title && post.title.toLowerCase().includes(k)) ||
      (post.content && post.content.toLowerCase().includes(k)) ||
      (post.author && post.author.toLowerCase().includes(k))
    );
    setResults(filtered);
    setSearched(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const highlightText = (text, keyword) => {
    if (!text || !keyword.trim()) return text;
    const parts = text.split(new RegExp(`(${keyword.trim()})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.trim().toLowerCase()
        ? <mark key={i} style={{
            background: '#fff3a0', padding: '0 2px',
            borderRadius: '3px'
          }}>{part}</mark>
        : part
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>
          🔍 글 검색
        </h1>
        <Link href="/" style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '8px 16px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '14px'
        }}>
          ← 홈으로
        </Link>
      </div>

      <div style={{
        maxWidth: '800px', margin: '0 auto', padding: '20px'
      }}>
        {/* 검색바 */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex', gap: '10px'
          }}>
            <input
              type="text"
              placeholder="제목, 내용, 작성자로 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, padding: '14px 18px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                fontSize: '16px', outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none',
                borderRadius: '12px', fontSize: '16px',
                fontWeight: '600', cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              검색
            </button>
          </div>
        </div>

        {/* 검색 결과 */}
        {loading ? (
          <p style={{
            textAlign: 'center', color: '#888', padding: '40px'
          }}>
            불러오는 중...
          </p>
        ) : !searched ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'white', borderRadius: '16px',
            color: '#888'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🔍</p>
            <p style={{ margin: 0 }}>
              제목, 내용, 작성자 이름으로 검색해보세요
            </p>
            <p style={{
              margin: '8px 0 0', fontSize: '14px', color: '#aaa'
            }}>
              전체 글 {allPosts.length}개
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'white', borderRadius: '16px',
            color: '#888'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>😔</p>
            <p style={{ margin: 0 }}>
              "{keyword}" 검색 결과가 없습니다
            </p>
          </div>
        ) : (
          <>
            <p style={{
              marginBottom: '12px', color: '#666', fontSize: '14px'
            }}>
              "{keyword}" 검색 결과 <strong>{results.length}개</strong>
            </p>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              {results.map(post => (
                <Link
                  key={post.id}
                  href={'/post/' + post.id}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    background: 'white', borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}>
                    <h3 style={{
                      margin: '0 0 8px', fontSize: '18px',
                      color: '#333'
                    }}>
                      {highlightText(post.title, keyword)}
                    </h3>
                    <p style={{
                      margin: '0 0 12px', color: '#666',
                      fontSize: '14px', lineHeight: '1.6',
                      maxHeight: '60px', overflow: 'hidden'
                    }}>
                      {highlightText(
                        post.content?.substring(0, 150),
                        keyword
                      )}
                    </p>
                    <div style={{
                      fontSize: '12px', color: '#999'
                    }}>
                      {post.emoji} {post.author} · {formatDate(post.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}