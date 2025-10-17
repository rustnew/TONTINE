class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Vérifier l'authentification
        if (!auth.requireAuth()) return;

        this.loadUserData();
        this.loadDashboardData();
        this.setupEventListeners();
    }

    loadUserData() {
        this.currentUser = auth.getCurrentUser();
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.full_name;
            document.getElementById('welcomeMessage').textContent = 
                `Bienvenue, ${this.currentUser.full_name} !`;
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadRecentTontines(),
                this.loadUpcomingRounds(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            this.showNotification('Erreur lors du chargement des données', 'error');
        }
    }

    async loadStats() {
        try {
            // Récupérer les tontines de l'utilisateur
            const userTontines = await api.get(`/tontines/user/${this.currentUser.id}`);
            const totalTontines = userTontines.filter(t => t.status === 'active').length;
            
            // Calculer les statistiques (simplifié pour l'exemple)
            let totalContributions = 0;
            let pendingRounds = 0;
            let totalMembers = 0;

            for (const tontine of userTontines) {
                // Récupérer les membres
                const members = await api.get(`/tontine-members/tontine/${tontine.id}`);
                totalMembers += members.length;

                // Récupérer les rounds
                const rounds = await api.get(`/tontine-rounds/tontine/${tontine.id}`);
                pendingRounds += rounds.filter(r => r.status === 'pending').length;

                // Calculer les contributions (simulation)
                totalContributions += tontine.amount_per_member * members.length;
            }

            // Mettre à jour l'interface
            document.getElementById('totalTontines').textContent = totalTontines;
            document.getElementById('totalContributions').textContent = 
                Formatter.currency(totalContributions);
            document.getElementById('pendingRounds').textContent = pendingRounds;
            document.getElementById('totalMembers').textContent = totalMembers;

        } catch (error) {
            console.error('Error loading stats:', error);
            // Valeurs par défaut en cas d'erreur
            document.getElementById('totalTontines').textContent = '0';
            document.getElementById('totalContributions').textContent = '0 FCFA';
            document.getElementById('pendingRounds').textContent = '0';
            document.getElementById('totalMembers').textContent = '0';
        }
    }

    async loadRecentTontines() {
        try {
            const tontines = await api.get(`/tontines/user/${this.currentUser.id}`);
            const recentTontines = tontines.slice(0, 5); // 5 plus récentes
            
            const container = document.getElementById('recentTontines');
            
            if (recentTontines.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i>👥</i>
                        <p>Aucune tontine active</p>
                        <a href="tontine-create.html" class="btn btn-primary btn-sm">
                            Créer une tontine
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = recentTontines.map(tontine => `
                <div class="tontine-item">
                    <div class="tontine-icon">
                        <i>👥</i>
                    </div>
                    <div class="tontine-info">
                        <h4>${tontine.name}</h4>
                        <p>${Formatter.currency(tontine.amount_per_member)} / ${tontine.frequency}</p>
                    </div>
                    <div class="tontine-status status-${tontine.status}">
                        ${this.getStatusText(tontine.status)}
                    </div>
                </div>
            `).join('');

        } catch (error) {
            document.getElementById('recentTontines').innerHTML = `
                <div class="empty-state">
                    <p>Erreur de chargement</p>
                </div>
            `;
        }
    }

    async loadUpcomingRounds() {
        try {
            const userTontines = await api.get(`/tontines/user/${this.currentUser.id}`);
            let upcomingRounds = [];

            // Récupérer les rounds de toutes les tontines
            for (const tontine of userTontines) {
                const rounds = await api.get(`/tontine-rounds/tontine/${tontine.id}`);
                const pendingRounds = rounds.filter(r => r.status === 'pending');
                upcomingRounds = [...upcomingRounds, ...pendingRounds];
            }

            // Trier par date et prendre les 3 prochains
            upcomingRounds.sort((a, b) => new Date(a.round_date) - new Date(b.round_date));
            upcomingRounds = upcomingRounds.slice(0, 3);

            const container = document.getElementById('upcomingRounds');
            
            if (upcomingRounds.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i>📅</i>
                        <p>Aucune échéance prochaine</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = upcomingRounds.map(round => `
                <div class="round-item">
                    <div class="round-icon">
                        <i>💰</i>
                    </div>
                    <div class="round-info">
                        <h4>Round ${round.round_number}</h4>
                        <p>${Formatter.currency(round.amount)} - ${Formatter.date(round.round_date)}</p>
                    </div>
                    <div class="round-status status-pending">
                        En attente
                    </div>
                </div>
            `).join('');

        } catch (error) {
            document.getElementById('upcomingRounds').innerHTML = `
                <div class="empty-state">
                    <p>Erreur de chargement</p>
                </div>
            `;
        }
    }

    async loadRecentActivity() {
        try {
            // Pour l'instant, on simule l'activité récente
            // Dans une vraie app, on récupérerait les transactions récentes
            const recentActivity = [
                {
                    type: 'contribution',
                    message: 'Vous avez cotisé 25,000 FCFA',
                    date: new Date().toISOString(),
                    icon: '💰'
                },
                {
                    type: 'tontine_created',
                    message: 'Vous avez créé "Tontine Familiale"',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    icon: '👥'
                },
                {
                    type: 'member_joined',
                    message: 'Marie a rejoint votre tontine',
                    date: new Date(Date.now() - 172800000).toISOString(),
                    icon: '➕'
                }
            ];

            const container = document.getElementById('recentActivity');
            
            container.innerHTML = recentActivity.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i>${activity.icon}</i>
                    </div>
                    <div class="activity-info">
                        <h4>${activity.message}</h4>
                        <p>${Formatter.datetime(activity.date)}</p>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            document.getElementById('recentActivity').innerHTML = `
                <div class="empty-state">
                    <p>Erreur de chargement</p>
                </div>
            `;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Active',
            'pending': 'En attente',
            'completed': 'Terminée',
            'cancelled': 'Annulée'
        };
        return statusMap[status] || status;
    }

    setupEventListeners() {
        // Déconnexion
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });

        // Actualisation des données
        document.getElementById('refreshData').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadDashboardData();
            this.showNotification('Données actualisées', 'success');
        });

        // Navigation active
        this.setupNavigation();
    }

    setupNavigation() {
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

// Initialisation du dashboard
document.addEventListener('DOMContentLoaded', function() {
    new Dashboard();
});