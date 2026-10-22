import "../src/styles.css";

export const metadata = {
  title: "Focus — a calmer to-do list",
  description:
    "Focus is a calm, simple task list for keeping track of what matters.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport = {
  themeColor: "#f4f1e9",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
