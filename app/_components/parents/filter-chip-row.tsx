// app/report-book/components/filter-chip-row.tsx
interface Props {
  items: string[];
  activeItem: string;
  onSelect: (item: string) => void;
}

export function FilterChipRow({ items, activeItem, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-[18px]">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`text-[12.5px] font-semibold px-[13px] py-[7px] rounded-full border transition-all duration-150 cursor-pointer ${
            item === activeItem
              ? "bg-[#23303D] text-[#FAF4E8] border-[#23303D]"
              : "bg-[#F1E7D4] text-[#667081] border-[#EFE6D2] hover:border-[#E39A2D] hover:text-[#23303D]"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}