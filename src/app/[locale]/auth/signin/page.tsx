import { Metadata } from 'next';
import SignInPageClient from './pageclient';

export const metadata: Metadata = {
  title: 'Sign In | Fast Track Purchasing',
  description: 'Sign in to your Fast Track Purchasing account',
};

export default function SignInPage() {
  return <SignInPageClient />;
}