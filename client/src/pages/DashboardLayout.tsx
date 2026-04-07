import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[rgb(10,10,18)]">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-[100vw]">
        <div className="max-w-5xl mx-auto animate-fade-in pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
