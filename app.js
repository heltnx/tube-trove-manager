import { TubeService } from './js/tube-service.js';
import { ListManager } from './js/list-manager.js';

class TubeManager {
    constructor() {
        this.listsContainer = document.getElementById('lists-container');
        this.listTemplate = document.getElementById('list-template');
        this.tubeTemplate = document.getElementById('tube-template');
        this.addListBtn = document.getElementById('addListBtn');
        this.listManagers = new Map();
        
        if (!this.listsContainer || !this.listTemplate || !this.tubeTemplate || !this.addListBtn) {
            console.error('Éléments HTML manquants');
            return;
        }

        this.setupEventListeners();
        this.loadLists();
        this.setupRealtimeSubscription();
    }

    setupEventListeners() {
        this.addListBtn.addEventListener('click', () => this.createNewList());
    }

    async loadLists() {
        try {
            console.log('Chargement des listes...');
            const lists = await TubeService.getLists();
            const tubes = await TubeService.getTubes();
            console.log('Données chargées:', { lists, tubes });
            this.renderLists(lists || [], tubes || []);
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
        if (!this.listsContainer) return;
        
        // Sauvegarde l'état d'expansion des listes
        const expandedLists = new Set();
        this.listsContainer.querySelectorAll('.list').forEach(list => {
            if (list.classList.contains('expanded')) {
                expandedLists.add(list.dataset.listId);
            }
        });
        
        this.listsContainer.innerHTML = '';
        console.log('Rendu des listes:', lists);
        
        lists.forEach(list => {
            const listElement = this.createListElement(list);
            const listTubes = tubes.filter(tube => tube.list_id === list.id);
            this.renderTubes(listElement, listTubes);
            
            // Restaure l'état d'expansion
            if (expandedLists.has(list.id)) {
                listElement.classList.add('expanded');
            }
            
            this.listsContainer.appendChild(listElement);
            
            // Crée un gestionnaire de liste pour la recherche
            const listManager = new ListManager(listElement, list, listTubes);
            this.listManagers.set(list.id, listManager);
        });
    }

    createListElement(list) {
        if (!this.listTemplate) return null;
        
        const listElement = this.listTemplate.content.cloneNode(true).firstElementChild;
        listElement.dataset.listId = list.id;
        
        const titleElement = listElement.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = list.name;
        }
        
        this.setupListEventListeners(listElement, list);
        return listElement;
    }

    setupListEventListeners(listElement, list) {
        const header = listElement.querySelector('.list-header');
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

        const listManager = this.listManagers.get(listElement.dataset.listId);
        if (listManager) {
            listManager.updateTubeCount();
        }
    }

    createTubeElement(tube) {
        const tubeElement = this.tubeTemplate.content.cloneNode(true).firstElementChild;
        
        tubeElement.querySelector('.tube-name').textContent = tube.name;
        tubeElement.querySelector('.tube-quantity').textContent = tube.quantity;
        tubeElement.querySelector('.tube-usage').textContent = tube.usage || '';

        const editBtn = tubeElement.querySelector('.btn-edit');
        const deleteBtn = tubeElement.querySelector('.btn-delete');

        editBtn.addEventListener('click', () => this.editTube(tube, tubeElement));
        deleteBtn.addEventListener('click', () => this.deleteTube(tube.id));

        return tubeElement;
    }

    async createNewList() {
        try {
            await TubeService.createList('Nouvelle liste');
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
                await TubeService.updateList(list.id, newName);
            } catch (error) {
                console.error('Erreur lors de la modification de la liste:', error);
            }
        }
    }

    async deleteList(listId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
            try {
                await TubeService.deleteList(listId);
            } catch (error) {
                console.error('Erreur lors de la suppression de la liste:', error);
            }
        }
    }

    async addTube(listId, form) {
        const nameInput = form.querySelector('input[name="name"]');
        const quantityInput = form.querySelector('input[name="quantity"]');
        const usageInput = form.querySelector('input[name="usage"]');

        try {
            await TubeService.addTube(
                listId,
                nameInput.value,
                usageInput.value,
                quantityInput.value
            );
            form.reset();
            quantityInput.value = "1";
        } catch (error) {
            console.error('Erreur lors de l\'ajout du tube:', error);
        }
    }

    async editTube(tube, tubeElement) {
        const newName = prompt('Nouveau nom du tube:', tube.name);
        if (!newName) return;

        const newQuantity = parseInt(prompt('Nouvelle quantité:', tube.quantity));
        if (isNaN(newQuantity) || newQuantity < 1) return;

        const newUsage = prompt('Nouvelle utilité:', tube.usage || '');

        try {
            await TubeService.updateTube(tube.id, newName, newUsage, newQuantity);
        } catch (error) {
            console.error('Erreur lors de la modification du tube:', error);
        }
    }

    async deleteTube(tubeId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce tube ?')) {
            try {
                await TubeService.deleteTube(tubeId);
            } catch (error) {
                console.error('Erreur lors de la suppression du tube:', error);
            }
        }
    }
}

// Attendre que le DOM soit chargé avant d'initialiser
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de TubeManager...');
    new TubeManager();
});