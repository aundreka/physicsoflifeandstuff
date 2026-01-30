// app/page.tsx
import HomeLayout from "@/components/HomeLayout";

export const revalidate = 300;

export default function Home() {
  return <HomeLayout />;
}
