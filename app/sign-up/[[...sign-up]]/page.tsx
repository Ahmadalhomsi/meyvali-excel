'use client'

import * as React from 'react'
import { SignUp, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Page() {
  // Get the token from the query parameter
  const param = '__clerk_ticket'
  const ticket = new URL(window.location.href).searchParams.get(param)

  // If there is no invitation token, restrict access to the sign-up page
  if (!ticket) {
    return <p>Bu uygulamaya kaydolmak için bir davetiyeye ihtiyacınız var.</p>
  }

  // Display the initial sign-up form to capture optional sign-up info
  return <SignUp />
}