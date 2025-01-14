import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

interface TubeItemProps {
  id: string;
  name: string;
  usage?: string;
  quantity: number;
  listName?: string;
  onUpdate: (id: string, name: string, usage: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export const TubeItem = ({ 
  id, 
  name, 
  usage = "", 
  quantity, 
  listName,
  onUpdate, 
  onDelete 
}: TubeItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editUsage, setEditUsage] = useState(usage);
  const [editQuantity, setEditQuantity] = useState(quantity);

  const handleSave = async () => {
    if (editName.trim() && editQuantity > 0) {
      await onUpdate(id, editName.trim(), editUsage.trim(), editQuantity);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(name);
    setEditUsage(usage);
    setEditQuantity(quantity);
    setIsEditing(false);
  };

  const getRowStyle = () => {
    const baseStyle = "flex items-center gap-2 p-2 rounded-lg";
    if (listName === "Sausset") {
      return `${baseStyle} even:bg-[#e1ead6]`;
    }
    if (listName === "Campello") {
      return `${baseStyle} even:bg-[#EDF5FF]`;
    }
    return baseStyle;
  };

  if (isEditing) {
    return (
      <div className={getRowStyle()}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Nom du tube"
        />
        <input
          type="number"
          value={editQuantity}
          onChange={(e) => setEditQuantity(Number(e.target.value))}
          className="w-20 p-2 border rounded"
          min="1"
        />
        <input
          type="text"
          value={editUsage}
          onChange={(e) => setEditUsage(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Utilité"
        />
        <button
          onClick={handleSave}
          className="p-2 text-apple-green hover:text-apple-green-dark"
        >
          <Check size={24} />
        </button>
        <button
          onClick={handleCancel}
          className="p-2 text-red-500 hover:text-red-700"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className={getRowStyle()}>
      <span className="flex-1 font-medium">{name}</span>
      <span className="w-20 text-center">{quantity}</span>
      <span className="flex-1 text-gray-600">{usage}</span>
      <button
        onClick={() => setIsEditing(true)}
        className={`p-2 ${
          listName === "Campello" 
            ? "text-blue-500 hover:text-blue-700" 
            : "text-apple-green hover:text-apple-green-dark"
        }`}
      >
        <Pencil size={24} />
      </button>
      <button
        onClick={() => onDelete(id)}
        className="p-2 text-red-500 hover:text-red-700"
      >
        <X size={24} />
      </button>
    </div>
  );
};