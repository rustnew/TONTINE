class ChartManager {
    constructor() {
        this.charts = new Map();
    }

    renderContributionsChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Détruire le graphique existant
        if (this.charts.has(canvasId)) {
            this.charts.get(canvasId).destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => Utils.formatDate(d.date)),
                datasets: [{
                    label: 'Cotisations',
                    data: data.map(d => d.amount),
                    borderColor: 'var(--primary-orange)',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
    }
}