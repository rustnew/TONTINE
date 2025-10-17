class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Vérifier si l'utilisateur est déjà connecté
        if (TokenManager.isAuthenticated() && 
            !window.location.pathname.includes('login.html') &&
            !window.location.pathname.includes('register.html')) {
            this.redirectToDashboard();
        }
    }

    async login(email, password) {
        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            if (response.access_token) {
                TokenManager.setToken(response.access_token);
                Storage.set('user', response.user);
                
                Message.show(
                    document.getElementById('message'),
                    'Connexion réussie !',
                    'success'
                );

                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1000);

                return response;
            }
        } catch (error) {
            Message.show(
                document.getElementById('message'),
                error.message || 'Erreur de connexion',
                'error'
            );
            throw error;
        }
    }

    async register(userData) {
        try {
            // Nettoyer le numéro de téléphone
            const cleanPhone = userData.phone.replace(/\s/g, '');
            
            const response = await api.post('/users', {
                ...userData,
                phone: cleanPhone
            });
            
            Message.show(
                document.getElementById('message'),
                'Inscription réussie ! Vous pouvez vous connecter.',
                'success'
            );

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

            return response;
        } catch (error) {
            let errorMessage = error.message || "Erreur lors de l'inscription";
            
            // Gestion des erreurs spécifiques
            if (errorMessage.includes('existe déjà')) {
                errorMessage = 'Un utilisateur avec cet email ou téléphone existe déjà';
            }
            
            Message.show(
                document.getElementById('message'),
                errorMessage,
                'error'
            );
            throw error;
        }
    }

    logout() {
        TokenManager.removeToken();
        Storage.remove('user');
        window.location.href = 'login.html';
    }

    getCurrentUser() {
        return Storage.get('user');
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    requireAuth() {
        if (!TokenManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Instance globale de l'authentification
const auth = new AuthManager();

// Initialisation de la page de login
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const messageDiv = document.getElementById('message');

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Validation basique
            if (!Validator.required(email) || !Validator.email(email)) {
                Message.show(messageDiv, 'Veuillez entrer un email valide', 'error');
                return;
            }

            if (!Validator.required(password)) {
                Message.show(messageDiv, 'Veuillez entrer votre mot de passe', 'error');
                return;
            }

            // Désactiver le bouton pendant la requête
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connexion...';

            try {
                await auth.login(email, password);
            } catch (error) {
                // L'erreur est déjà gérée dans la méthode login
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Se connecter';
            }
        });
    });
}

// Initialisation de la page d'inscription
if (window.location.pathname.includes('register.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialiser le gestionnaire de formulaire
        new FormHandler('registerForm');
        
        // Validation en temps réel pour la force du mot de passe
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const strength = Validator.passwordStrength(this.value);
                
                // Mettre à jour l'indicateur de force
                const strengthBar = document.getElementById('passwordStrength');
                const strengthText = document.getElementById('passwordStrengthText');
                
                if (strengthBar && strengthText) {
                    strengthBar.className = 'strength-fill';
                    strengthBar.classList.add(strength.text.toLowerCase().replace(' ', '-'));
                    strengthText.textContent = strength.text;
                    strengthText.className = 'strength-text';
                    strengthText.classList.add(strength.text.toLowerCase().replace(' ', '-'));
                }
            });
        }
    });
}