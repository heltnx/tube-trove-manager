import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface TubeItemProps {
  id: string;
  name: string;
  usage?: string;
  quantity: number;
  onUpdate: (id: string, name: string, usage: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export const TubeItem = ({ id, name, usage, quantity, onUpdate, onDelete }: TubeItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editUsage, setEditUsage] = useState(usage || "");
  const [editQuantity, setEditQuantity] = useState(quantity);

  const handleSave = () => {
    onUpdate(id, editName, editUsage, editQuantity);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(name);
    setEditUsage(usage || "");
    setEditQuantity(quantity);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Nom du tube"
        />
        <input
          type="text"
          value={editUsage}
          onChange={(e) => setEditUsage(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Utilité"
        />
        <input
          type="number"
          value={editQuantity}
          onChange={(e) => setEditQuantity(Number(e.target.value))}
          className="w-20 p-2 border rounded"
          min="0"
        />
        <button
          onClick={handleSave}
          className="p-2 text-apple-green hover:text-apple-green-dark"
        >
          <Check size={20} />
        </button>
        <button
          onClick={handleCancel}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
      <span className="flex-1 font-medium">{name}</span>
      <span className="flex-1 text-gray-600">{usage}</span>
      <span className="w-20 text-center">{quantity}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-2 text-apple-green hover:text-apple-green-dark"
      >
        <Pencil size={20} />
      </button>
      <button
        onClick={() => onDelete(id)}
        className="p-2 text-red-500 hover:text-red-700"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};