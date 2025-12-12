import { Metadata } from 'next';
import SignInPageClient from './pageclient';

export const metadata: Metadata = {
  title: 'Sign In | Fast Track Projects',
  description: 'Sign in to your Fast Track Projects account',
};

export default function SignInPage() {
  return <SignInPageClient />;
}