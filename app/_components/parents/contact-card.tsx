// app/report-book/components/contact-card.tsx
import { Avatar } from "./avatar";

interface Props {
  name: string;
  initials: string;
  role: string;
}

export function ContactCard({ name, initials, role }: Props) {
  return (
    <div className="flex items-center gap-[11px] bg-[#F1E7D4] border border-[#EFE6D2] rounded-[18px] p-3">
      <Avatar 
        initials={initials} 
        size="md" 
        className="!bg-[#E3EEE6] !text-[#4C7A5E] !shadow-none" 
      />
      <div>
        <div className="font-bold text-[13px]">{name}</div>
        <div className="text-[11.5px] text-[#9BA3AF] font-mono">{role}</div>
      </div>
    </div>
  );
}