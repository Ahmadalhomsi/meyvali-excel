import { serverBaseUrl } from '@/components/serverConfig';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    // Check if email is provided
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Clerk Secret Key (ensure it's in your environment variables)
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    
    // Call Clerk's API to create an invitation
    const response = await fetch('https://api.clerk.com/v1/invitations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        redirect_url: `${serverBaseUrl}/sign-up`, // Redirect URL after accepting invite
      }),
    });

    // If the response is not ok, handle the error
    if (!response.ok) {
      const errorResponse = await response.json();
      console.log('Failed to create invitation:', errorResponse);
      return NextResponse.json({ error: errorResponse }, { status: 500 });
    }

    // Parse the response data
    const data = await response.json();

    // Return the invite link and other invitation details to the frontend
    return NextResponse.json({ invitation: data });
  } catch (error) {
    console.log('Failed to generate invitation:', error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
