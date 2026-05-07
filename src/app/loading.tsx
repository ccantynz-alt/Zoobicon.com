export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafaf7",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "#0a0a0b",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
