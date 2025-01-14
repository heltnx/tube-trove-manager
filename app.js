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
        try {
            const subscription = supabase
                .from('lists')
                .on('*', () => this.loadLists())
                .subscribe();

            const tubesSubscription = supabase
                .from('tubes')
                .on('*', () => this.loadLists())
                .subscribe();

            console.log('Subscriptions établies:', { subscription, tubesSubscription });
        } catch (error) {
            console.error('Erreur lors de la configuration des subscriptions:', error);
        }
    }

    renderLists(lists, tubes) {
        if (!this.listsContainer) return;
        
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
            
            if (expandedLists.has(list.id)) {
                listElement.classList.add('expanded');
            }
            
            this.listsContainer.appendChild(listElement);
            
            const listManager = new ListManager(listElement, list, listTubes);
            this.listManagers.set(list.id, listManager);
        });
    }

    createListElement(list) {
        if (!this.listTemplate) return null;
        
        const listElement = this.listTemplate.content.cloneNode(true).firstElementChild;
        listElement.dataset.listId = list.id;
        listElement.dataset.name = list.name.toLowerCase();
        
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
        const toggleBtn = listElement.querySelector('.btn-toggle');

        const toggleExpand = () => listElement.classList.toggle('expanded');

        header.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                toggleExpand();
            }
        });

        toggleBtn.addEventListener('click', toggleExpand);

        editBtn.addEventListener('click', () => this.editList(list, listElement));
        deleteBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment supprimer cette liste et tous ses tubes ?')) {
                this.deleteList(list.id);
            }
        });
        
        tubeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addTube(list.id, tubeForm);
            await this.loadLists();
        });
    }

    renderTubes(listElement, tubes) {
        const tubesContainer = listElement.querySelector('.tubes-list');
        tubesContainer.innerHTML = '';
        
        tubes.forEach(tube => {
            const tubeElement = this.createTubeElement(tube);
            tubesContainer.appendChild(tubeElement);
        });

        const totalTubes = tubes.reduce((sum, tube) => sum + tube.quantity, 0);
        const tubeCount = listElement.querySelector('.tube-count');
        if (tubeCount) {
            tubeCount.textContent = `${totalTubes} tube${totalTubes !== 1 ? 's' : ''}`;
        }
    }

    createTubeElement(tube) {
        const tubeElement = this.tubeTemplate.content.cloneNode(true).firstElementChild;
        this.renderTubeContent(tubeElement, tube);
        return tubeElement;
    }

    renderTubeContent(tubeElement, tube, isEditing = false) {
        if (isEditing) {
            tubeElement.classList.add('editing');
            tubeElement.innerHTML = `
                <input type="text" class="tube-name" value="${tube.name}">
                <input type="number" class="tube-quantity" value="${tube.quantity}" min="1">
                <input type="text" class="tube-usage" value="${tube.usage || ''}">
                <button class="btn btn-edit"><i class="icon-check"></i></button>
                <button class="btn btn-delete"><i class="icon-trash"></i></button>
            `;

            const saveBtn = tubeElement.querySelector('.btn-edit');
            saveBtn.addEventListener('click', async () => {
                const newName = tubeElement.querySelector('.tube-name').value;
                const newQuantity = parseInt(tubeElement.querySelector('.tube-quantity').value);
                const newUsage = tubeElement.querySelector('.tube-usage').value;

                if (newName && !isNaN(newQuantity) && newQuantity > 0) {
                    try {
                        await TubeService.updateTube(tube.id, newName, newUsage, newQuantity);
                        await this.loadLists();
                        tubeElement.classList.remove('editing');
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour du tube:', error);
                    }
                }
            });
        } else {
            tubeElement.classList.remove('editing');
            tubeElement.innerHTML = `
                <span class="tube-name">${tube.name}</span>
                <span class="tube-quantity">${tube.quantity}</span>
                <span class="tube-usage">${tube.usage || ''}</span>
                <button class="btn btn-edit"><i class="icon-edit"></i></button>
                <button class="btn btn-delete"><i class="icon-trash"></i></button>
            `;

            const editBtn = tubeElement.querySelector('.btn-edit');
            editBtn.addEventListener('click', () => {
                this.renderTubeContent(tubeElement, tube, true);
            });
        }

        const deleteBtn = tubeElement.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment supprimer ce tube ?')) {
                this.deleteTube(tube.id);
            }
        });
    }

    async createNewList() {
        try {
            const name = prompt('Nom de la nouvelle liste:');
            if (name) {
                await TubeService.createList(name);
                await this.loadLists();
            }
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
                await this.loadLists();
            } catch (error) {
                console.error('Erreur lors de la modification de la liste:', error);
            }
        }
    }

    async deleteList(listId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
            try {
                await TubeService.deleteList(listId);
                await this.loadLists();
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
            await this.loadLists();
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
            await this.loadLists();
        } catch (error) {
            console.error('Erreur lors de la modification du tube:', error);
        }
    }

    async deleteTube(tubeId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce tube ?')) {
            try {
                await TubeService.deleteTube(tubeId);
                await this.loadLists();
            } catch (error) {
                console.error('Erreur lors de la suppression du tube:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de TubeManager...');
    new TubeManager();
});