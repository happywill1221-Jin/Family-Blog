'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function CalendarPage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', emoji: '🎉' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const eventEmojis = ['🎉', '🎂', '🏥', '✈️', '📚', '🎵', '⚽', '🍽️', '💼', '❤️', '🎄', '🎃'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) { window.location.href = '/login'; return; }
    setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, year, month]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'events'));
      const startStr = year + '-' + String(month + 1).padStart(2, '0') + '-01';
      const endStr = year + '-' + String(month + 1).padStart(2, '0') + '-31';
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.date >= startStr && e.date <= endStr);
      setEvents(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        emoji: newEvent.emoji,
        date: selectedDate,
        authorId: user.id,
        author: user.name,
        authorEmoji: user.emoji,
        createdAt: serverTimestamp()
      });
      setNewEvent({ title: '', description: '', emoji: '🎉' });
      setShowAddForm(false);
      fetchEvents();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDeleteEvent = async (eventId) => {
    try { await deleteDoc(doc(db, 'events', eventId)); fetchEvents(); }
    catch (e) { console.error(e); }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getEventsForDay = (day) => {
    const ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    return events.filter(e => e.date === ds);
  };

  const formatSelectedDate = (ds) => {
    if (!ds) return '';
    const p = ds.split('-');
    return p[0] + '년 ' + parseInt(p[1]) + '월 ' + parseInt(p[2]) + '일';
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const selectedDateEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', color: 'white'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <a href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>← 홈</a>
            <a href="/family" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '13px' }}>👨‍👩‍👧‍👦 가족소개</a>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '36px', marginBottom: '4px' }}>📅</p>
            <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>가족 캘린더</h1>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>우리 가족의 소중한 일정을 함께 관리해요</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        {/* 월 네비게이션 */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={prevMonth} style={{
              width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              background: '#f0f2f5', fontSize: '18px', cursor: 'pointer'
            }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1a1a2e' }}>
                {year}년 {monthNames[month]}
              </h2>
              <button onClick={goToday} style={{
                background: 'none', border: 'none', color: '#667eea',
                fontSize: '12px', cursor: 'pointer', marginTop: '4px', fontWeight: '600'
              }}>오늘로 이동</button>
            </div>
            <button onClick={nextMonth} style={{
              width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              background: '#f0f2f5', fontSize: '18px', cursor: 'pointer'
            }}>›</button>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '16px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
            {dayNames.map((name, i) => (
              <div key={name} style={{
                textAlign: 'center', fontSize: '12px', fontWeight: '700', padding: '8px 0',
                color: i === 0 ? '#e74c3c' : i === 6 ? '#3498db' : '#999'
              }}>{name}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={'empty-' + idx} />;
              const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate === dateStr;
              const dayOfWeek = (firstDay + day - 1) % 7;

              return (
                <div key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    padding: '8px 4px', textAlign: 'center', borderRadius: '12px',
                    cursor: 'pointer', minHeight: '48px',
                    background: isSelected ? 'linear-gradient(135deg, #667eea, #764ba2)' : isToday(day) ? '#f0f2ff' : 'transparent',
                    border: isToday(day) && !isSelected ? '2px solid #667eea' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                  <span style={{
                    fontSize: '14px', fontWeight: isToday(day) ? '800' : '500',
                    color: isSelected ? 'white' : dayOfWeek === 0 ? '#e74c3c' : dayOfWeek === 6 ? '#3498db' : '#333'
                  }}>{day}</span>
                  {dayEvents.length > 0 && (
                    <div style={{ marginTop: '2px', fontSize: '10px' }}>
                      {dayEvents.slice(0, 2).map((e, i) => <span key={i}>{e.emoji}</span>)}
                      {dayEvents.length > 2 && <span style={{ color: '#999', fontSize: '9px' }}>+{dayEvents.length - 2}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜 일정 */}
        {selectedDate && (
          <div style={{
            background: 'white', borderRadius: '20px', padding: '24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                📌 {formatSelectedDate(selectedDate)}
              </h3>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{
                padding: '8px 16px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}>{showAddForm ? '취소' : '+ 일정 추가'}</button>
            </div>

            {showAddForm && (
              <div style={{ padding: '20px', background: '#f8f9ff', borderRadius: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>이모지 선택</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {eventEmojis.map(emoji => (
                      <button key={emoji} onClick={() => setNewEvent({ ...newEvent, emoji })} style={{
                        width: '40px', height: '40px', borderRadius: '10px', border: 'none',
                        background: newEvent.emoji === emoji ? '#667eea' : '#fff',
                        fontSize: '20px', cursor: 'pointer',
                        boxShadow: newEvent.emoji === emoji ? '0 2px 8px rgba(102,126,234,0.4)' : '0 1px 3px rgba(0,0,0,0.1)'
                      }}>{emoji}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>일정 제목</label>
                  <input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="예: 할머니 생신 🎂"
                    style={{
                      width: '100%', padding: '12px', border: '2px solid #e8e8e8', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#667eea'}
                    onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>메모 (선택)</label>
                  <input value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="간단한 메모..."
                    style={{
                      width: '100%', padding: '12px', border: '2px solid #e8e8e8', borderRadius: '12px',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#667eea'}
                    onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                  />
                </div>
                <button onClick={handleAddEvent} disabled={submitting || !newEvent.title.trim()} style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                  background: newEvent.title.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e8e8e8',
                  color: newEvent.title.trim() ? 'white' : '#bbb',
                  fontSize: '14px', fontWeight: '600', cursor: newEvent.title.trim() ? 'pointer' : 'default'
                }}>{submitting ? '등록 중...' : '일정 등록'}</button>
              </div>
            )}

            {selectedDateEvents.length === 0 && !showAddForm ? (
              <p style={{ textAlign: 'center', color: '#ccc', fontSize: '14px', padding: '20px 0' }}>
                이 날의 일정이 없습니다
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedDateEvents.map(event => (
                  <div key={event.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px', background: '#fafafa', borderRadius: '14px'
                  }}>
                    <span style={{ fontSize: '28px' }}>{event.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#333' }}>{event.title}</p>
                      {event.description && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#999' }}>{event.description}</p>}
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ccc' }}>{event.authorEmoji} {event.author}</p>
                    </div>
                    {user && user.id === event.authorId && (
                      <button onClick={() => handleDeleteEvent(event.id)} style={{
                        background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '18px'
                      }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 이번 달 전체 일정 */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>
            🗓️ 이번 달 일정 ({events.length})
          </h3>
          {events.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#ccc', fontSize: '14px', padding: '12px 0' }}>
              이번 달 등록된 일정이 없습니다
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
                <div key={event.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', background: '#fafafa', borderRadius: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>{event.emoji}</span>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#333' }}>{event.title}</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>{parseInt(event.date.split('-')[2])}일</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}