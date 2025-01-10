import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { HomeopathyList } from "@/components/HomeopathyList";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  // Fetch lists and tubes
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
          <button
            onClick={() => addListMutation.mutate()}
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
              onUpdate={(id, name, tubes) => updateListMutation.mutate({ id, name, tubes })}
              onDelete={(id) => deleteListMutation.mutate(id)}
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