/**
 * localStorage나 Firestore에서 가져온 유저 객체에서
 * 이름·이모지를 안전하게 꺼내는 헬퍼.
 * name / nickname / displayName 등 어떤 필드명이든 대응합니다.
 */

export function getUserName(user) {
  if (!user) return '익명';
  return user.name || user.nickname || user.displayName || user.userName || '익명';
}

export function getUserEmoji(user) {
  if (!user) return '👤';
  return user.emoji || user.icon || user.avatar || '👤';
}

export function getUserId(user) {
  if (!user) return '';
  return user.id || user.uid || user.oderId || '';
}

/**
 * 게시글/댓글에서 작성자 이름을 안전하게 꺼냄
 */
export function getAuthorName(doc) {
  if (!doc) return '익명';
  return doc.author || doc.authorName || doc.nickname || doc.displayName || doc.userName || '익명';
}

export function getAuthorEmoji(doc) {
  if (!doc) return '👤';
  return doc.emoji || doc.authorEmoji || doc.icon || '👤';
}

export function getAuthorId(doc) {
  if (!doc) return '';
  return doc.authorId || doc.uid || doc.userId || '';
}