"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const familyMembers = [
  { id: "dad", name: "아빠", emoji: "👨" },
  { id: "mom", name: "엄마", emoji: "👩" },
  { id: "son", name: "아들", emoji: "👦" },
  { id: "daughter", name: "딸", emoji: "👧" },
];

const photos = ["/family1.jpg", "/family2.jpg", "/family3.jpg", "/family4.jpg"];

export default function LoginPage() {
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const router = useRouter();

  // 사진 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    if (!selected) {
      setError("가족 구성원을 선택해주세요");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요");
      return;
    }

    try {
      const docRef = doc(db, "config", "app");
      const docSnap = await getDoc(docRef);

      console.log("문서 존재 여부:", docSnap.exists());
      console.log("문서 데이터:", docSnap.data());
      console.log("입력한 비밀번호:", password);

      if (docSnap.exists()) {
        const correctPassword = docSnap.data().password;
        console.log("정답 비밀번호:", correctPassword);
        console.log("일치 여부:", password === correctPassword);

        if (password === correctPassword) {
          localStorage.setItem("user", selected);
          router.push("/");
        } else {
          setError("비밀번호가 올바르지 않습니다");
        }
      }
    } catch (err) {
      console.error("로그인 에러:", err);
      setError("로그인 중 오류가 발생했습니다");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* 가족사진 슬라이드 */}
        <div
          style={{
            width: "100%",
            height: "250px",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "24px",
            position: "relative",
          }}
        >
          {photos.map((photo, index) => (
            <img
              key={photo}
              src={photo}
              alt={`가족사진 ${index + 1}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: currentPhoto === index ? 1 : 0,
                transition: "opacity 1s ease-in-out",
              }}
            />
          ))}
          {/* 사진 인디케이터 */}
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
            }}
          >
            {photos.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentPhoto(index)}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: currentPhoto === index ? "white" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏠</div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a2e" }}>
            우리 가족 블로그
          </h1>
          <p style={{ color: "#888", marginTop: "4px" }}>누구인지 알려주세요!</p>
        </div>

        {/* 가족 선택 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {familyMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                setSelected(member.id);
                setError("");
              }}
              style={{
                padding: "16px",
                borderRadius: "16px",
                border: "2px solid",
                borderColor: selected === member.id ? "#764ba2" : "#e0e0e0",
                background: selected === member.id
                  ? "linear-gradient(135deg, #667eea, #764ba2)"
                  : "white",
                color: selected === member.id ? "white" : "#333",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "32px" }}>{member.emoji}</span>
              <span style={{ fontWeight: "600" }}>{member.name}</span>
            </button>
          ))}
        </div>

        {/* 비밀번호 */}
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "2px solid #e0e0e0",
            fontSize: "16px",
            marginBottom: "16px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* 에러 메시지 */}
        {error && (
          <p style={{ color: "#e74c3c", textAlign: "center", marginBottom: "12px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          로그인
        </button>
      </div>
    </div>
  );
}