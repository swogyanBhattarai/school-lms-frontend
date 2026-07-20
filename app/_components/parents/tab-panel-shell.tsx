// app/report-book/components/tab-panel-shell.tsx
interface Props {
  children: React.ReactNode;
}

export function TabPanelShell({ children }: Props) {
  return (
    <div
      className="bg-[#FFFDF8] border border-[#E6D9BE] rounded-tl-none rounded-tr-[20px] rounded-b-[20px] shadow-[0_1px_2px_rgba(35,48,61,0.04),0_10px_26px_-14px_rgba(35,48,61,0.18)] min-h-[340px]"
    >
      {children}
    </div>
  );
}