const SUPABASE_URL = "https://cudkbdtnaynbapdbhvgm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZGtiZHRuYXluYmFwZGJodmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MjExNjAsImV4cCI6MjA1MjA5NzE2MH0.KHuKs25jmBAaJGzkgyrgqlOXLCqwQrXuDAw8BtHgfVc";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class TubeManager {
    constructor() {
        this.listsContainer = document.getElementById('lists-container');
        this.listTemplate = document.getElementById('list-template');
        this.tubeTemplate = document.getElementById('tube-template');
        this.addListBtn = document.getElementById('addListBtn');
        
        this.setupEventListeners();
        this.loadLists();
        this.setupRealtimeSubscription();
    }

    setupEventListeners() {
        this.addListBtn.addEventListener('click', () => this.createNewList());
    }

    async loadLists() {
        try {
            const { data: lists, error: listsError } = await supabase
                .from('lists')
                .select('*')
                .order('created_at');

            if (listsError) throw listsError;

            const { data: tubes, error: tubesError } = await supabase
                .from('tubes')
                .select('*')
                .order('name');

            if (tubesError) throw tubesError;

            this.renderLists(lists, tubes);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    setupRealtimeSubscription() {
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => this.loadLists())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tubes' }, () => this.loadLists())
            .subscribe();
    }

    renderLists(lists, tubes) {
        this.listsContainer.innerHTML = '';
        lists.forEach(list => {
            const listElement = this.createListElement(list);
            const listTubes = tubes.filter(tube => tube.list_id === list.id);
            this.renderTubes(listElement, listTubes);
            this.listsContainer.appendChild(listElement);
        });
    }

    createListElement(list) {
        const listElement = this.listTemplate.content.cloneNode(true).firstElementChild;
        const titleElement = listElement.querySelector('h2');
        const tubeCount = listElement.querySelector('.tube-count');
        
        titleElement.textContent = list.name;
        this.setupListEventListeners(listElement, list);
        
        return listElement;
    }

    setupListEventListeners(listElement, list) {
        const header = listElement.querySelector('.list-header');
        const toggleBtn = listElement.querySelector('.btn-toggle');
        const editBtn = listElement.querySelector('.btn-edit');
        const deleteBtn = listElement.querySelector('.btn-delete');
        const tubeForm = listElement.querySelector('.tube-form');

        header.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                listElement.classList.toggle('expanded');
            }
        });

        editBtn.addEventListener('click', () => this.editList(list, listElement));
        deleteBtn.addEventListener('click', () => this.deleteList(list.id));
        tubeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTube(list.id, tubeForm);
        });
    }

    renderTubes(listElement, tubes) {
        const tubesContainer = listElement.querySelector('.tubes-list');
        tubesContainer.innerHTML = '';
        
        tubes.forEach(tube => {
            const tubeElement = this.createTubeElement(tube);
            tubesContainer.appendChild(tubeElement);
        });

        const tubeCount = listElement.querySelector('.tube-count');
        const totalTubes = tubes.reduce((sum, tube) => sum + tube.quantity, 0);
        tubeCount.textContent = `${totalTubes} tube${totalTubes !== 1 ? 's' : ''}`;
    }

    createTubeElement(tube) {
        const tubeElement = this.tubeTemplate.content.cloneNode(true).firstElementChild;
        
        tubeElement.querySelector('.tube-name').textContent = tube.name;
        tubeElement.querySelector('.tube-usage').textContent = tube.usage || '';
        tubeElement.querySelector('.tube-quantity').textContent = tube.quantity;

        const editBtn = tubeElement.querySelector('.btn-edit');
        const deleteBtn = tubeElement.querySelector('.btn-delete');

        editBtn.addEventListener('click', () => this.editTube(tube, tubeElement));
        deleteBtn.addEventListener('click', () => this.deleteTube(tube.id));

        return tubeElement;
    }

    async createNewList() {
        try {
            const { data, error } = await supabase
                .from('lists')
                .insert([{ name: 'Nouvelle liste' }])
                .select()
                .single();

            if (error) throw error;
        } catch (error) {
            console.error('Erreur lors de la création de la liste:', error);
        }
    }

    async editList(list, listElement) {
        const titleElement = listElement.querySelector('h2');
        const currentName = titleElement.textContent;
        const newName = prompt('Nouveau nom de la liste:', currentName);

        if (newName && newName !== currentName) {
            try {
                const { error } = await supabase
                    .from('lists')
                    .update({ name: newName })
                    .eq('id', list.id);

                if (error) throw error;
            } catch (error) {
                console.error('Erreur lors de la modification de la liste:', error);
            }
        }
    }

    async deleteList(listId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
            try {
                const { error } = await supabase
                    .from('lists')
                    .delete()
                    .eq('id', listId);

                if (error) throw error;
            } catch (error) {
                console.error('Erreur lors de la suppression de la liste:', error);
            }
        }
    }

    async addTube(listId, form) {
        const nameInput = form.querySelector('input[type="text"]:first-child');
        const usageInput = form.querySelector('input[type="text"]:nth-child(2)');
        const quantityInput = form.querySelector('input[type="number"]');

        try {
            const { error } = await supabase
                .from('tubes')
                .insert([{
                    list_id: listId,
                    name: nameInput.value,
                    usage: usageInput.value || null,
                    quantity: parseInt(quantityInput.value)
                }]);

            if (error) throw error;
            form.reset();
            quantityInput.value = "1";
        } catch (error) {
            console.error('Erreur lors de l\'ajout du tube:', error);
        }
    }

    async editTube(tube, tubeElement) {
        const newName = prompt('Nouveau nom du tube:', tube.name);
        if (!newName) return;

        const newUsage = prompt('Nouvelle utilité:', tube.usage || '');
        const newQuantity = parseInt(prompt('Nouvelle quantité:', tube.quantity));

        if (isNaN(newQuantity) || newQuantity < 1) return;

        try {
            const { error } = await supabase
                .from('tubes')
                .update({
                    name: newName,
                    usage: newUsage || null,
                    quantity: newQuantity
                })
                .eq('id', tube.id);

            if (error) throw error;
        } catch (error) {
            console.error('Erreur lors de la modification du tube:', error);
        }
    }

    async deleteTube(tubeId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce tube ?')) {
            try {
                const { error } = await supabase
                    .from('tubes')
                    .delete()
                    .eq('id', tubeId);

                if (error) throw error;
            } catch (error) {
                console.error('Erreur lors de la suppression du tube:', error);
            }
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new TubeManager();
});