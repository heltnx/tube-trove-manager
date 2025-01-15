import { useState } from "react";
import { TubeItem } from "./TubeItem";

interface Tube {
  id: string;
  name: string;
  usage?: string;
  quantity: number;
}

interface TubeListProps {
  tubes: Tube[];
  listName: string;
  onUpdate: (id: string, name: string, usage: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export const TubeList = ({ tubes, listName, onUpdate, onDelete }: TubeListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string, name: string, usage: string, quantity: number) => {
    await onUpdate(id, name, usage, quantity);
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      {tubes.map((tube, index) => (
        <TubeItem
          key={tube.id}
          {...tube}
          listName={listName}
          isEditing={editingId === tube.id}
          isEven={index % 2 === 0}
          onStartEdit={() => handleStartEdit(tube.id)}
          onCancelEdit={handleCancelEdit}
          onUpdate={handleUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};