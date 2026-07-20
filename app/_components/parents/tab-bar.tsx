// app/report-book/components/tab-bar.tsx
import type { LucideIcon } from "lucide-react";

type TabId = string;

interface Tab {
  id: TabId;
  icon: LucideIcon;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div 
      className="flex gap-[6px] mt-[22px] overflow-x-auto pb-0.5 scrollbar-none" 
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-[7px] flex-shrink-0 font-semibold text-[12.5px] sm:text-[13.5px] px-[13px] py-2.5 sm:px-4 sm:py-[11px] sm:pb-3 rounded-t-[14px] border border-b-0 cursor-pointer relative top-px transition-all duration-150 ${
            activeTab === tab.id
              ? "bg-[#FFFDF8] text-[#23303D] border-[#E6D9BE] shadow-[0_-4px_14px_-8px_rgba(35,48,61,0.15)]"
              : "bg-[#F1E7D4] text-[#667081] border-[#EFE6D2] hover:text-[#23303D]"
          }`}
        >
          <tab.icon
            className={`w-[17px] h-[17px] sm:w-[15px] sm:h-[15px] ${
              activeTab === tab.id ? "opacity-100 text-[#C67E1B]" : "opacity-75"
            }`}
            strokeWidth={2.2}
          />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}