"use client"

import { SignIn } from '@clerk/nextjs'
import { useEffect } from 'react';

export default function Page() {
    console.log('Hello from sign-in page');

    useEffect(() => {
        console.log("sign-up page useEffect");
      }, []);
    
  return <SignIn />
}