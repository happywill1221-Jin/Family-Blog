'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const EMOJIS = ['👨', '👩', '🧑', '👧', '👦', '👴', '👵', '🧒']
const COLORS = [
  { name: 'blue', hex: '#3b82f6' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'green', hex: '#22c55e' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'orange', hex: '#f97316' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'red', hex: '#ef4444' },
  { name: 'indigo', hex: '#6366f1' },
]

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('👨')
  const [selectedColor, setSelectedColor] = useState('blue')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/')
      else setCheckingAuth(false)
    })
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호를 확인해주세요.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim(), emoji: selectedEmoji, color: selectedColor } }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-800">우리 가족 이야기</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSignUp ? '새 가족 구성원 등록' : '로그인'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 아빠, 엄마, 민수..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">이모지 선택</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-orange-100 ring-2 ring-orange-400 scale-110'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">색상 선택</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-9 h-9 rounded-full transition-all ${
                        selectedColor === c.name ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="text-sm text-orange-500 hover:underline"
          >
            {isSignUp ? '이미 계정이 있나요? 로그인' : '처음이신가요? 가족 등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}