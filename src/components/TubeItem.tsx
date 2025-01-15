import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";

interface TubeItemProps {
  id: string;
  name: string;
  usage?: string;
  quantity: number;
  listName: string;
  isEditing: boolean;
  isEven: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, name: string, usage: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export const TubeItem = ({
  id,
  name,
  usage = "",
  quantity,
  listName,
  isEditing,
  isEven,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: TubeItemProps) => {
  const [editName, setEditName] = useState(name);
  const [editUsage, setEditUsage] = useState(usage);
  const [editQuantity, setEditQuantity] = useState(quantity);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && itemRef.current && !itemRef.current.contains(event.target as Node)) {
        onCancelEdit();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, onCancelEdit]);

  const getBackgroundColor = () => {
    if (listName.toLowerCase() === "sausset") {
      return isEven ? "bg-[#F2FCE2]" : "";
    }
    if (listName.toLowerCase() === "campello") {
      return isEven ? "bg-[#EDF5FF]" : "";
    }
    return "";
  };

  const handleSave = async () => {
    if (editName.trim() && editQuantity > 0) {
      await onUpdate(id, editName.trim(), editUsage.trim(), editQuantity);
    }
  };

  if (isEditing) {
    return (
      <div ref={itemRef} className={`flex items-center gap-2 p-2 rounded-lg ${getBackgroundColor()}`}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 p-2 border rounded text-sm"
          placeholder="Nom du tube"
        />
        <input
          type="number"
          value={editQuantity}
          onChange={(e) => setEditQuantity(Number(e.target.value))}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-20 p-2 border rounded text-sm text-right"
          min="1"
        />
        <input
          type="text"
          value={editUsage}
          onChange={(e) => setEditUsage(e.target.value)}
          className="flex-1 p-2 border rounded text-sm"
          placeholder="Utilité"
        />
        <button
          onClick={handleSave}
          className="p-2 text-apple-green hover:text-apple-green-dark"
        >
          <Check size={20} />
        </button>
        <button
          onClick={onCancelEdit}
          className="p-2 text-red-500 hover:text-red-700"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${getBackgroundColor()}`}>
      <span className="flex-1 font-medium text-sm">{name}</span>
      <span className="w-20 text-right text-sm">{quantity}</span>
      <span className="flex-1 text-gray-600 text-sm">{usage}</span>
      <button
        onClick={onStartEdit}
        className={`p-2 ${
          listName.toLowerCase() === "campello"
            ? "text-blue-500 hover:text-blue-700"
            : "text-apple-green hover:text-apple-green-dark"
        }`}
      >
        <Pencil size={20} />
      </button>
      <button onClick={() => onDelete(id)} className="p-2 text-red-500 hover:text-red-700">
        <X size={20} />
      </button>
    </div>
  );
};