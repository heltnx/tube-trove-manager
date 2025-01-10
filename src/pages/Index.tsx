import { useState } from "react";
import { Plus } from "lucide-react";
import { HomeopathyList } from "@/components/HomeopathyList";
import { useToast } from "@/components/ui/use-toast";

interface Tube {
  id: string;
  name: string;
  usage?: string;
  quantity: number;
}

interface List {
  id: string;
  name: string;
  tubes: Tube[];
}

const Index = () => {
  const [lists, setLists] = useState<List[]>([]);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddList = () => {
    const newList = {
      id: Math.random().toString(36).substr(2, 9),
      name: "Nouvelle liste",
      tubes: [],
    };
    setLists([...lists, newList]);
    setExpandedListId(newList.id);
    toast({
      title: "Liste créée",
      description: "Une nouvelle liste a été créée avec succès.",
    });
  };

  const handleUpdateList = (id: string, name: string, tubes: Tube[]) => {
    setLists(
      lists.map((list) => (list.id === id ? { ...list, name, tubes } : list))
    );
  };

  const handleDeleteList = (id: string) => {
    setLists(lists.filter((list) => list.id !== id));
    if (expandedListId === id) {
      setExpandedListId(null);
    }
    toast({
      title: "Liste supprimée",
      description: "La liste a été supprimée avec succès.",
      variant: "destructive",
    });
  };

  const handleToggleList = (id: string) => {
    setExpandedListId(expandedListId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mes Tubes Homéopathiques
          </h1>
          <button
            onClick={handleAddList}
            className="flex items-center gap-2 px-4 py-2 bg-apple-green text-white rounded-lg hover:bg-apple-green-dark transition-colors"
          >
            <Plus size={20} />
            <span>Nouvelle liste</span>
          </button>
        </div>

        <div className="space-y-4">
          {lists.map((list) => (
            <HomeopathyList
              key={list.id}
              {...list}
              isExpanded={expandedListId === list.id}
              onToggle={() => handleToggleList(list.id)}
              onUpdate={handleUpdateList}
              onDelete={handleDeleteList}
            />
          ))}
          {lists.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">
                Aucune liste créée. Cliquez sur "Nouvelle liste" pour commencer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;