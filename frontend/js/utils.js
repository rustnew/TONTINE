// Gestion du stockage local
const Storage = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    }
};

// Gestion des tokens
const TokenManager = {
    getToken() {
        return Storage.get('auth_token');
    },

    setToken(token) {
        Storage.set('auth_token', token);
    },

    removeToken() {
        Storage.remove('auth_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

// Fonctions d'affichage de messages
const Message = {
    show(element, message, type = 'info') {
        element.textContent = message;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        
        // Auto-hide pour les messages de succès
        if (type === 'success') {
            setTimeout(() => {
                this.hide(element);
            }, 5000);
        }
    },

    hide(element) {
        element.classList.add('hidden');
    }
};

// Validation de formulaire
const Validator = {
    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    required(value) {
        return value && value.trim().length > 0;
    },

    minLength(value, min) {
        return value && value.length >= min;
    },

    fullName(name) {
        return this.required(name) && name.trim().length >= 2;
    },

    phone(phone) {
        // Validation basique pour numéros internationaux
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    passwordStrength(password) {
        if (!password) return { score: 0, text: 'Faible' };
        
        let score = 0;
        
        // Longueur minimale
        if (password.length >= 8) score += 1;
        
        // Contient des minuscules
        if (/[a-z]/.test(password)) score += 1;
        
        // Contient des majuscules
        if (/[A-Z]/.test(password)) score += 1;
        
        // Contient des chiffres
        if (/[0-9]/.test(password)) score += 1;
        
        // Contient des caractères spéciaux
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        const levels = [
            { score: 0, text: 'Faible' },
            { score: 2, text: 'Faible' },
            { score: 3, text: 'Moyen' },
            { score: 4, text: 'Fort' },
            { score: 5, text: 'Très fort' }
        ];
        
        return levels.find(level => score <= level.score) || levels[levels.length - 1];
    },

    passwordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }
};

// Formatage
const Formatter = {
     currency(amount) {
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    },

    date(dateString) {
        if (!dateString) return 'Date non définie';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    datetime(dateString) {
        if (!dateString) return 'Date non définie';
        return new Date(dateString).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    relativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
        return `Il y a ${Math.floor(diffDays / 30)} mois`;
    }
};

// Gestionnaire de formulaire
class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.init();
    }

    init() {
        if (!this.form) return;

        // Détecter tous les champs du formulaire
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.fields[input.name] = {
                element: input,
                errorElement: document.getElementById(`${input.name}Error`),
                valid: false
            };

            // Événements de validation en temps réel
            input.addEventListener('blur', () => this.validateField(input.name));
            input.addEventListener('input', () => this.validateField(input.name));
        });

        // Événement de soumission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return true;

        const value = field.element.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'fullName':
                isValid = Validator.fullName(value);
                errorMessage = isValid ? '' : 'Le nom complet doit contenir au moins 2 caractères';
                break;

            case 'email':
                isValid = Validator.email(value);
                errorMessage = isValid ? '' : 'Veuillez entrer un email valide';
                break;

            case 'phone':
                isValid = Validator.phone(value);
                errorMessage = isValid ? '' : 'Veuillez entrer un numéro de téléphone valide';
                break;

            case 'password':
                const strength = Validator.passwordStrength(value);
                isValid = value.length >= 8;
                errorMessage = isValid ? '' : 'Le mot de passe doit contenir au moins 8 caractères';
                
                // Mettre à jour l'indicateur de force
                this.updatePasswordStrength(strength);
                break;

            case 'confirmPassword':
                const password = this.fields.password?.element.value;
                isValid = Validator.passwordMatch(password, value);
                errorMessage = isValid ? '' : 'Les mots de passe ne correspondent pas';
                break;

            case 'acceptTerms':
                isValid = field.element.checked;
                errorMessage = isValid ? '' : 'Vous devez accepter les conditions';
                break;
        }

        // Mettre à jour l'état visuel
        this.setFieldState(fieldName, isValid, errorMessage);
        
        return isValid;
    }

    setFieldState(fieldName, isValid, errorMessage = '') {
        const field = this.fields[fieldName];
        if (!field) return;

        field.valid = isValid;
        
        // Mettre à jour les classes CSS
        field.element.classList.remove('valid', 'invalid');
        field.element.classList.add(isValid ? 'valid' : 'invalid');

        // Afficher le message d'erreur
        if (field.errorElement) {
            field.errorElement.textContent = errorMessage;
        }
    }

    updatePasswordStrength(strength) {
        const strengthBar = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (strengthBar && strengthText) {
            strengthBar.className = 'strength-fill';
            strengthBar.classList.add(strength.text.toLowerCase().replace(' ', '-'));
            strengthText.textContent = strength.text;
            strengthText.className = 'strength-text';
            strengthText.classList.add(strength.text.toLowerCase().replace(' ', '-'));
        }
    }

    validateForm() {
        let isValid = true;
        
        Object.keys(this.fields).forEach(fieldName => {
            const fieldIsValid = this.validateField(fieldName);
            if (!fieldIsValid) isValid = false;
        });

        return isValid;
    }

    getFormData() {
        const formData = {};
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            if (field.element.type === 'checkbox') {
                formData[fieldName] = field.element.checked;
            } else {
                formData[fieldName] = field.element.value.trim();
            }
        });
        return formData;
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            Message.show(
                document.getElementById('message'),
                'Veuillez corriger les erreurs dans le formulaire',
                'error'
            );
            return;
        }

        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création du compte...';

        try {
            const formData = this.getFormData();
            
            // Préparer les données pour l'API
            const userData = {
                email: formData.email,
                phone: formData.phone,
                full_name: formData.fullName,
                password: formData.password
            };

            await auth.register(userData);
            
        } catch (error) {
            // L'erreur est déjà gérée dans la méthode register
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}