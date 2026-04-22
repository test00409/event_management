import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Blurred Shapes for Premium Feel */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[100px] opacity-70 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] bg-blue-300/10 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full py-12">
        <AuthCard />
      </main>
    </div>
  );
}
