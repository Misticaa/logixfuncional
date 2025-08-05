/**
 * Painel Administrativo - VERSÃO 16.9: COMANDO CENTRAL
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
        
        console.log('🎯 AdminPanel inicializado - COMANDO CENTRAL');
        console.log('🗄️ Fonte de dados: EXCLUSIVAMENTE Supabase');
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando painel de comando central...');
        
        try {
            this.setupEventListeners();
            this.checkLoginStatus();
            
            if (this.isLoggedIn) {
                await this.loadLeadsFromSupabase();
                this.renderLeadsTable();
                this.updateLeadsCount();
                await this.testSupabaseConnection();
            }
            
            console.log('✅ Painel de comando central inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização do painel:', error);
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

    async handleAddLead(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leadData = {
            nome_completo: formData.get('nome'),
            cpf: formData.get('cpf').replace(/[^\d]/g, ''),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            endereco: this.buildAddress(formData),
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

    buildAddress(formData) {
        const endereco = formData.get('endereco') || '';
        const numero = formData.get('numero') || '';
        const complemento = formData.get('complemento') || '';
        const bairro = formData.get('bairro') || '';
        const cep = formData.get('cep') || '';
        const cidade = formData.get('cidade') || '';
        const estado = formData.get('estado') || '';
        const pais = formData.get('pais') || 'BR';
        
        return `${endereco}, ${numero}${complemento ? ` - ${complemento}` : ''} - ${bairro} - ${cidade}/${estado} - CEP: ${cep} - ${pais}`;
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        switch (type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            default:
                notification.style.background = '#007bff';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    applyFilters() {
        console.log('🔍 Aplicando filtros...');
        
        const searchInput = document.getElementById('searchInput');
        const dateFilter = document.getElementById('dateFilter');
        const stageFilter = document.getElementById('stageFilter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const dateValue = dateFilter ? dateFilter.value : '';
        const stageValue = stageFilter ? stageFilter.value : 'all';
        
        this.filteredLeads = this.leads.filter(lead => {
            // Filtro de busca
            if (searchTerm) {
                const nameMatch = (lead.nome_completo || '').toLowerCase().includes(searchTerm);
                const cpfMatch = (lead.cpf || '').replace(/[^\d]/g, '').includes(searchTerm.replace(/[^\d]/g, ''));
                if (!nameMatch && !cpfMatch) return false;
            }
            
            // Filtro de data
            if (dateValue) {
                const leadDate = new Date(lead.created_at);
                const filterDate = new Date(dateValue);
                if (leadDate.toDateString() !== filterDate.toDateString()) return false;
            }
            
            // Filtro de etapa
            if (stageValue !== 'all') {
                if ((lead.etapa_atual || 1).toString() !== stageValue) return false;
            }
            
            return true;
        });

        this.currentPage = 1;
        this.renderLeadsTable();
        this.updateLeadsCount();
        this.showNotification(`Filtros aplicados: ${this.filteredLeads.length} leads encontrados`, 'info');
    }
}

// Inicializar painel quando DOM estiver pronto
let adminPanel = null;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    window.adminPanel = adminPanel; // Expor globalmente para onclick handlers
});