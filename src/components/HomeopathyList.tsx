import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Trash2, Check, X } from "lucide-react";
import { TubeForm } from "./TubeForm";
import { TubeItem } from "./TubeItem";

interface Tube {
  id: string;
  name: string;
  usage?: string;
  quantity: number;
}

interface HomeopathyListProps {
  id: string;
  name: string;
  tubes: Tube[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, name: string, tubes: Tube[]) => void;
  onDelete: (id: string) => void;
}

export const HomeopathyList = ({
  id,
  name,
  tubes,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: HomeopathyListProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleSaveName = () => {
    onUpdate(id, editName, tubes);
    setIsEditing(false);
  };

  const handleAddTube = (name: string, usage: string, quantity: number) => {
    const newTube = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      usage,
      quantity,
    };
    const updatedTubes = [...tubes, newTube].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    onUpdate(id, editName, updatedTubes);
  };

  const handleUpdateTube = (
    tubeId: string,
    name: string,
    usage: string,
    quantity: number
  ) => {
    const updatedTubes = tubes
      .map((tube) =>
        tube.id === tubeId ? { ...tube, name, usage, quantity } : tube
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    onUpdate(id, editName, updatedTubes);
  };

  const handleDeleteTube = (tubeId: string) => {
    const updatedTubes = tubes.filter((tube) => tube.id !== tubeId);
    onUpdate(id, editName, updatedTubes);
  };

  const totalTubes = tubes.reduce((sum, tube) => sum + tube.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div className="flex items-center justify-between p-4 bg-apple-green-light">
        <div className="flex items-center gap-4 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Nom de la liste"
              />
              <button
                onClick={handleSaveName}
                className="p-2 text-apple-green hover:text-apple-green-dark"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => {
                  setEditName(name);
                  setIsEditing(false);
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold flex-1">{name}</h2>
              <span className="text-sm text-gray-600">
                {totalTubes} tube{totalTubes !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-apple-green hover:text-apple-green-dark"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => onDelete(id)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-apple-green hover:text-apple-green-dark"
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>
      {isExpanded && (
        <div className="p-4">
          <TubeForm onAdd={handleAddTube} />
          <div className="mt-4 space-y-2">
            {tubes.map((tube) => (
              <TubeItem
                key={tube.id}
                {...tube}
                onUpdate={handleUpdateTube}
                onDelete={handleDeleteTube}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};