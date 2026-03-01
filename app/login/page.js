// ❌ 이전 (깨진 구조)
console.log("일치 여부:", password === correctPassword);
else 
    if (password === correctPassword) {

// ✅ 수정 후 (정상 구조)
if (password === correctPassword) {
  const member = familyMembers.find((m) => m.id === selected);
  localStorage.setItem("user", JSON.stringify(member));
  router.push("/");
} else {
  setError("비밀번호가 올바르지 않습니다");
}