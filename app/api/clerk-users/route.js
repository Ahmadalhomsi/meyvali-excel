import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const userList = await clerkClient.users.getUserList();
    const users = userList.data.map(user => ({
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.emailAddresses[0]?.emailAddress || '',
      imageUrl: user.imageUrl,
      role: user.publicMetadata.role || 'normal'
    }));
    return NextResponse.json(users);
  } catch (error) {
    console.log('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users list' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, role } = await req.json();

    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role: role },
    });

    return NextResponse.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.log('Failed to update user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

// New route for sending invitations
export async function sendInvite(req) {
  try {
    const { email } = await req.json();

    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    });

    return NextResponse.json({ message: 'Invitation sent successfully', invitation });
  } catch (error) {
    console.log('Failed to send invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}