import type { ReactNode } from 'react';
import TabBar from './TabBar';
import ProductSheet from './ProductSheet';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-[520px] flex-col">
      <main
        className="flex-1 pb-24"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px))' }}
      >
        {children}
      </main>
      <TabBar />
      <ProductSheet />
    </div>
  );
}
