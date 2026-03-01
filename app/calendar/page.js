'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, deleteDoc, doc,
  query, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';

const EVENT_TYPES = [
  { label: '🎂 생일', value: 'birthday', color: '#ff6b6b' },
  { label: '💕 기념일', value: 'anniversary', color: '#e84393' },
  { label: '📅 일정', value: 'schedule', color: '#667eea' },
  { label: '🏥 병원', value: 'hospital', color: '#00b894' },
  { label: '✈️ 여행', value: 'travel', color: '#fdcb6e' },
  { label: '🎉 행사', value: 'event', color: '#a29bfe' },
];

export default function CalendarPage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'schedule', memo: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) days.push(d);
    return days;
  };

  const dateKey = (d) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const getEventsForDate = (d) => {
    if (!d) return [];
    const key = dateKey(d);
    return events.filter(e => e.date === key);
  };

  const isToday = (d) => {
    if (!d) return false;
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (d) => {
    if (!d || !selectedDate) return false;
    return dateKey(d) === selectedDate;
  };

  const handleDateClick = (d) => {
    if (!d) return;
    setSelectedDate(dateKey(d));
  };

  const openAddModal = () => {
    if (!selectedDate) return;
    setNewEvent({ title: '', type: 'schedule', memo: '' });
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!newEvent.title.trim()) { alert('일정 제목을 입력해주세요'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'events'), {
        title: newEvent.title.trim(),
        type: newEvent.type,
        memo: newEvent.memo.trim(),
        date: selectedDate,
        author: user.name,
        authorId: user.id,
        emoji: user.emoji,
        createdAt: serverTimestamp()
      });
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('이 일정을 삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error(error);
    }
  };

  const getTypeInfo = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[2];

  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];
  const days = getDaysInMonth();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>📅 가족 캘린더</h1>
        <Link href="/" style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '8px 16px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '14px'
        }}>← 홈으로</Link>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* 월 네비게이션 */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '20px', marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px'
          }}>
            <button onClick={prevMonth} style={{
              background: '#f0f0f0', border: 'none', borderRadius: '10px',
              padding: '10px 16px', fontSize: '16px', cursor: 'pointer'
            }}>◀</button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>
                {year}년 {month + 1}월
              </h2>
            </div>
            <button onClick={nextMonth} style={{
              background: '#f0f0f0', border: 'none', borderRadius: '10px',
              padding: '10px 16px', fontSize: '16px', cursor: 'pointer'
            }}>▶</button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <button onClick={goToday} style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '6px 16px', fontSize: '13px', cursor: 'pointer'
            }}>오늘</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px', marginBottom: '8px'
          }}>
            {weekdays.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '13px', fontWeight: '700',
                padding: '8px 0',
                color: i === 0 ? '#ff6b6b' : i === 6 ? '#667eea' : '#999'
              }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {days.map((d, idx) => {
              const dayEvents = getEventsForDate(d);
              const today = isToday(d);
              const selected = isSelected(d);
              const dayOfWeek = idx % 7;

              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(d)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px',
                    cursor: d ? 'pointer' : 'default',
                    background: selected ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : today ? '#f0e6ff' : 'transparent',
                    border: today && !selected ? '2px solid #764ba2' : '2px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {d && (
                    <>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: today || selected ? '700' : '500',
                        color: selected ? 'white'
                          : dayOfWeek === 0 ? '#ff6b6b'
                          : dayOfWeek === 6 ? '#667eea'
                          : '#333'
                      }}>{d}</span>
                      {dayEvents.length > 0 && (
                        <div style={{
                          display: 'flex', gap: '2px', marginTop: '2px',
                          flexWrap: 'wrap', justifyContent: 'center'
                        }}>
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <div key={i} style={{
                              width: '6px', height: '6px',
                              borderRadius: '50%',
                              background: selected ? 'white' : getTypeInfo(ev.type).color
                            }} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜 일정 */}
        {selectedDate && (
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                📌 {selectedDate.replace(/-/g, '.')} 일정
              </h3>
              <button onClick={openAddModal} style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer'
              }}>+ 일정 추가</button>
            </div>

            {selectedEvents.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '30px',
                color: '#bbb', fontSize: '14px'
              }}>
                등록된 일정이 없습니다
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedEvents.map((ev) => {
                  const typeInfo = getTypeInfo(ev.type);
                  return (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: '#f8f9fa', borderRadius: '12px',
                      padding: '14px 16px',
                      borderLeft: '4px solid ' + typeInfo.color
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '15px', fontWeight: '600', color: '#333',
                          marginBottom: '4px'
                        }}>
                          {typeInfo.label.split(' ')[0]} {ev.title}
                        </div>
                        {ev.memo && (
                          <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
                            {ev.memo}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#bbb' }}>
                          {ev.emoji} {ev.author}
                        </div>
                      </div>
                      {user && user.id === ev.authorId && (
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          style={{
                            background: 'none', border: 'none',
                            fontSize: '16px', cursor: 'pointer', color: '#ccc'
                          }}
                        >🗑️</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 다가오는 일정 */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '20px', marginTop: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#333' }}>
            🔔 다가오는 일정
          </h3>
          {(() => {
            const today = new Date();
            const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            const upcoming = events
              .filter(e => e.date >= todayKey)
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5);

            if (upcoming.length === 0) {
              return (
                <div style={{
                  textAlign: 'center', padding: '20px',
                  color: '#bbb', fontSize: '14px'
                }}>
                  예정된 일정이 없습니다
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcoming.map((ev) => {
                  const typeInfo = getTypeInfo(ev.type);
                  return (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', background: '#f8f9fa',
                      borderRadius: '10px'
                    }}>
                      <span style={{
                        fontSize: '12px', color: 'white', fontWeight: '600',
                        background: typeInfo.color, padding: '4px 10px',
                        borderRadius: '6px', whiteSpace: 'nowrap'
                      }}>
                        {ev.date.slice(5).replace('-', '/')}
                      </span>
                      <span style={{ fontSize: '14px', color: '#444' }}>
                        {typeInfo.label.split(' ')[0]} {ev.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#bbb', marginLeft: 'auto' }}>
                        {ev.emoji}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 일정 추가 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '28px', width: '100%', maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>
              ➕ 일정 추가
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#999' }}>
              {selectedDate.replace(/-/g, '.')}
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
                분류
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setNewEvent({ ...newEvent, type: t.value })}
                    style={{
                      padding: '6px 12px', borderRadius: '8px',
                      border: newEvent.type === t.value ? '2px solid ' + t.color : '2px solid #e0e0e0',
                      background: newEvent.type === t.value ? t.color + '20' : 'white',
                      fontSize: '13px', cursor: 'pointer',
                      color: '#444'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
                제목
              </label>
              <input
                type="text"
                placeholder="예: 엄마 생일, 가족 여행"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: '2px solid #e0e0e0', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
                메모 (선택)
              </label>
              <input
                type="text"
                placeholder="추가 메모"
                value={newEvent.memo}
                onChange={(e) => setNewEvent({ ...newEvent, memo: e.target.value })}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: '2px solid #e0e0e0', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '2px solid #e0e0e0', background: 'white',
                  fontSize: '14px', cursor: 'pointer', color: '#666'
                }}
              >취소</button>
              <button
                onClick={handleSaveEvent}
                disabled={saving}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: 'none',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', fontSize: '14px', fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}