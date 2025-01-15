import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";

interface ListHeaderProps {
  name: string;
  tubeCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ListHeader = ({
  name,
  tubeCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: ListHeaderProps) => {
  return (
    <div 
      className="flex items-center justify-between p-4 bg-apple-green-light cursor-pointer"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          onToggle();
        }
      }}
    >
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-semibold flex-1 md:text-base">{name}</h2>
        <span className="text-sm text-gray-600">
          {tubeCount} tube{tubeCount !== 1 ? "s" : ""}
        </span>
        <button
          onClick={onEdit}
          className="p-2 text-apple-green hover:text-apple-green-dark"
        >
          <Edit2 size={20} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-500 hover:text-red-700"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div className="p-2 text-apple-green hidden md:block">
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>
    </div>
  );
};