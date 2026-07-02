import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-black text-primary">Welcome to CRM Panel</h1>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">Sign In</Link>
          <Link href="/auth/signup" className="px-6 py-3 bg-accent text-white rounded-xl font-bold">Sign Up</Link>
        </div>
      </div>
    </main>
  );
}
