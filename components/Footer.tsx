//components/Footer.tsx
export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "1rem 2rem",
        borderTop: "1px solid #e5e5e5",
        fontSize: "0.9rem",
        color: "#666",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        © {new Date().getFullYear()} Physics of Life and Stuff 
      </div>
    </footer>
  );
}
