import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 색상 → HEX 변환 (Tailwind 동적 클래스 문제 방지용)
export const COLOR_HEX = {
  blue: '#3b82f6',
  pink: '#ec4899',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  teal: '#14b8a6',
  red: '#ef4444',
  indigo: '#6366f1',
}

// 날짜 포맷
export function formatDate(dateStr) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일`
}