class TontineManager {
    constructor() {
        this.api = new ApiService();
        this.currentTontineId = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.initEventListeners();
        this.loadPageData();
    }

    checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '../auth/login.html';
            return;
        }
    }

    initEventListeners() {
        // Liste des tontines
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const sortSelect = document.getElementById('sortSelect');

        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => this.filterTontines(), 300));
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterTontines());
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.filterTontines());
        }

        // Création de tontine
        const createForm = document.getElementById('createTontineForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateTontine(e));
        }

        // Modal de suppression
        this.initDeleteModal();
    }

    async loadPageData() {
        if (window.location.pathname.includes('list.html')) {
            await this.loadTontinesList();
        }
    }

    async loadTontinesList() {
        try {
            const tontines = await this.api.getTontines();
            this.renderTontinesList(tontines);
        } catch (error) {
            this.showError('Erreur lors du chargement des tontines');
        }
    }

    renderTontinesList(tontines) {
        const grid = document.getElementById('tontinesGrid');
        const emptyState = document.getElementById('emptyState');

        if (!tontines || tontines.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = tontines.map(tontine => this.createTontineCard(tontine)).join('');
    }

    createTontineCard(tontine) {
        const statusClass = this.getStatusClass(tontine.status);
        const totalAmount = tontine.amount_per_member * tontine.max_members;
        
        return `
            <div class="tontine-card" data-tontine-id="${tontine.id}">
                <div class="tontine-header">
                    <h3 class="tontine-name">${tontine.name}</h3>
                    <p class="tontine-description">${tontine.description || 'Aucune description'}</p>
                </div>
                
                <div class="tontine-body">
                    <div class="tontine-meta">
                        <div class="meta-item">
                            <span class="meta-value">${Utils.formatCurrency(tontine.amount_per_member)}</span>
                            <span class="meta-label">Par membre</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-value">${tontine.max_members}</span>
                            <span class="meta-label">Membres max</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-value">${Utils.formatCurrency(totalAmount)}</span>
                            <span class="meta-label">Total</span>
                        </div>
                    </div>
                    
                    <div class="tontine-details">
                        <div class="detail-item">
                            <span class="detail-label">Fréquence</span>
                            <span class="detail-value">${this.getFrequencyText(tontine.frequency)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Tour actuel</span>
                            <span class="detail-value">${tontine.current_round || 1}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Créée le</span>
                            <span class="detail-value">${Utils.formatDate(tontine.created_at)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="tontine-footer">
                    <span class="tontine-status ${statusClass}">${this.getStatusText(tontine.status)}</span>
                    <div class="tontine-actions">
                        <a href="detail.html?id=${tontine.id}" class="btn btn-primary btn-sm">Voir</a>
                        <a href="edit.html?id=${tontine.id}" class="btn btn-outline btn-sm">Modifier</a>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${tontine.id}" data-name="${tontine.name}">
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusMap = {
            'active': 'status-active',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusMap[status] || 'status-active';
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Active',
            'completed': 'Terminée',
            'cancelled': 'Annulée'
        };
        return statusMap[status] || 'Active';
    }

    getFrequencyText(frequency) {
        const frequencyMap = {
            'daily': 'Quotidienne',
            'weekly': 'Hebdomadaire',
            'monthly': 'Mensuelle'
        };
        return frequencyMap[frequency] || 'Mensuelle';
    }

    async handleCreateTontine(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const tontineData = {
            name: formData.get('name'),
            description: formData.get('description'),
            amount_per_member: parseFloat(formData.get('amount_per_member')),
            max_members: parseInt(formData.get('max_members')),
            frequency: formData.get('frequency'),
            auto_approve: formData.get('auto_approve') === 'on',
            public: formData.get('public') === 'on'
        };

        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        try {
            const newTontine = await this.api.createTontine(tontineData);
            this.showSuccess('Tontine créée avec succès !');
            
            setTimeout(() => {
                window.location.href = 'list.html';
            }, 1500);
            
        } catch (error) {
            this.showError(error.message || 'Erreur lors de la création de la tontine');
        } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    initDeleteModal() {
        const modal = document.getElementById('deleteModal');
        const closeBtn = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('cancelDelete');
        const confirmBtn = document.getElementById('confirmDelete');

        if (!modal) return;

        // Ouvrir le modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const tontineId = e.target.getAttribute('data-id');
                const tontineName = e.target.getAttribute('data-name');
                
                this.currentTontineId = tontineId;
                document.getElementById('deleteTontineName').textContent = tontineName;
                modal.classList.add('show');
            }
        });

        // Fermer le modal
        const closeModal = () => {
            modal.classList.remove('show');
            this.currentTontineId = null;
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // Confirmer la suppression
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmDelete());
        }

        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    async confirmDelete() {
        if (!this.currentTontineId) return;

        try {
            await this.api.deleteTontine(this.currentTontineId);
            this.showSuccess('Tontine supprimée avec succès');
            
            document.getElementById('deleteModal').classList.remove('show');
            await this.loadTontinesList(); // Recharger la liste
            
        } catch (error) {
            this.showError('Erreur lors de la suppression de la tontine');
        }
    }

    filterTontines() {
        // Implémentation du filtrage et tri
        console.log('Filtrage des tontines...');
    }

    showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Extension de l'API Service pour les tontines
ApiService.prototype.getTontines = async function() {
    return this.request('/tontines');
};

ApiService.prototype.getTontine = async function(id) {
    return this.request(`/tontines/${id}`);
};

ApiService.prototype.createTontine = async function(tontineData) {
    return this.request('/tontines', {
        method: 'POST',
        body: JSON.stringify(tontineData)
    });
};

ApiService.prototype.updateTontine = async function(id, tontineData) {
    return this.request(`/tontines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tontineData)
    });
};

ApiService.prototype.deleteTontine = async function(id) {
    return this.request(`/tontines/${id}`, {
        method: 'DELETE'
    });
};

// Initialiser le gestionnaire de tontines
document.addEventListener('DOMContentLoaded', () => {
    new TontineManager();
});