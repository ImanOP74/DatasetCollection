import { cookies } from 'next/headers';
import { AdminClient } from '@/app/admin/AdminClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin_session')?.value === 'authenticated';

  return <AdminClient initialAuth={isAuthenticated} />;
}
