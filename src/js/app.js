import { TubeService } from './tube-service.js';
import { TubeList } from './components/TubeList.js';

class TubeManager {
    constructor() {
        this.listsContainer = document.getElementById('lists-container');
        this.listTemplate = document.getElementById('list-template');
        this.addListBtn = document.getElementById('addListBtn');
        this.tubeLists = new Map();
        
        if (!this.listsContainer || !this.listTemplate || !this.addListBtn) {
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
        
        this.listsContainer.innerHTML = '';
        console.log('Rendu des listes:', lists);
        
        lists.forEach(list => {
            const listElement = this.createListElement(list);
            const listTubes = tubes.filter(tube => tube.list_id === list.id);
            
            this.listsContainer.appendChild(listElement);
            
            const tubeList = new TubeList(listElement, list, listTubes);
            this.tubeLists.set(list.id, tubeList);
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
        
        return listElement;
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
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de TubeManager...');
    new TubeManager();
});