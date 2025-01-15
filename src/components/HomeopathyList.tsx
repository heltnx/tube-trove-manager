import { useState } from "react";
import { ListHeader } from "./ListHeader";
import { TubeForm } from "./TubeForm";
import { TubeList } from "./TubeList";
import { useMediaQuery } from "@/hooks/use-media-query";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  const totalTubes = tubes.reduce((sum, tube) => sum + tube.quantity, 0);

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <ListHeader
        name={name}
        tubeCount={totalTubes}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onEdit={() => setIsEditing(true)}
        onDelete={() => onDelete(id)}
      />
      {isExpanded && (
        <div className="p-0 md:p-4">
          <TubeForm onAdd={handleAddTube} isMobile={isMobile} />
          <div className="mt-4">
            <TubeList
              tubes={tubes}
              listName={name}
              onUpdate={handleUpdateTube}
              onDelete={handleDeleteTube}
            />
          </div>
        </div>
      )}
    </div>
  );
};