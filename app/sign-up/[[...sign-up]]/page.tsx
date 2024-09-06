'use client'

import * as React from 'react'
import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function Page() {
  // Get the token from the query parameter
  const param = '__clerk_ticket'
  const ticket = typeof window !== 'undefined' 
    ? new URL(window.location.href).searchParams.get(param)
    : null

  // If there is no invitation token, restrict access to the sign-up page
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl mb-4">Bu uygulamaya kaydolmak için bir davetiyeye ihtiyacınız var.</p>
        <Link href="/sign-in" className="text-blue-600 hover:text-blue-800 underline">
          Giriş sayfasına dön
        </Link>
      </div>
    )
  }

  // Display the initial sign-up form to capture optional sign-up info
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <SignUp />
      <div className="mt-4">
        <Link href="/sign-in" className="text-blue-600 hover:text-blue-800 underline">
          Zaten bir hesabınız var mı? Giriş yapın
        </Link>
      </div>
    </div>
  )
}