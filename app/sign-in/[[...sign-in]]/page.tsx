
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  console.log('Hello from sign-in page');


  return <div >
    <SignIn />
  </div>
}