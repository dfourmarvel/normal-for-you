import { AppFooter } from "./AppFooter";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-7 pt-4 sm:pt-5 pb-12 min-h-screen flex flex-col">
      <TopNav />
      <DisclaimerBanner />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
