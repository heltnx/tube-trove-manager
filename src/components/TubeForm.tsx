import { useState } from "react";
import { Plus } from "lucide-react";

interface TubeFormProps {
  onAdd: (name: string, usage: string, quantity: number) => void;
}

export const TubeForm = ({ onAdd }: TubeFormProps) => {
  const [name, setName] = useState("");
  const [usage, setUsage] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), usage.trim(), quantity);
      setName("");
      setUsage("");
      setQuantity(1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-b">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 p-2 border rounded"
        placeholder="Nom du tube"
        required
      />
      <input
        type="text"
        value={usage}
        onChange={(e) => setUsage(e.target.value)}
        className="flex-1 p-2 border rounded"
        placeholder="Utilité (optionnel)"
      />
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-20 p-2 border rounded"
        min="1"
      />
      <button
        type="submit"
        className="p-2 bg-apple-green text-white rounded-lg hover:bg-apple-green-dark transition-colors"
      >
        <Plus size={20} />
      </button>
    </form>
  );
};