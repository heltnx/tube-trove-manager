import { Plus } from "lucide-react";
import { useState } from "react";

interface TubeFormProps {
  onAdd: (name: string, usage: string, quantity: number) => void;
  isMobile: boolean;
}

export const TubeForm = ({ onAdd, isMobile }: TubeFormProps) => {
  const [isExpanded, setIsExpanded] = useState(!isMobile);
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

  if (isMobile && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-2 bg-apple-green text-white rounded-lg hover:bg-apple-green-dark transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        <span>Ajouter un tube</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 p-2 border-b">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 min-w-[200px] p-2 border rounded text-sm"
        placeholder="Nom du tube"
        required
      />
      <input
        type="text"
        value={usage}
        onChange={(e) => setUsage(e.target.value)}
        className="flex-1 min-w-[150px] p-2 border rounded text-sm"
        placeholder="Utilité (optionnel)"
      />
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-20 p-2 border rounded text-sm text-right"
        min="1"
        onClick={(e) => (e.target as HTMLInputElement).select()}
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