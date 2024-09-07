'use client'

import * as React from 'react'
import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Page() {
  const [ticket, setTicket] = useState<String | null>(null)

  useEffect(() => {
    // This code runs only on the client
    const param = '__clerk_ticket'
    const ticketValue = new URL(window.location.href).searchParams.get(param)
    setTicket(ticketValue)
  }, [])

  // If there is no invitation token, restrict access to the sign-up page
  if (ticket === null) {
    return (
      <>
        <p className="text-xl mb-4">Bu uygulamaya kaydolmak için bir davetiyeye ihtiyacınız var.</p>
        <Link href="/sign-in" className="text-blue-600 hover:text-blue-800 underline">
          Giriş sayfasına dön
        </Link>
      </>
    )
  }

  // Display the initial sign-up form to capture optional sign-up info
  return <SignUp />
}
