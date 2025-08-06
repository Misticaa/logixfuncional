/**
 * Painel Administrativo - VERSÃO 17.0: COMANDO CENTRAL
 * O painel é o diretor que controla tudo via Supabase
 */
import { DatabaseService, CPFValidator } from '../services/database.js';

export class AdminPanel {
    constructor() {
        this.dbService = new DatabaseService();
        this.leads = [];
        this.filteredLeads = [];
        this.selectedLeads = new Set();
        this.currentPage = 1;
        this.leadsPerPage = 20;
        this.isLoggedIn = false;
        this.editingLead = null;
        this.isSyncing = false;
        this.stageCount = {};
        this.stageCountData = {};
        
        console.log('🎯 AdminPanel inicializado - VERSÃO 17.0 COMANDO CENTRAL');
        console.log('🗄️ Fonte de dados: EXCLUSIVAMENTE Supabase');
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando painel de comando central...');
        
        try {
            this.setupEventListeners();
            this.checkLoginStatus();
            
            if (this.isLoggedIn) {
                // Configurar eventos de busca inteligente
                this.setupSmartSearch();
                
                // Configurar filtros de data
                this.setupDateFilters();
                
                await this.loadLeadsFromSupabase();
                await this.loadStageCountData();
                this.renderLeadsTable();
                this.updateLeadsCount();
                await this.loadStageCount();
                await this.testSupabaseConnection();
                this.setupSystemReload();
            }
            
            console.log('✅ Painel de comando central inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização do painel:', error);
        }
    }

    setupSmartSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Se for números, aplicar máscara de CPF
                if (/^\d+$/.test(value.replace(/[^\d]/g, ''))) {
                    const cleanValue = value.replace(/[^\d]/g, '');
                    if (cleanValue.length <= 11) {
                        e.target.value = this.applyCPFMask(cleanValue);
                    }
                }
            });
        }
    }

    applyCPFMask(value) {
        if (value.length > 9) {
            return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            return value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            return value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
        return value;
    }

    setupDateFilters() {
        const startDateInput = document.getElementById('dateFilter');
        const endDateInput = document.getElementById('dateFilterEnd');
        
        if (startDateInput && endDateInput) {
            // Configurar data de hoje como padrão
            const today = new Date().toISOString().split('T')[0];
            startDateInput.value = today;
        }
    }

    async testSupabaseConnection() {
        console.log('🔍 Testando conexão com Supabase...');
        
        const result = await this.dbService.testConnection();
        
        if (result.success) {
            this.showNotification('✅ Conexão com Supabase estabelecida', 'success');
            console.log('✅ Supabase conectado e funcionando');
        } else {
            this.showNotification('❌ Erro na conexão com Supabase: ' + result.error, 'error');
            console.error('❌ Falha na conexão com Supabase:', result.error);
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        const showLeadsView = document.getElementById('showLeadsView');
        if (showLeadsView) {
            showLeadsView.addEventListener('click', () => this.showView('leadsView'));
        }

        const showAddLeadView = document.getElementById('showAddLeadView');
        if (showAddLeadView) {
            showAddLeadView.addEventListener('click', () => this.showView('addLeadView'));
        }

        const showBulkAddView = document.getElementById('showBulkAddView');
        if (showBulkAddView) {
            showBulkAddView.addEventListener('click', () => this.showView('bulkAddView'));
        }

        const addLeadForm = document.getElementById('addLeadForm');
        if (addLeadForm) {
            addLeadForm.addEventListener('submit', (e) => this.handleAddLead(e));
        }

        const syncSupabaseButton = document.getElementById('syncSupabaseButton');
        if (syncSupabaseButton) {
            syncSupabaseButton.addEventListener('click', () => this.forceSyncWithSupabase());
        }

        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshLeads());
        }

        const applyFiltersButton = document.getElementById('applyFiltersButton');
        if (applyFiltersButton) {
            applyFiltersButton.addEventListener('click', () => this.applyFilters());
        }

        // Ações em massa
        const massNextStage = document.getElementById('massNextStage');
        if (massNextStage) {
            massNextStage.addEventListener('click', () => this.handleMassAction('nextStage'));
        }

        const massPrevStage = document.getElementById('massPrevStage');
        if (massPrevStage) {
            massPrevStage.addEventListener('click', () => this.handleMassAction('prevStage'));
        }

        const massSetStage = document.getElementById('massSetStage');
        if (massSetStage) {
            massSetStage.addEventListener('click', () => this.handleMassAction('setStage'));
        }

        const massDeleteLeads = document.getElementById('massDeleteLeads');
        if (massDeleteLeads) {
            massDeleteLeads.addEventListener('click', () => this.handleMassAction('delete'));
        }

        // Botões Avançar/Voltar Todos
        const advanceAllButton = document.getElementById('advanceAllLeads');
        if (advanceAllButton) {
            advanceAllButton.addEventListener('click', () => this.handleAdvanceAll());
        }

        const regressAllButton = document.getElementById('regressAllLeads');
        if (regressAllButton) {
            regressAllButton.addEventListener('click', () => this.handleRegressAll());
        }

        // Importação em massa
        const previewBulkDataButton = document.getElementById('previewBulkDataButton');
        if (previewBulkDataButton) {
            previewBulkDataButton.addEventListener('click', () => this.previewBulkData());
        }

        const clearBulkDataButton = document.getElementById('clearBulkDataButton');
        if (clearBulkDataButton) {
            clearBulkDataButton.addEventListener('click', () => this.clearBulkData());
        }

        const confirmBulkImportButton = document.getElementById('confirmBulkImportButton');
        if (confirmBulkImportButton) {
            confirmBulkImportButton.addEventListener('click', () => this.confirmBulkImport());
        }

        // Campo de busca com máscara automática
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        }

        document.getElementById('reloadTransportadoraButton')?.addEventListener('click', () => {
            this.reloadTransportadoraSystem();
        });
    }

    checkLoginStatus() {
        const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
        
        if (isLoggedIn) {
            this.isLoggedIn = true;
            this.showAdminPanel();
        } else {
            this.showLoginScreen();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        this.isLoggedIn = true;
        sessionStorage.setItem('admin_logged_in', 'true');
        this.showAdminPanel();
        this.loadLeadsFromSupabase();
        this.populateStageFilter();
    }

    handleLogout() {
        this.isLoggedIn = false;
        sessionStorage.removeItem('admin_logged_in');
        this.showLoginScreen();
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
        
        this.showView('leadsView');
    }

    showView(viewName) {
        document.querySelectorAll('.admin-view').forEach(view => {
            view.style.display = 'none';
        });
        
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });

        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.style.display = 'block';
        }

        const targetButton = document.getElementById(`show${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }

    async loadLeadsFromSupabase() {
        try {
            console.log('📊 Carregando leads do Supabase...');
            this.showLoadingIndicator();
            
            const result = await this.dbService.getAllLeads();
            
            if (result.success) {
                this.leads = result.data || [];
                this.filteredLeads = [...this.leads];
                await this.loadStageCount();
                await this.loadStageCountData();
                console.log(`📦 ${this.leads.length} leads carregados do Supabase`);
                
                this.renderLeadsTable();
                this.updateLeadsCount();
                this.showNotification(`${this.leads.length} leads carregados do Supabase`, 'success');
            } else {
                console.error('❌ Erro ao carregar leads do Supabase:', result.error);
                this.leads = [];
                this.filteredLeads = [];
                this.showNotification('Erro ao carregar leads: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar leads:', error);
            this.leads = [];
            this.filteredLeads = [];
            this.showNotification('Erro ao carregar leads: ' + error.message, 'error');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async loadStageCount() {
        try {
            const result = await this.dbService.getLeadsByStage();
            
            if (result.success) {
                this.stageCount = result.data;
                this.updateStageCountDisplay();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar contagem por etapa:', error);
        }
    }

    async loadStageCountData() {
        try {
            const result = await this.dbService.getLeadsByStage();
            
            if (result.success) {
                this.stageCountData = result.data;
                this.updateStageCountDisplay();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar contagem por etapa:', error);
        }
    }

    updateStageCountDisplay() {
        const container = document.getElementById('stageCountContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Criar contadores para todas as 29 etapas
        for (let i = 1; i <= 29; i++) {
            const count = this.stageCountData[i] || 0;
            
            const stageItem = document.createElement('div');
            stageItem.className = 'stage-count-item';
            stageItem.innerHTML = `
                <span class="stage-number">Etapa ${i}</span>
                <span class="stage-count">${count}</span>
            `;
            
            container.appendChild(stageItem);
        }
    }

    updateStageCounters(stageData) {
        const container = document.getElementById('stageCountContainer');
        if (!container) return;

        container.innerHTML = '';

        // Criar contadores para cada etapa (1-26)
        for (let stage = 1; stage <= 26; stage++) {
            const count = stageData[stage] || 0;
            
            const stageItem = document.createElement('div');
            stageItem.className = 'stage-count-item';
            stageItem.innerHTML = `
                <span class="stage-number">Etapa ${stage}</span>
                <span class="stage-count">${count}</span>
            `;
            
            // Adicionar evento de clique para filtrar por etapa
            stageItem.addEventListener('click', () => {
                this.filterByStage(stage);
            });
            
            container.appendChild(stageItem);
        }

        console.log('✅ Contadores de etapa atualizados');
    }

    filterByStage(stage) {
        const stageFilter = document.getElementById('stageFilter');
        if (stageFilter) {
            stageFilter.value = stage;
            this.applyFilters();
        }
    }

    async handleAddLead(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leadData = {
            nome_completo: formData.get('nome'),
            cpf: formData.get('cpf').replace(/[^\d]/g, ''),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            endereco: formData.get('endereco'),
            produtos: [{
                nome: formData.get('produto') || 'Kit 12 caixas organizadoras + brinde',
                preco: parseFloat(formData.get('valor') || 0)
            }],
            valor_total: parseFloat(formData.get('valor') || 0),
            meio_pagamento: 'PIX',
            origem: 'direto',
            etapa_atual: 1,
            status_pagamento: 'pendente',
            order_bumps: [],
            data_compra: new Date().toISOString()
        };

        console.log('📝 Criando lead via painel (comando central):', leadData);
        
        try {
            const result = await this.dbService.createLead(leadData);
            
            if (result.success) {
                console.log('✅ Lead criado no Supabase via painel');
                await this.loadLeadsFromSupabase(); // Recarregar da fonte oficial
                this.showView('leadsView');
                e.target.reset();
                this.showNotification('Lead criado com sucesso no Supabase!', 'success');
            } else {
                console.error('❌ Erro ao criar lead:', result.error);
                this.showNotification('Erro ao criar lead: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar lead:', error);
            this.showNotification('Erro ao criar lead: ' + error.message, 'error');
        }
    }

    async handleAdvanceAll() {
        if (this.filteredLeads.length === 0) {
            this.showNotification('Nenhum lead para avançar', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja AVANÇAR todos os ${this.filteredLeads.length} leads exibidos para a próxima etapa?`)) return;

        try {
            console.log(`📈 Avançando todos os ${this.filteredLeads.length} leads...`);
            
            let updatedCount = 0;
            
            for (const lead of this.filteredLeads) {
                const currentStage = lead.etapa_atual || 1;
                const newStage = Math.min(26, currentStage + 1);
                
                const result = await this.dbService.updateLead(lead.id, {
                    etapa_atual: newStage
                });
                
                if (result.success) {
                    updatedCount++;
                }
            }
            
            await this.loadLeadsFromSupabase();
            this.showNotification(`${updatedCount} leads avançados com sucesso!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao avançar todos os leads:', error);
            this.showNotification('Erro ao avançar leads: ' + error.message, 'error');
        }
    }

    async handleRegressAll() {
        if (this.filteredLeads.length === 0) {
            this.showNotification('Nenhum lead para retroceder', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja RETROCEDER todos os ${this.filteredLeads.length} leads exibidos para a etapa anterior?`)) return;

        try {
            console.log(`📉 Retrocedendo todos os ${this.filteredLeads.length} leads...`);
            
            let updatedCount = 0;
            
            for (const lead of this.filteredLeads) {
                const currentStage = lead.etapa_atual || 1;
                const newStage = Math.max(1, currentStage - 1);
                
                const result = await this.dbService.updateLead(lead.id, {
                    etapa_atual: newStage
                });
                
                if (result.success) {
                    updatedCount++;
                }
            }
            
            await this.loadLeadsFromSupabase();
            this.showNotification(`${updatedCount} leads retrocedidos com sucesso!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao retroceder todos os leads:', error);
            this.showNotification('Erro ao retroceder leads: ' + error.message, 'error');
        }
    }

    async advanceAllLeads() {
        if (this.filteredLeads.length === 0) {
            alert('Nenhum lead selecionado para avançar');
            return;
        }
        
        const confirmation = confirm(`Tem certeza que deseja avançar TODOS os ${this.filteredLeads.length} leads para a próxima etapa?`);
        if (!confirmation) return;
        
        console.log(`📈 Avançando ${this.filteredLeads.length} leads...`);
        
        try {
            for (const lead of this.filteredLeads) {
                const nextStage = Math.min(lead.etapa_atual + 1, 29);
                await this.dbService.updateLead(lead.id, { etapa_atual: nextStage });
                console.log(`✅ Lead ${lead.nome_completo} avançado para etapa ${nextStage}`);
            }
            
            alert(`✅ ${this.filteredLeads.length} leads avançados com sucesso!`);
            await this.loadLeadsFromSupabase();
            
        } catch (error) {
            console.error('❌ Erro ao avançar leads:', error);
            alert('Erro ao avançar leads: ' + error.message);
        }
    }

    async regressAllLeads() {
        if (this.filteredLeads.length === 0) {
            alert('Nenhum lead selecionado para retroceder');
            return;
        }
        
        const confirmation = confirm(`Tem certeza que deseja retroceder TODOS os ${this.filteredLeads.length} leads para a etapa anterior?`);
        if (!confirmation) return;
        
        console.log(`📉 Retrocedendo ${this.filteredLeads.length} leads...`);
        
        try {
            for (const lead of this.filteredLeads) {
                const prevStage = Math.max(lead.etapa_atual - 1, 1);
                await this.dbService.updateLead(lead.id, { etapa_atual: prevStage });
                console.log(`✅ Lead ${lead.nome_completo} retrocedido para etapa ${prevStage}`);
            }
            
            alert(`✅ ${this.filteredLeads.length} leads retrocedidos com sucesso!`);
            await this.loadLeadsFromSupabase();
            
        } catch (error) {
            console.error('❌ Erro ao retroceder leads:', error);
            alert('Erro ao retroceder leads: ' + error.message);
        }
    }

    async forceSyncWithSupabase() {
        if (this.isSyncing) {
            this.showNotification('Sincronização já em andamento...', 'info');
            return;
        }

        console.log('🔄 Forçando sincronização com Supabase...');
        this.isSyncing = true;
        
        const syncButton = document.getElementById('syncSupabaseButton');
        if (syncButton) {
            const originalText = syncButton.innerHTML;
            syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
            syncButton.disabled = true;
        }

        try {
            // Recarregar todos os dados do Supabase
            await this.loadLeadsFromSupabase();
            
            console.log('✅ Sincronização forçada concluída');
            this.showNotification('Sincronização com Supabase concluída!', 'success');
            
        } catch (error) {
            console.error('❌ Erro na sincronização forçada:', error);
            this.showNotification('Erro na sincronização: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
            
            if (syncButton) {
                syncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar com Supabase';
                syncButton.disabled = false;
            }
        }
    }

    async refreshLeads() {
        console.log('🔄 Atualizando lista de leads do Supabase...');
        await this.loadLeadsFromSupabase();
    }

    renderLeadsTable() {
        const tableBody = document.getElementById('leadsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (!tableBody) return;

        if (this.filteredLeads.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        const startIndex = (this.currentPage - 1) * this.leadsPerPage;
        const endIndex = startIndex + this.leadsPerPage;
        const pageLeads = this.filteredLeads.slice(startIndex, endIndex);

        let tableHTML = '';
        
        pageLeads.forEach(lead => {
            const isSelected = this.selectedLeads.has(lead.id);
            const products = Array.isArray(lead.produtos) ? lead.produtos : [];
            const productName = products.length > 0 ? products[0].nome : 'Produto não informado';
            const formattedCPF = CPFValidator.formatCPF(lead.cpf || '');
            
            tableHTML += `
                <tr style="${isSelected ? 'background-color: #e3f2fd;' : ''}">
                    <td>
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="adminPanel.toggleLeadSelection('${lead.id}', this.checked)">
                    </td>
                    <td>${lead.nome_completo || 'N/A'}</td>
                    <td>${formattedCPF}</td>
                    <td>${lead.email || 'N/A'}</td>
                    <td>${lead.telefone || 'N/A'}</td>
                    <td>${productName}</td>
                    <td>R$ ${(lead.valor_total || 0).toFixed(2)}</td>
                    <td>${this.formatDate(lead.created_at)}</td>
                    <td>
                        <span class="stage-badge ${this.getStageClass(lead.etapa_atual)}">
                            ${lead.etapa_atual || 1}
                        </span>
                    </td>
                    <td>
                        <span class="status-indicator ${lead.status_pagamento || 'pending'}">
                            ${this.getStatusLabel(lead.status_pagamento)}
                        </span>
                    </td>
                    <td>${this.formatDate(lead.updated_at)}</td>
                    <td>
                        <div class="lead-actions">
                            <button class="action-button edit" onclick="adminPanel.editLead('${lead.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button next" onclick="adminPanel.nextStage('${lead.id}')">
                                <i class="fas fa-forward"></i>
                            </button>
                            <button class="action-button prev" onclick="adminPanel.prevStage('${lead.id}')">
                                <i class="fas fa-backward"></i>
                            </button>
                            <button class="action-button delete" onclick="adminPanel.deleteLead('${lead.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
        this.updateSelectedCount();
    }

    getStatusLabel(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'pago': 'Pago',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || 'Pendente';
    }

    async nextStage(leadId) {
        console.log(`⏭️ Avançando etapa para lead: ${leadId}`);
        await this.updateLeadStageInSupabase(leadId, 1);
    }

    async prevStage(leadId) {
        console.log(`⏮️ Retrocedendo etapa para lead: ${leadId}`);
        await this.updateLeadStageInSupabase(leadId, -1);
    }

    async updateLeadStageInSupabase(leadId, direction) {
        try {
            const lead = this.leads.find(l => l.id === leadId);
            if (!lead) {
                this.showNotification('Lead não encontrado', 'error');
                return;
            }

            const currentStage = lead.etapa_atual || 1;
            const newStage = Math.max(1, Math.min(26, currentStage + direction));
            
            console.log(`📊 Atualizando etapa no Supabase: ${currentStage} → ${newStage}`);
            
            const result = await this.dbService.updateLead(leadId, {
                etapa_atual: newStage
            });

            if (result.success) {
                console.log('✅ Etapa atualizada no Supabase via painel');
                await this.loadLeadsFromSupabase(); // Recarregar da fonte oficial
                
                const action = direction > 0 ? 'avançada' : 'retrocedida';
                this.showNotification(`Etapa ${action} com sucesso! Nova etapa: ${newStage}`, 'success');
            } else {
                console.error('❌ Erro ao atualizar etapa:', result.error);
                this.showNotification('Erro ao atualizar etapa: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa:', error);
            this.showNotification('Erro ao atualizar etapa: ' + error.message, 'error');
        }
    }

    async deleteLead(leadId) {
        if (!confirm('Tem certeza que deseja excluir este lead do Supabase?')) return;
        
        console.log(`🗑️ Excluindo lead do Supabase: ${leadId}`);
        
        try {
            const result = await this.dbService.deleteLead(leadId);
            
            if (result.success) {
                console.log('✅ Lead excluído do Supabase via painel');
                await this.loadLeadsFromSupabase(); // Recarregar da fonte oficial
                this.showNotification('Lead excluído com sucesso do Supabase!', 'success');
            } else {
                console.error('❌ Erro ao excluir lead:', result.error);
                this.showNotification('Erro ao excluir lead: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir lead:', error);
            this.showNotification('Erro ao excluir lead: ' + error.message, 'error');
        }
    }

    async editLead(leadId) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) {
            this.showNotification('Lead não encontrado', 'error');
            return;
        }

        // Criar modal de edição
        this.showEditModal(lead);
    }

    showEditModal(lead) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'editLeadModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 2px solid #1e4a6b;
            ">
                <div style="
                    background: linear-gradient(135deg, #1e4a6b, #2c5f8a);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 10px 10px 0 0;
                ">
                    <h3 style="margin: 0; font-size: 1.3rem; font-weight: 700;">
                        <i class="fas fa-edit"></i> Editar Lead
                    </h3>
                    <button id="closeEditModal" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 5px;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 30px;">
                    <form id="editLeadForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label>Nome Completo:</label>
                                <input type="text" name="nome" value="${lead.nome_completo || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>CPF:</label>
                                <input type="text" name="cpf" value="${CPFValidator.formatCPF(lead.cpf || '')}" required maxlength="14">
                            </div>
                            <div class="form-group">
                                <label>Email:</label>
                                <input type="email" name="email" value="${lead.email || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Telefone:</label>
                                <input type="tel" name="telefone" value="${lead.telefone || ''}" required>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label>Endereço:</label>
                                <input type="text" name="endereco" value="${lead.endereco || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Valor (R$):</label>
                                <input type="number" name="valor" step="0.01" value="${lead.valor_total || 67.90}" required>
                            </div>
                            <div class="form-group">
                                <label>Etapa:</label>
                                <select name="etapa" required>
                                    ${this.generateStageOptions(lead.etapa_atual || 1)}
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" id="cancelEditButton" style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 12px 25px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                            ">
                                Cancelar
                            </button>
                            <button type="submit" style="
                                background: linear-gradient(45deg, #1e4a6b, #2c5f8a);
                                color: white;
                                border: none;
                                padding: 12px 25px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                            ">
                                <i class="fas fa-save"></i> Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Configurar eventos
        this.setupEditModalEvents(modal, lead);
    }

    generateStageOptions(currentStage) {
        let options = '';
        for (let i = 1; i <= 26; i++) {
            const selected = i === currentStage ? 'selected' : '';
            options += `<option value="${i}" ${selected}>Etapa ${i}</option>`;
        }
        return options;
    }

    setupEditModalEvents(modal, lead) {
        const closeButton = modal.querySelector('#closeEditModal');
        const cancelButton = modal.querySelector('#cancelEditButton');
        const form = modal.querySelector('#editLeadForm');

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        };

        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditSubmit(e, lead.id);
            closeModal();
        });
    }

    async handleEditSubmit(e, leadId) {
        const formData = new FormData(e.target);
        const updateData = {
            nome_completo: formData.get('nome'),
            cpf: formData.get('cpf').replace(/[^\d]/g, ''),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            endereco: formData.get('endereco'),
            valor_total: parseFloat(formData.get('valor')),
            etapa_atual: parseInt(formData.get('etapa'))
        };

        try {
            const result = await this.dbService.updateLead(leadId, updateData);
            
            if (result.success) {
                await this.loadLeadsFromSupabase();
                this.showNotification('Lead atualizado com sucesso!', 'success');
            } else {
                this.showNotification('Erro ao atualizar lead: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Erro ao atualizar lead: ' + error.message, 'error');
        }
    }

    handleSearchInput(e) {
        const value = e.target.value;
        
        // Se contém apenas números, aplicar máscara de CPF
        if (/^\d+$/.test(value.replace(/[^\d]/g, ''))) {
            CPFValidator.applyCPFMask(e.target);
        }
    }

    formatCPF(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    previewBulkData() {
        const textarea = document.getElementById('bulkDataTextarea');
        const previewSection = document.getElementById('bulkPreviewSection');
        const previewContainer = document.getElementById('bulkPreviewContainer');
        const previewSummary = document.getElementById('previewSummary');
        const confirmButton = document.getElementById('confirmBulkImportButton');
        
        if (!textarea || !previewSection) return;
        
        const data = textarea.value.trim();
        if (!data) {
            this.showNotification('Cole os dados para visualizar', 'error');
            return;
        }
        
        // Processar dados
        const lines = data.split('\n').filter(line => line.trim());
        const processedData = [];
        
        console.log('📊 Processando', lines.length, 'linhas para preview');
        
        lines.forEach((line, index) => {
            const columns = line.split('\t');
            if (columns.length >= 14) { // 14 colunas conforme especificado
                processedData.push({
                    nome: columns[0]?.trim() || '',
                    email: columns[1]?.trim() || '',
                    telefone: columns[2]?.trim() || '',
                    cpf: columns[3]?.trim() || '',
                    produto: columns[4]?.trim() || '',
                    valor: parseFloat(columns[5]) || 67.90,
                    endereco: columns[6]?.trim() || '',
                    numero: columns[7]?.trim() || '',
                    complemento: columns[8]?.trim() || '',
                    bairro: columns[9]?.trim() || '',
                    cep: columns[10]?.trim() || '',
                    cidade: columns[11]?.trim() || '',
                    estado: columns[12]?.trim() || '',
                    pais: columns[13]?.trim() || 'BR'
                });
            }
        });
        
        if (processedData.length === 0) {
            this.showNotification('Nenhum dado válido encontrado', 'error');
            return;
        }
        
        // Criar tabela de preview
        const table = document.createElement('table');
        table.className = 'bulk-import-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>CPF</th>
                    <th>Produto</th>
                    <th>Valor</th>
                    <th>Endereço</th>
                    <th>Número</th>
                    <th>Complemento</th>
                    <th>Bairro</th>
                    <th>CEP</th>
                    <th>Cidade</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${processedData.map(line => `
                    <tr>
                        <td>${line.nome}</td>
                        <td>${line.email}</td>
                        <td>${line.telefone}</td>
                        <td>${line.cpf}</td>
                        <td>${line.produto}</td>
                        <td>R$ ${line.valor.toFixed(2)}</td>
                        <td>${line.endereco}</td>
                        <td>${line.numero}</td>
                        <td>${line.complemento}</td>
                        <td>${line.bairro}</td>
                        <td>${line.cep}</td>
                        <td>${line.cidade}</td>
                        <td>${line.estado}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        previewContainer.innerHTML = '';
        previewContainer.appendChild(table);
        previewSection.style.display = 'block';
        
        // Mostrar resumo
        const summary = document.getElementById('previewSummary');
        if (summary) {
            summary.textContent = `${processedData.length} leads válidos encontrados para importação`;
        }
        
        // Mostrar botão de confirmação
        const confirmButton2 = document.getElementById('confirmBulkImportButton');
        if (confirmButton2) {
            confirmButton2.style.display = 'block';
            confirmButton2.onclick = () => this.confirmBulkImport(processedData);
        }
        
        // Salvar dados processados para importação
        this.bulkDataToImport = processedData;
    }

    buildCompleteAddress(item) {
        let endereco = item.endereco || '';
        if (item.numero) endereco += `, ${item.numero}`;
        if (item.complemento) endereco += ` - ${item.complemento}`;
        if (item.bairro) endereco += ` - ${item.bairro}`;
        if (item.cidade) endereco += ` - ${item.cidade}`;
        if (item.estado) endereco += `/${item.estado}`;
        if (item.cep) endereco += ` - CEP: ${item.cep}`;
        if (item.pais && item.pais !== 'BR') endereco += ` - ${item.pais}`;
        
        return endereco;
    }

    clearBulkData() {
        const textarea = document.getElementById('bulkDataTextarea');
        const previewSection = document.getElementById('bulkPreviewSection');
        
        if (textarea) textarea.value = '';
        if (previewSection) previewSection.style.display = 'none';
        
        this.bulkDataToImport = null;
    }

    async confirmBulkImport(validLines) {
        if (!validLines || validLines.length === 0) {
            this.showNotification('Nenhum dado para importar', 'error');
            return;
        }

        if (!confirm(`Confirma a importação de ${validLines.length} leads para o Supabase?`)) return;

        try {
            console.log(`📥 Importando ${validLines.length} leads em massa...`);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const line of validLines) {
                // Montar endereço completo
                const enderecoCompleto = [
                    line.endereco,
                    line.numero,
                    line.complemento,
                    line.bairro,
                    line.cidade,
                    line.estado,
                    line.cep
                ].filter(part => part && part.trim()).join(', ');
                
                const leadData = {
                    nome_completo: line.nome,
                    cpf: line.cpf.replace(/[^\d]/g, ''),
                    email: line.email,
                    telefone: line.telefone,
                    endereco: enderecoCompleto,
                    produtos: [{ nome: line.produto, preco: line.valor }],
                    valor_total: line.valor,
                    meio_pagamento: 'PIX',
                    origem: 'painel',
                    etapa_atual: 1,
                    status_pagamento: 'pendente'
                };
                
                try {
                    const result = await this.dbService.createLead(leadData);
                    if (result.success) {
                        successCount++;
                        console.log(`✅ Lead importado: ${line.nome}`);
                    } else {
                        errorCount++;
                        console.error(`❌ Erro ao importar lead: ${line.nome}`, result.error);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Erro ao importar lead: ${line.nome}`, error);
                }
            }
            
            alert(`Importação concluída!\n✅ Sucessos: ${successCount}\n❌ Erros: ${errorCount}`);
            
            if (successCount > 0) {
                await this.loadLeadsFromSupabase();
                this.showView('leadsView');
            }
            
        } catch (error) {
            console.error('❌ Erro na importação em massa:', error);
            this.showNotification('Erro na importação: ' + error.message, 'error');
        }
    }

    async handleMassAction(action) {
        if (this.selectedLeads.size === 0) {
            this.showNotification('Nenhum lead selecionado', 'error');
            return;
        }

        console.log(`🔧 Ação em massa no Supabase: ${action} para ${this.selectedLeads.size} leads`);

        const selectedIds = Array.from(this.selectedLeads);
        
        switch (action) {
            case 'nextStage':
                await this.massUpdateStages(selectedIds, 1);
                break;
            case 'prevStage':
                await this.massUpdateStages(selectedIds, -1);
                break;
            case 'setStage':
                await this.massSetStage(selectedIds);
                break;
            case 'delete':
                await this.massDeleteLeads(selectedIds);
                break;
        }
    }

    async massUpdateStages(leadIds, direction) {
        const action = direction > 0 ? 'avançar' : 'retroceder';
        
        if (!confirm(`Tem certeza que deseja ${action} ${leadIds.length} lead(s) no Supabase?`)) return;

        try {
            console.log(`📊 Atualizando etapas em massa no Supabase (${action})...`);
            
            // Atualizar cada lead individualmente para calcular nova etapa
            let updatedCount = 0;
            
            for (const leadId of leadIds) {
                const lead = this.leads.find(l => l.id === leadId);
                if (lead) {
                    const currentStage = lead.etapa_atual || 1;
                    const newStage = Math.max(1, Math.min(26, currentStage + direction));
                    
                    const result = await this.dbService.updateLead(leadId, {
                        etapa_atual: newStage
                    });
                    
                    if (result.success) {
                        updatedCount++;
                    }
                }
            }
            
            this.selectedLeads.clear();
            await this.loadLeadsFromSupabase(); // Recarregar da fonte oficial
            
            this.showNotification(`${updatedCount} lead(s) ${action === 'avançar' ? 'avançados' : 'retrocedidos'} no Supabase!`, 'success');
            console.log(`✅ ${updatedCount} leads atualizados no Supabase`);
            
        } catch (error) {
            console.error(`❌ Erro ao ${action} leads:`, error);
            this.showNotification(`Erro ao ${action} leads: ` + error.message, 'error');
        }
    }

    async massSetStage(leadIds) {
        const stageInput = prompt(`Digite a etapa desejada (1-26) para ${leadIds.length} lead(s):`);
        if (!stageInput) return;

        const newStage = parseInt(stageInput);
        if (isNaN(newStage) || newStage < 1 || newStage > 26) {
            this.showNotification('Etapa inválida. Digite um número entre 1 e 26.', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja definir a etapa ${newStage} para ${leadIds.length} lead(s) no Supabase?`)) return;

        try {
            console.log(`📊 Definindo etapa ${newStage} em massa no Supabase...`);
            
            const result = await this.dbService.bulkUpdateLeads(leadIds, {
                etapa_atual: newStage
            });

            if (result.success) {
                this.selectedLeads.clear();
                await this.loadLeadsFromSupabase(); // Recarregar da fonte oficial
                this.showNotification(`${result.data.length} lead(s) definidos para etapa ${newStage} no Supabase!`, 'success');
                console.log(`✅ ${result.data.length} leads atualizados no Supabase`);
            } else {
                console.error('❌ Erro ao definir etapa:', result.error);
                this.showNotification('Erro ao definir etapa: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao definir etapa:', error);
            this.showNotification('Erro ao definir etapa: ' + error.message, 'error');
        }
    }

    async massDeleteLeads(leadIds) {
        if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR ${leadIds.length} lead(s) do Supabase?\n\nEsta ação não pode ser desfeita!`)) return;

        try {
            console.log(`🗑️ Excluindo ${leadIds.length} leads do Supabase...`);
            
            let deletedCount = 0;
            
            for (const leadId of leadIds) {
                const result = await this.dbService.deleteLead(leadId);
                if (result.success) {
                    deletedCount++;
                }
            }
            
            this.selectedLeads.clear();
            await this.loadLeadsFromSupabase(); // Recarregar da fonte oficial
            
            this.showNotification(`${deletedCount} lead(s) excluído(s) do Supabase!`, 'success');
            console.log(`✅ ${deletedCount} leads excluídos do Supabase`);
            
        } catch (error) {
            console.error('❌ Erro ao excluir leads:', error);
            this.showNotification('Erro ao excluir leads: ' + error.message, 'error');
        }
    }

    toggleLeadSelection(leadId, isSelected) {
        if (isSelected) {
            this.selectedLeads.add(leadId);
        } else {
            this.selectedLeads.delete(leadId);
        }
        this.updateSelectedCount();
    }

    toggleSelectAll(isChecked) {
        if (isChecked) {
            // Select all visible leads
            this.filteredLeads.forEach(lead => {
                this.selectedLeads.add(lead.id);
            });
        } else {
            // Clear all selections
            this.selectedLeads.clear();
        }
        this.renderLeadsTable();
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const selectedCount = document.getElementById('selectedCount');
        const massActionButtons = document.querySelectorAll('.mass-action-button');
        const actionCounts = document.querySelectorAll('.action-count');
        const count = this.selectedLeads.size;

        if (selectedCount) {
            selectedCount.textContent = `${count} selecionados`;
        }

        massActionButtons.forEach(button => {
            button.disabled = count === 0;
            if (count === 0) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else {
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        });

        actionCounts.forEach(span => {
            span.textContent = `(${count} leads)`;
        });
    }

    updateLeadsCount() {
        const leadsCount = document.getElementById('leadsCount');
        if (leadsCount) {
            leadsCount.textContent = `${this.filteredLeads.length} leads`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
    }

    getStageClass(stage) {
        if (stage >= 26) return 'completed';
        if (stage >= 6) return 'pending';
        return '';
    }

    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'loadingIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            z-index: 3000;
            text-align: center;
            border: 2px solid #1e4a6b;
        `;
        
        indicator.innerHTML = `
            <div style="margin-bottom: 15px;">
                <i class="fas fa-database" style="font-size: 2rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <p style="margin: 0; color: #2c3e50; font-weight: 600;">
                Carregando dados do Supabase...
            </p>
        `;
        
        document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    setupSystemReload() {
        // Verificar conexão com Supabase a cada 30 segundos
        setInterval(async () => {
            const testResult = await this.dbService.testConnection();
            this.updateSupabaseStatus(testResult.success, testResult.error);
        }, 30000);
    }

    updateSupabaseStatus(message, isError = false) {
        const statusElement = document.getElementById('supabase-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = isError ? 'error' : 'success';
        }
    }

    async syncWithSupabase() {
        try {
            console.log('🔄 Sincronizando com Supabase...');
            
            // Atualizar status
            this.updateSupabaseStatus('Sincronizando...', 'connecting');
            
            // Buscar todos os leads
            const result = await this.dbService.getAllLeads();
            
            if (result.success) {
                this.allLeads = result.data;
                this.filteredLeads = [...this.allLeads];
                
                // Atualizar interface
                this.renderLeadsTable();
                this.updateStats();
                this.updateStageCounters();
                
                this.updateSupabaseStatus('Conectado e sincronizado', 'connected');
                console.log('✅ Sincronização com Supabase concluída');
                
                return { success: true, count: this.allLeads.length };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            this.updateSupabaseStatus(`Erro: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Método para atualizar estatísticas
    updateStats(leads) {
        // Update statistics counters
        const leadsCount = this.allLeads.length;
        const selectedCount = this.selectedLeads.size;
        const paidCount = this.allLeads.filter(lead => lead.status_pagamento === 'pago').length;
        const pendingCount = this.allLeads.filter(lead => lead.status_pagamento === 'pendente').length;

        this.updateElement('leadsCount', leadsCount);
        this.updateElement('selectedCount', `${selectedCount} selecionados`);
        this.updateElement('paidCount', paidCount);
        this.updateElement('pendingCount', pendingCount);

        console.log('📊 Estatísticas atualizadas:', {
            total: leadsCount,
            selected: selectedCount,
            paid: paidCount,
            pending: pendingCount
        });
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    async reloadTransportadoraSystem() {
        console.log('🔄 Iniciando recarregamento da transportadora...');
        
        const button = document.getElementById('reloadTransportadoraButton');
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recarregando...';
            button.disabled = true;
        }
        
        try {
            // Forçar reconexão com Supabase
            const reconnected = await this.dbService.forceReconnect();
            
            if (reconnected) {
                // Sincronizar dados
                await this.syncWithSupabase();
                
                // Notificar sucesso
                this.showNotification('Sistema da transportadora recarregado com sucesso!', 'success');
                
                console.log('✅ Transportadora recarregada com sucesso');
            } else {
                throw new Error('Falha na reconexão com Supabase');
            }
            
        } catch (error) {
            console.error('❌ Erro ao recarregar transportadora:', error);
            this.showNotification('Erro ao recarregar sistema da transportadora', 'error');
        } finally {
            if (button) {
                button.innerHTML = '<i class="fas fa-redo"></i> Reinicializar Sistema';
                button.disabled = false;
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
        const textColor = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: ${textColor};
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            animation: slideInRight 0.4s ease;
            max-width: 350px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
                <div>
                    <strong>${message}</strong>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => notification.remove(), 400);
            }
        }, 5000);
    }

    async applyFilters() {
        const searchInput = document.getElementById('searchInput');
        const dateFilterStart = document.getElementById('dateFilter');
        const dateFilterEnd = document.getElementById('dateFilterEnd');
        const stageFilter = document.getElementById('stageFilter')?.value || 'all';
        
        const searchTerm = searchInput?.value || '';
        const startDate = dateFilterStart?.value || '';
        const endDate = dateFilterEnd?.value || '';
        
        console.log('🔍 Aplicando filtros:', { searchTerm, startDate, endDate, stageFilter });
        
        try {
            let filteredData = [...this.leads];
            
            // Filtro de busca
            if (searchTerm) {
                const cleanSearchTerm = searchTerm.replace(/[^\d]/g, '');
                
                if (/^\d+$/.test(cleanSearchTerm) && cleanSearchTerm.length >= 3) {
                    // Busca por CPF
                    const searchResult = await this.dbService.searchLeads(cleanSearchTerm);
                    if (searchResult.success) {
                        filteredData = searchResult.data;
                    }
                } else {
                    // Busca por nome
                    const searchResult = await this.dbService.searchLeads(searchTerm);
                    if (searchResult.success) {
                        filteredData = searchResult.data;
                    }
                }
            }
            
            // Filtro de data
            if (startDate) {
                const startDateTime = new Date(startDate + 'T00:00:00').toISOString();
                let endDateTime = endDate ? new Date(endDate + 'T23:59:59').toISOString() : null;
                
                if (!endDateTime) {
                    // Se não há data fim, usar apenas o dia selecionado
                    endDateTime = new Date(startDate + 'T23:59:59').toISOString();
                }
                
                const dateResult = await this.dbService.getLeadsByDateRange(startDateTime, endDateTime);
                if (dateResult.success) {
                    // Intersecção com resultados anteriores
                    const dateLeadIds = new Set(dateResult.data.map(lead => lead.id));
                    filteredData = filteredData.filter(lead => dateLeadIds.has(lead.id));
                }
            }
            
            // Filtro de etapa
            if (stageFilter !== 'all') {
                const targetStage = parseInt(stageFilter);
                filteredData = filteredData.filter(lead => lead.etapa_atual === targetStage);
            }
            
            this.filteredLeads = filteredData;
            
        } catch (error) {
            console.error('❌ Erro ao aplicar filtros:', error);
            this.filteredLeads = this.leads;
        }
        
        this.renderLeadsTable();
        this.updateLeadsCount();
        
        console.log(`🔍 Filtros aplicados: ${this.filteredLeads.length} leads encontrados`);
    }

    async advanceLead(leadId) {
        console.log(`⏭️ Avançando lead: ${leadId}`);
        
        try {
            const lead = this.leads.find(l => l.id === leadId);
            if (lead) {
                const nextStage = Math.min(lead.etapa_atual + 1, 29);
                await this.dbService.updateLead(leadId, { etapa_atual: nextStage });
                console.log(`✅ Lead avançado para etapa ${nextStage}`);
                await this.loadLeadsFromSupabase();
            }
        } catch (error) {
            console.error('❌ Erro ao avançar lead:', error);
            alert('Erro ao avançar lead: ' + error.message);
        }
    }

    async regressLead(leadId) {
        console.log(`⏮️ Retrocedendo lead: ${leadId}`);
        
        try {
            const lead = this.leads.find(l => l.id === leadId);
            if (lead) {
                const prevStage = Math.max(lead.etapa_atual - 1, 1);
                await this.dbService.updateLead(leadId, { etapa_atual: prevStage });
                console.log(`✅ Lead retrocedido para etapa ${prevStage}`);
                await this.loadLeadsFromSupabase();
            }
        } catch (error) {
            console.error('❌ Erro ao retroceder lead:', error);
            alert('Erro ao retroceder lead: ' + error.message);
        }
    }

    updateStageFilter() {
        const stageFilter = document.getElementById('stageFilter');
        if (!stageFilter) return;
        
        // Limpar opções existentes (exceto "Todas")
        const allOption = stageFilter.querySelector('option[value="all"]');
        stageFilter.innerHTML = '';
        if (allOption) {
            stageFilter.appendChild(allOption);
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = 'all';
            defaultOption.textContent = 'Todas';
            stageFilter.appendChild(defaultOption);
        }
        
        // Adicionar todas as 29 etapas
        for (let i = 1; i <= 29; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Etapa ${i}`;
            stageFilter.appendChild(option);
        }
    }

    populateStageFilter() {
        const stageFilter = document.getElementById('stageFilter');
        if (!stageFilter) return;
        
        // Limpar opções existentes (exceto "Todas")
        const allOption = stageFilter.querySelector('option[value="all"]');
        stageFilter.innerHTML = '';
        if (allOption) {
            stageFilter.appendChild(allOption);
        } else {
            const option = document.createElement('option');
            option.value = 'all';
            option.textContent = 'Todas';
            stageFilter.appendChild(option);
        }
        
        // Adicionar todas as 29 etapas
        for (let i = 1; i <= 29; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = `Etapa ${i}`;
            stageFilter.appendChild(option);
        }
    }
}

// Inicializar painel quando DOM estiver pronto
let adminPanel = null;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    window.adminPanel = adminPanel; // Expor globalmente para onclick handlers
});