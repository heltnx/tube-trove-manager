export class TubeList {
    constructor(listElement, list, tubes) {
        this.listElement = listElement;
        this.list = list;
        this.tubes = tubes;
        this.isExpanded = false;
        this.searchTerm = '';
        
        this.setupHeader();
        this.setupForm();
        this.setupTubesList();
        this.setupSearch();
    }

    setupHeader() {
        const header = this.listElement.querySelector('.list-header');
        const title = header.querySelector('h2');
        const deleteBtn = header.querySelector('.btn-delete');

        // Gérer le clic sur le header complet
        header.addEventListener('click', (e) => {
            // Ne pas déclencher si on clique sur le bouton de suppression ou sur un input
            if (!e.target.matches('.btn-delete, .btn-delete *, input')) {
                this.toggleExpand();
            }
        });

        // Gérer le double-clic sur le titre pour l'édition
        title.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startTitleEdit(title);
        });

        // Gérer la suppression avec confirmation
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await this.confirmDelete();
        });
    }

    setupForm() {
        const form = this.listElement.querySelector('.tube-form');
        const addButton = document.createElement('button');
        addButton.className = 'add-tube-btn';
        addButton.innerHTML = '<i class="icon-plus"></i> Ajouter un tube';
        
        form.parentNode.insertBefore(addButton, form);
        
        addButton.addEventListener('click', () => {
            form.classList.toggle('expanded');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(form);
        });
    }

    setupTubesList() {
        const tubesList = this.listElement.querySelector('.tubes-list');
        this.renderTubes(tubesList);
    }

    setupSearch() {
        const searchInput = this.listElement.querySelector('.tube-search');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterTubes();
        });
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        this.listElement.classList.toggle('expanded', this.isExpanded);
    }

    startTitleEdit(titleElement) {
        const currentTitle = titleElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'list-title-input';

        const saveTitle = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                await this.updateTitle(newTitle);
            }
            input.replaceWith(titleElement);
        };

        input.addEventListener('blur', saveTitle);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        titleElement.replaceWith(input);
        input.focus();
    }

    async confirmDelete() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="confirm-content">
                    <p>Êtes-vous sûr de vouloir supprimer cette liste et tous ses tubes ?</p>
                    <label class="confirm-checkbox">
                        <input type="checkbox" id="confirmCheck">
                        <span>OK, je confirme la suppression</span>
                    </label>
                    <div class="confirm-buttons">
                        <button class="btn btn-cancel">Annuler</button>
                        <button class="btn btn-confirm" disabled>Supprimer</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            const checkbox = dialog.querySelector('#confirmCheck');
            const confirmBtn = dialog.querySelector('.btn-confirm');
            const cancelBtn = dialog.querySelector('.btn-cancel');

            checkbox.addEventListener('change', () => {
                confirmBtn.disabled = !checkbox.checked;
            });

            cancelBtn.addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });

            confirmBtn.addEventListener('click', async () => {
                await this.deleteList();
                dialog.remove();
                resolve(true);
            });
        });
    }

    async updateTitle(newTitle) {
        try {
            await TubeService.updateList(this.list.id, newTitle);
            this.list.name = newTitle;
            this.listElement.querySelector('h2').textContent = newTitle;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du titre:', error);
        }
    }

    async deleteList() {
        try {
            await TubeService.deleteList(this.list.id);
            this.listElement.remove();
        } catch (error) {
            console.error('Erreur lors de la suppression de la liste:', error);
        }
    }

    async handleFormSubmit(form) {
        const nameInput = form.querySelector('input[name="name"]');
        const quantityInput = form.querySelector('input[name="quantity"]');
        const usageInput = form.querySelector('input[name="usage"]');

        try {
            await TubeService.addTube(
                this.list.id,
                nameInput.value,
                usageInput.value,
                quantityInput.value
            );
            form.reset();
            quantityInput.value = "1";
            form.classList.remove('expanded');
        } catch (error) {
            console.error('Erreur lors de l\'ajout du tube:', error);
        }
    }

    filterTubes() {
        const tubes = this.listElement.querySelectorAll('.tube');
        tubes.forEach(tube => {
            const name = tube.querySelector('.tube-name').textContent.toLowerCase();
            const usage = tube.querySelector('.tube-usage').textContent.toLowerCase();
            const quantity = tube.querySelector('.tube-quantity').textContent;
            
            const matches = name.includes(this.searchTerm) || 
                           usage.includes(this.searchTerm) || 
                           quantity.includes(this.searchTerm);
            
            tube.style.display = matches ? '' : 'none';
        });
    }

    renderTubes(tubesList) {
        tubesList.innerHTML = '';
        this.tubes.forEach(tube => {
            const tubeElement = this.createTubeElement(tube);
            tubesList.appendChild(tubeElement);
        });
    }

    createTubeElement(tube) {
        const element = document.createElement('div');
        element.className = 'tube';
        element.dataset.tubeId = tube.id;
        this.renderTubeContent(element, tube);
        return element;
    }

    renderTubeContent(element, tube, isEditing = false) {
        if (isEditing) {
            element.classList.add('editing');
            element.innerHTML = `
                <textarea class="tube-name" rows="1">${tube.name}</textarea>
                <input type="number" class="tube-quantity" value="${tube.quantity}" min="1">
                <textarea class="tube-usage" rows="1">${tube.usage || ''}</textarea>
            `;

            const textareas = element.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                textarea.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                });
                textarea.dispatchEvent(new Event('input'));
            });

            const inputs = element.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.saveTubeEdit(tube.id, element));
            });
        } else {
            element.classList.remove('editing');
            element.innerHTML = `
                <span class="tube-name" role="button">${tube.name}</span>
                <span class="tube-quantity" role="button">${tube.quantity}</span>
                <span class="tube-usage" role="button">${tube.usage || ''}</span>
                <button class="btn btn-delete"><i class="icon-trash"></i></button>
            `;

            const fields = element.querySelectorAll('[role="button"]');
            fields.forEach(field => {
                field.addEventListener('click', () => {
                    this.renderTubeContent(element, tube, true);
                });
            });

            const deleteBtn = element.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => this.deleteTube(tube.id));
        }
    }

    async saveTubeEdit(tubeId, element) {
        const newName = element.querySelector('.tube-name').value;
        const newQuantity = parseInt(element.querySelector('.tube-quantity').value);
        const newUsage = element.querySelector('.tube-usage').value;

        if (newName && !isNaN(newQuantity) && newQuantity > 0) {
            try {
                await TubeService.updateTube(tubeId, newName, newUsage, newQuantity);
                const tube = this.tubes.find(t => t.id === tubeId);
                if (tube) {
                    tube.name = newName;
                    tube.quantity = newQuantity;
                    tube.usage = newUsage;
                    this.renderTubeContent(element, tube);
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du tube:', error);
            }
        }
    }

    async deleteTube(tubeId) {
        try {
            await TubeService.deleteTube(tubeId);
            const element = this.listElement.querySelector(`[data-tube-id="${tubeId}"]`);
            if (element) {
                element.remove();
            }
            this.tubes = this.tubes.filter(t => t.id !== tubeId);
        } catch (error) {
            console.error('Erreur lors de la suppression du tube:', error);
        }
    }
}