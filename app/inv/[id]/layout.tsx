import { ToastProvider } from '@/components/ui/Toast';

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
