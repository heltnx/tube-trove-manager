export class ListView {
    constructor(listElement, list) {
        this.listElement = listElement;
        this.list = list;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const header = this.listElement.querySelector('.list-header');
        const titleElement = this.listElement.querySelector('h2');
        const deleteBtn = this.listElement.querySelector('.btn-delete');
        const tubeForm = this.listElement.querySelector('.tube-form');

        header.addEventListener('click', (e) => {
            if (!e.target.matches('h2, input')) {
                this.listElement.classList.toggle('expanded');
            }
        });

        titleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startTitleEditing(titleElement);
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment supprimer cette liste ?')) {
                this.deleteList();
            }
        });

        if (tubeForm) {
            tubeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTubeSubmit(e.target);
            });
        }
    }

    startTitleEditing(titleElement) {
        const currentName = titleElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'list-title-input';
        
        input.addEventListener('blur', () => this.saveTitleChanges(input, titleElement));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        titleElement.replaceWith(input);
        input.focus();
    }

    async saveTitleChanges(input, titleElement) {
        const newName = input.value.trim();
        if (newName && newName !== titleElement.textContent) {
            await TubeService.updateList(this.list.id, newName);
        }
        input.replaceWith(titleElement);
    }

    async deleteList() {
        await TubeService.deleteList(this.list.id);
    }

    async handleTubeSubmit(form) {
        const nameInput = form.querySelector('input[name="name"]');
        const quantityInput = form.querySelector('input[name="quantity"]');
        const usageInput = form.querySelector('input[name="usage"]');

        if (nameInput && quantityInput) {
            await TubeService.addTube(
                this.list.id,
                nameInput.value,
                usageInput.value,
                quantityInput.value
            );
            form.reset();
            quantityInput.value = "1";
        }
    }
}