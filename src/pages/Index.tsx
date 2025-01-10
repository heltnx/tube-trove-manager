import { useState, useEffect } from "react";
import { Plus, FileUp } from "lucide-react";
import { HomeopathyList } from "@/components/HomeopathyList";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from 'xlsx';

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
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .order('created_at');

      if (listsError) throw listsError;

      const { data: tubesData, error: tubesError } = await supabase
        .from('tubes')
        .select('*')
        .order('name');

      if (tubesError) throw tubesError;

      return listsData.map(list => ({
        ...list,
        tubes: tubesData.filter(tube => tube.list_id === list.id)
      }));
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Group data by list name
        const groupedData: { [key: string]: any[] } = {};
        jsonData.forEach((row: any) => {
          const listName = row.liste || 'Liste par défaut';
          if (!groupedData[listName]) {
            groupedData[listName] = [];
          }
          groupedData[listName].push({
            name: row.nom || row.tube || row.name,
            usage: row.usage || row.utilite,
            quantity: parseInt(row.quantite || row.quantity || 1)
          });
        });

        // Create lists and tubes
        for (const [listName, tubes] of Object.entries(groupedData)) {
          // Create list
          const { data: listData, error: listError } = await supabase
            .from('lists')
            .insert([{ name: listName }])
            .select()
            .single();

          if (listError) throw listError;

          // Create tubes for this list
          const { error: tubesError } = await supabase
            .from('tubes')
            .insert(
              tubes.map(tube => ({
                list_id: listData.id,
                name: tube.name,
                usage: tube.usage,
                quantity: tube.quantity
              }))
            );

          if (tubesError) throw tubesError;
        }

        queryClient.invalidateQueries({ queryKey: ['lists'] });
        toast({
          title: "Import réussi",
          description: "Toutes les données ont été importées avec succès.",
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import des données.",
        variant: "destructive",
      });
    }
  };

  // Add list mutation
  const addListMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ name: 'Nouvelle liste' }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setExpandedListId(newList.id);
      toast({
        title: "Liste créée",
        description: "Une nouvelle liste a été créée avec succès.",
      });
    }
  });

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: async ({ id, name, tubes }: List) => {
      // Update list name
      const { error: listError } = await supabase
        .from('lists')
        .update({ name })
        .eq('id', id);

      if (listError) throw listError;

      // Get existing tubes for this list
      const { data: existingTubes } = await supabase
        .from('tubes')
        .select('id')
        .eq('list_id', id);

      const existingTubeIds = existingTubes?.map(tube => tube.id) || [];
      const newTubeIds = tubes.map(tube => tube.id);

      // Delete tubes that no longer exist
      const tubesToDelete = existingTubeIds.filter(id => !newTubeIds.includes(id));
      if (tubesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('tubes')
          .delete()
          .in('id', tubesToDelete);

        if (deleteError) throw deleteError;
      }

      // Update or insert tubes
      for (const tube of tubes) {
        if (existingTubeIds.includes(tube.id)) {
          // Update existing tube
          const { error: updateError } = await supabase
            .from('tubes')
            .update({
              name: tube.name,
              usage: tube.usage,
              quantity: tube.quantity
            })
            .eq('id', tube.id);

          if (updateError) throw updateError;
        } else {
          // Insert new tube
          const { error: insertError } = await supabase
            .from('tubes')
            .insert([{
              list_id: id,
              name: tube.name,
              usage: tube.usage,
              quantity: tube.quantity
            }]);

          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    }
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast({
        title: "Liste supprimée",
        description: "La liste a été supprimée avec succès.",
        variant: "destructive",
      });
    }
  });

  const handleToggleList = (id: string) => {
    setExpandedListId(expandedListId === id ? null : id);
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lists'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tubes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lists'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mes Tubes Homéopathiques
          </h1>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-apple-green text-white rounded-lg hover:bg-apple-green-dark transition-colors cursor-pointer">
              <FileUp size={20} />
              <span>Importer Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => addListMutation.mutate()}
              className="flex items-center gap-2 px-4 py-2 bg-apple-green text-white rounded-lg hover:bg-apple-green-dark transition-colors"
            >
              <Plus size={20} />
              <span>Nouvelle liste</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {lists.map((list) => (
            <HomeopathyList
              key={list.id}
              {...list}
              isExpanded={expandedListId === list.id}
              onToggle={() => handleToggleList(list.id)}
              onUpdate={(id, name, tubes) => updateListMutation.mutate({ id, name, tubes })}
              onDelete={(id) => deleteListMutation.mutate(id)}
            />
          ))}
          {lists.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">
                Aucune liste créée. Cliquez sur "Nouvelle liste" pour commencer ou importez un fichier Excel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
