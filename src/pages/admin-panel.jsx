/**
 * Painel Administrativo - Versão JavaScript Vanilla
 * Corrigido para funcionar sem React
 */
import { DatabaseService } from '../services/database.js';

class AdminPanel {
    constructor() {
        this.dbService = new DatabaseService();
        this.bulkImportData = [];
        this.rawData = '';
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('🎛️ Inicializando Painel Administrativo');
        this.setupEventListeners();
        this.checkLogin();
    }

    checkLogin() {
        const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
        
        if (isLoggedIn) {
            this.showAdminPanel();
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const adminPanel = document.getElementById('adminPanel');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
    }

    showAdminPanel() {
        const loginScreen = document.getElementById('loginScreen');
        const adminPanel = document.getElementById('adminPanel');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        
        this.loadLeads();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Navigation buttons
        const showLeadsView = document.getElementById('showLeadsView');
        const showAddLeadView = document.getElementById('showAddLeadView');
        const showBulkAddView = document.getElementById('showBulkAddView');

        if (showLeadsView) {
            showLeadsView.addEventListener('click', () => this.showView('leadsView'));
        }
        if (showAddLeadView) {
            showAddLeadView.addEventListener('click', () => this.showView('addLeadView'));
        }
        if (showBulkAddView) {
            showBulkAddView.addEventListener('click', () => this.showView('bulkAddView'));
        }

        // Bulk import buttons
        const previewButton = document.getElementById('previewBulkDataButton');
        const clearButton = document.getElementById('clearBulkDataButton');
        const confirmButton = document.getElementById('confirmBulkImportButton');

        if (previewButton) {
            previewButton.addEventListener('click', () => this.handlePreview());
        }
        if (clearButton) {
            clearButton.addEventListener('click', () => this.handleClearData());
        }
        if (confirmButton) {
            confirmButton.addEventListener('click', () => this.handleConfirmImport());
        }

        // Refresh button
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.loadLeads());
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Credenciais simples para acesso
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('admin_logged_in', 'true');
            this.showAdminPanel();
        } else {
            alert('Credenciais inválidas');
        }
    }

    handleLogout() {
        localStorage.removeItem('admin_logged_in');
        this.showLoginScreen();
    }

    showView(viewId) {
        // Hide all views
        const views = document.querySelectorAll('.admin-view');
        views.forEach(view => view.style.display = 'none');
        
        // Remove active class from all nav buttons
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        // Show selected view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
        }
        
        // Add active class to corresponding nav button
        const navButton = document.querySelector(`[id*="${viewId.replace('View', '')}"]`);
        if (navButton) {
            navButton.classList.add('active');
        }
    }

    async loadLeads() {
        try {
            const result = await this.dbService.getAllLeads();
            
            if (result.success) {
                this.displayLeads(result.data);
                this.updateStats(result.data);
            } else {
                console.error('Erro ao carregar leads:', result.error);
            }
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
        }
    }

    displayLeads(leads) {
        const tbody = document.getElementById('leadsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (!tbody) return;
        
        if (leads.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td><input type="checkbox" data-lead-id="${lead.id}"></td>
                <td>${lead.nome_completo || 'N/A'}</td>
                <td>${this.formatCPF(lead.cpf)}</td>
                <td>${lead.email || 'N/A'}</td>
                <td>${lead.telefone || 'N/A'}</td>
                <td>${this.getProductName(lead.produtos)}</td>
                <td>R$ ${(lead.valor_total || 0).toFixed(2)}</td>
                <td>${this.formatDate(lead.created_at)}</td>
                <td><span class="stage-badge">${lead.etapa_atual || 1}</span></td>
                <td><span class="status-indicator ${lead.status_pagamento || 'pendente'}">${lead.status_pagamento || 'pendente'}</span></td>
                <td>${this.formatDate(lead.updated_at)}</td>
                <td>
                    <div class="lead-actions">
                        <button class="action-button edit" onclick="adminPanel.editLead('${lead.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-button delete" onclick="adminPanel.deleteLead('${lead.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateStats(leads) {
        const leadsCount = document.getElementById('leadsCount');
        const paidCount = document.getElementById('paidCount');
        const pendingCount = document.getElementById('pendingCount');
        
        if (leadsCount) leadsCount.textContent = leads.length;
        if (paidCount) paidCount.textContent = leads.filter(l => l.status_pagamento === 'pago').length;
        if (pendingCount) pendingCount.textContent = leads.filter(l => l.status_pagamento === 'pendente').length;
    }

    handlePreview() {
        console.log('👁️ Gerando preview dos dados...');
        
        const textarea = document.getElementById('bulkDataTextarea');
        if (!textarea) {
            console.error('Textarea não encontrada');
            return;
        }
        
        this.rawData = textarea.value;
        const parsed = this.parseRawBulkData(this.rawData);
        
        console.log('📊 Dados parseados:', parsed.length, 'leads');
        
        this.bulkImportData = parsed;
        this.displayPreview(parsed);
    }

    parseRawBulkData(rawText) {
        if (!rawText || rawText.trim() === '') {
            return [];
        }

        const lines = rawText.trim().split('\n');
        const parsedData = [];

        lines.forEach((line, index) => {
            if (line.trim() === '') return;

            const columns = line.split('\t');
            
            if (columns.length >= 6) {
                const leadData = {
                    nome_completo: columns[0]?.trim() || '',
                    email: columns[1]?.trim() || '',
                    telefone: columns[2]?.trim() || '',
                    cpf: columns[3]?.replace(/[^\d]/g, '') || '',
                    produtos: [{ nome: columns[4]?.trim() || 'Kit 12 caixas organizadoras + brinde' }],
                    valor_total: parseFloat(columns[5]) || 67.90,
                    endereco: columns[6]?.trim() || '',
                    origem: 'direto',
                    etapa_atual: 1,
                    status_pagamento: 'pendente',
                    data_compra: new Date().toISOString()
                };

                // Validate required fields
                if (leadData.nome_completo && leadData.cpf && leadData.cpf.length === 11) {
                    parsedData.push(leadData);
                } else {
                    console.warn(`Linha ${index + 1} ignorada - dados incompletos:`, leadData);
                }
            }
        });

        return parsedData;
    }

    displayPreview(data) {
        const previewSection = document.getElementById('bulkPreviewSection');
        const previewContainer = document.getElementById('bulkPreviewContainer');
        const previewSummary = document.getElementById('previewSummary');
        const confirmButton = document.getElementById('confirmBulkImportButton');
        
        if (!previewSection || !previewContainer) {
            console.error('Elementos de preview não encontrados');
            return;
        }
        
        if (data.length === 0) {
            previewSection.style.display = 'none';
            return;
        }
        
        // Show preview section
        previewSection.style.display = 'block';
        
        // Create table
        previewContainer.innerHTML = `
            <table class="bulk-import-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>CPF</th>
                        <th>Produto</th>
                        <th>Valor</th>
                        <th>Endereço</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.nome_completo}</td>
                            <td>${item.email}</td>
                            <td>${item.telefone}</td>
                            <td>${item.cpf}</td>
                            <td>${item.produtos[0]?.nome}</td>
                            <td>R$ ${item.valor_total.toFixed(2)}</td>
                            <td>${item.endereco}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Update summary
        if (previewSummary) {
            previewSummary.textContent = `${data.length} leads prontos para importação`;
        }
        
        // Show confirm button
        if (confirmButton) {
            confirmButton.style.display = 'block';
        }
        
        console.log('✅ Preview exibido com', data.length, 'leads');
    }

    async handleConfirmImport() {
        console.log('🚀 Iniciando confirmação de importação...');
        console.log('📊 Dados disponíveis para importação:', this.bulkImportData.length);
        
        if (!this.bulkImportData || this.bulkImportData.length === 0) {
            alert('Nenhum dado para importar. Faça a pré-visualização primeiro.');
            return;
        }

        if (this.isLoading) {
            console.log('⚠️ Importação já em andamento');
            return;
        }

        this.isLoading = true;
        this.updateConfirmButton(true);

        try {
            const results = await this.confirmBulkImport(this.bulkImportData);
            
            if (results.success > 0) {
                alert(`Importação concluída! ${results.success} leads importados com sucesso.${results.errors > 0 ? ` ${results.errors} erros encontrados.` : ''}`);
                
                // Clear data after successful import
                this.bulkImportData = [];
                this.rawData = '';
                this.clearForm();
                this.loadLeads(); // Refresh leads list
            } else {
                alert('Nenhum lead foi importado. Verifique os dados e tente novamente.');
            }
            
        } catch (error) {
            console.error('❌ Erro na importação:', error);
            alert(`Falha na importação: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.updateConfirmButton(false);
        }
    }

    async confirmBulkImport(importData) {
        if (!importData || importData.length === 0) {
            throw new Error('Nenhum dado para importar');
        }

        console.log('📦 Iniciando importação em massa:', importData.length, 'leads');
        
        const results = {
            success: 0,
            errors: 0,
            details: []
        };

        for (const leadData of importData) {
            try {
                console.log('💾 Importando lead:', leadData.nome_completo);
                
                const result = await this.dbService.createLead(leadData);
                
                if (result.success) {
                    results.success++;
                    console.log('✅ Lead importado:', leadData.nome_completo);
                } else {
                    results.errors++;
                    results.details.push({
                        nome: leadData.nome_completo,
                        erro: result.error
                    });
                    console.error('❌ Erro ao importar lead:', leadData.nome_completo, result.error);
                }
            } catch (error) {
                results.errors++;
                results.details.push({
                    nome: leadData.nome_completo,
                    erro: error.message
                });
                console.error('❌ Erro ao importar lead:', leadData.nome_completo, error.message);
            }
        }

        console.log('📊 Resultado da importação:', results);
        return results;
    }

    updateConfirmButton(loading) {
        const confirmButton = document.getElementById('confirmBulkImportButton');
        if (!confirmButton) return;
        
        if (loading) {
            confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
            confirmButton.disabled = true;
            confirmButton.style.background = '#6c757d';
        } else {
            confirmButton.innerHTML = '<i class="fas fa-database"></i> Confirmar Importação para Supabase';
            confirmButton.disabled = false;
            confirmButton.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
        }
    }

    handleClearData() {
        const textarea = document.getElementById('bulkDataTextarea');
        const previewSection = document.getElementById('bulkPreviewSection');
        
        if (textarea) textarea.value = '';
        if (previewSection) previewSection.style.display = 'none';
        
        this.bulkImportData = [];
        this.rawData = '';
        
        console.log('🧹 Dados limpos');
    }

    clearForm() {
        const textarea = document.getElementById('bulkDataTextarea');
        const previewSection = document.getElementById('bulkPreviewSection');
        
        if (textarea) textarea.value = '';
        if (previewSection) previewSection.style.display = 'none';
    }

    formatCPF(cpf) {
        if (!cpf) return 'N/A';
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    getProductName(produtos) {
        if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            return 'Kit 12 caixas organizadoras + brinde';
        }
        return produtos[0].nome || 'Kit 12 caixas organizadoras + brinde';
    }
}

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Export for module compatibility
export default AdminPanel;