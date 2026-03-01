export const CATEGORIES = [
  { id: 'daily',    label: '일상',  emoji: '📅', color: '#667eea', bg: '#eef0ff' },
  { id: 'travel',   label: '여행',  emoji: '✈️', color: '#e67e22', bg: '#fff5eb' },
  { id: 'cooking',  label: '요리',  emoji: '🍳', color: '#e74c3c', bg: '#fff0f0' },
  { id: 'parenting',label: '육아',  emoji: '👶', color: '#f39c12', bg: '#fff9e6' },
  { id: 'hobby',    label: '취미',  emoji: '🎨', color: '#9b59b6', bg: '#f8f0ff' },
  { id: 'health',   label: '건강',  emoji: '💪', color: '#27ae60', bg: '#eafff3' },
  { id: 'school',   label: '학교',  emoji: '🏫', color: '#3498db', bg: '#edf6ff' },
  { id: 'memory',   label: '추억',  emoji: '📸', color: '#e84393', bg: '#fff0f8' },
  { id: 'etc',      label: '기타',  emoji: '💬', color: '#95a5a6', bg: '#f5f5f5' },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}