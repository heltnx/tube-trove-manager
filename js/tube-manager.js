import { TubeService } from './tube-service.js';

export class TubeManager {
    constructor(tubeElement, tube) {
        this.tubeElement = tubeElement;
        this.tube = tube;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const fields = this.tubeElement.querySelectorAll('[role="button"]');
        fields.forEach(field => {
            field.addEventListener('click', () => this.startEditing());
        });

        const deleteBtn = this.tubeElement.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Voulez-vous vraiment supprimer ce tube ?')) {
                    TubeService.deleteTube(this.tube.id);
                }
            });
        }
    }

    startEditing() {
        this.tubeElement.classList.add('editing');
        this.renderEditMode();
    }

    renderEditMode() {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'tube-name';
        nameInput.value = this.tube.name;
        
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'tube-quantity';
        quantityInput.value = this.tube.quantity;
        quantityInput.min = '1';
        
        const usageInput = document.createElement('input');
        usageInput.type = 'text';
        usageInput.className = 'tube-usage';
        usageInput.value = this.tube.usage || '';

        // Remplacer les spans par les inputs
        this.tubeElement.querySelector('.tube-name').replaceWith(nameInput);
        this.tubeElement.querySelector('.tube-quantity').replaceWith(quantityInput);
        this.tubeElement.querySelector('.tube-usage').replaceWith(usageInput);

        // Ajouter les écouteurs pour la sauvegarde
        [nameInput, quantityInput, usageInput].forEach(input => {
            input.addEventListener('blur', () => this.saveChanges());
        });
    }

    async saveChanges() {
        const nameInput = this.tubeElement.querySelector('input.tube-name');
        const quantityInput = this.tubeElement.querySelector('input.tube-quantity');
        const usageInput = this.tubeElement.querySelector('input.tube-usage');

        if (nameInput && quantityInput) {
            const newName = nameInput.value.trim();
            const newQuantity = parseInt(quantityInput.value);
            const newUsage = usageInput ? usageInput.value.trim() : '';

            if (newName && !isNaN(newQuantity) && newQuantity > 0) {
                await TubeService.updateTube(
                    this.tube.id,
                    newName,
                    newUsage,
                    newQuantity
                );
            }
        }
    }
}