'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('user');  // ← 수정!
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(saved));
    fetchPostCount();
  }, [router]);

  const fetchPostCount = async () => {
    try {
      const coll = collection(db, 'posts');
      const snapshot = await getCountFromServer(coll);
      setPostCount(snapshot.data().count);
    } catch (error) {
      console.error('글 수 조회 실패:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');  // ← 수정!
    router.push('/login');
  };

  if (!user) return null;

  // ... 나머지 JSX는 그대로