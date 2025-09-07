import { Toaster } from "@/components/ui/sonner"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      {children}
      <Toaster richColors theme="light" />
    </main>
  )
}
