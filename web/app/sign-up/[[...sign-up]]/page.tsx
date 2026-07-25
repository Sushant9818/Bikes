import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-[#E60012] hover:bg-[#C5000F] text-sm normal-case',
            card: 'shadow-lg border border-zinc-200 rounded-2xl',
          },
        }}
      />
    </div>
  )
}
