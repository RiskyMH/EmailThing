import { Button } from '@/app/components/ui/button'
import type { Metadata } from 'next'
import Link from 'next/link'

export default function Home() {
  return (
    <div className='p-2 space-y-2'>
      <h1 className='text-lg'>
        Emailthing
      </h1>
      <Button asChild>
        <Link href="/login">Login</Link>
      </Button>
    </div>
  )
}

export const metadata: Metadata = {
  alternates: {
    canonical: "https://emailthing.xyz/home",
  },
  title: {
    absolute: "Emailthing",
  }
}
