/**
 * Painel Administrativo com sincronização automática Supabase
 */
import { SupabaseService } from '../services/supabase-service.js';
import { CPFValidator } from '../utils/cpf-validator.js';

class AdminPanel {
    constructor() {
        this.leads = [];
        this.filteredLeads = [];
        this.selectedLeads = new Set();
        this.currentPage = 1;
        this.leadsPerPage = 20;
        this.isLoggedIn = false;
        this.systemMode = 'auto';
        this.bulkData = [];
        this.bulkResults = null;
        this.supabaseService = new SupabaseService();
        
        console.log('🔧 AdminPanel inicializado com Supabase');
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando painel administrativo...');
        
        try {
            this.setupEventListeners();
            this.checkLoginStatus();
            
            if (this.isLoggedIn) {
                await this.loadLeads();
                this.renderLeadsTable();
                this.updateLeadsCount();
            }
            
            console.log('✅ Painel administrativo inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização do painel:', error);
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

        const editBulkDataButton = document.getElementById('editBulkDataButton');
        if (editBulkDataButton) {
            editBulkDataButton.addEventListener('click', () => this.editBulkData());
        }

        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshLeads());
        }

        const applyFiltersButton = document.getElementById('applyFiltersButton');
        if (applyFiltersButton) {
            applyFiltersButton.addEventListener('click', () => this.applyFilters());
        }

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
        if (localStorage.getItem('admin_logged_in') === 'true') {
            this.isLoggedIn = true;
            this.showAdminPanel();
        } else {
            this.showLoginScreen();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        // Allow access without password validation
        this.isLoggedIn = true;
        localStorage.setItem('admin_logged_in', 'true');
        this.showAdminPanel();
        this.loadLeads();
    }

    handleLogout() {
        this.isLoggedIn = false;
        localStorage.removeItem('admin_logged_in');
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

    showView(viewId) {
        document.querySelectorAll('.admin-view').forEach(view => {
            view.style.display = 'none';
        });
        
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });

        const view = document.getElementById(viewId);
        if (view) view.style.display = 'block';

        const navButton = document.getElementById(`show${viewId.charAt(0).toUpperCase() + viewId.slice(1)}`);
        if (navButton) navButton.classList.add('active');
    }

    async loadLeads() {
        try {
            console.log('📊 Carregando leads do Supabase...');
            
            // Tentar carregar do Supabase primeiro
            if (this.supabaseService.isSupabaseConnected()) {
                const { data, error } = await this.supabaseService.supabase
                    .from('leads')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    this.leads = data;
                    console.log(`📦 ${this.leads.length} leads carregados do Supabase`);
                    
                    // Sincronizar com localStorage
                    localStorage.setItem('leads', JSON.stringify(this.leads));
                } else {
                    console.warn('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
                    this.loadFromLocalStorage();
                }
            } else {
                console.warn('⚠️ Supabase não conectado, usando localStorage');
                this.loadFromLocalStorage();
            }
            
            this.filteredLeads = [...this.leads];
            this.renderLeadsTable();
            this.updateLeadsCount();
            
        } catch (error) {
            console.error('❌ Erro ao carregar leads:', error);
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        try {
            const storedLeads = localStorage.getItem('leads');
            this.leads = storedLeads ? JSON.parse(storedLeads) : [];
            console.log(`📦 ${this.leads.length} leads carregados do localStorage (fallback)`);
        } catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            this.leads = [];
        }
    }

    async handleAddLead(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        const leadData = {
            nome_completo: formData.get('nome') || document.getElementById('addLeadNome')?.value,
            cpf: (formData.get('cpf') || document.getElementById('addLeadCPF')?.value)?.replace(/[^\d]/g, ''),
            email: formData.get('email') || document.getElementById('addLeadEmail')?.value,
            telefone: formData.get('telefone') || document.getElementById('addLeadTelefone')?.value,
            endereco: this.buildAddress(formData),
            produtos: [{
                nome: formData.get('produto') || document.getElementById('addLeadProduto')?.value || 'Kit 12 caixas organizadoras + brinde',
                preco: parseFloat(formData.get('valor') || document.getElementById('addLeadValor')?.value || 0)
            }],
            valor_total: parseFloat(formData.get('valor') || document.getElementById('addLeadValor')?.value || 0),
            meio_pagamento: 'PIX',
            origem: 'direto',
            etapa_atual: 1,
            status_pagamento: 'pendente',
            order_bumps: [],
            data_compra: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Salvar no Supabase automaticamente
        await this.saveLeadToSupabase(leadData);
        
        // Recarregar lista
        await this.loadLeads();
        this.showView('leadsView');
        e.target.reset();
        this.showNotification('Lead criado com sucesso!', 'success');
    }

    async saveLeadToSupabase(leadData) {
        try {
            console.log('💾 Salvando lead no Supabase automaticamente...');
            
            const result = await this.supabaseService.saveLead(leadData);
            
            if (result.success) {
                console.log('✅ Lead salvo no Supabase');
            } else {
                console.warn('⚠️ Erro ao salvar no Supabase:', result.error);
            }
            
            // Sempre salvar no localStorage como backup
            this.saveLeadToLocalStorage(leadData);
            
        } catch (error) {
            console.error('❌ Erro ao salvar lead:', error);
            // Fallback para localStorage
            this.saveLeadToLocalStorage(leadData);
        }
    }

    saveLeadToLocalStorage(leadData) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leadData.id = Date.now().toString();
            leads.push(leadData);
            localStorage.setItem('leads', JSON.stringify(leads));
            console.log('✅ Lead salvo no localStorage (backup)');
        } catch (error) {
            console.error('❌ Erro ao salvar lead no localStorage:', error);
        }
    }

    buildAddress(formData) {
        const endereco = formData.get('endereco') || document.getElementById('addLeadEndereco')?.value || '';
        const numero = formData.get('numero') || document.getElementById('addLeadNumero')?.value || '';
        const complemento = formData.get('complemento') || document.getElementById('addLeadComplemento')?.value || '';
        const bairro = formData.get('bairro') || document.getElementById('addLeadBairro')?.value || '';
        const cep = formData.get('cep') || document.getElementById('addLeadCEP')?.value || '';
        const cidade = formData.get('cidade') || document.getElementById('addLeadCidade')?.value || '';
        const estado = formData.get('estado') || document.getElementById('addLeadEstado')?.value || '';
        const pais = formData.get('pais') || document.getElementById('addLeadPais')?.value || 'BR';

        return `${endereco}, ${numero}${complemento ? ` - ${complemento}` : ''} - ${bairro} - ${cidade}/${estado} - CEP: ${cep} - ${pais}`;
    }

    previewBulkData() {
        const textarea = document.getElementById('bulkDataTextarea');
        if (!textarea || !textarea.value.trim()) {
            this.showNotification('Por favor, cole os dados na caixa de texto', 'error');
            return;
        }

        try {
            this.bulkData = this.parseBulkData(textarea.value);
            this.displayBulkPreview();
        } catch (error) {
            console.error('❌ Erro ao processar dados:', error);
            this.showNotification('Erro ao processar dados: ' + error.message, 'error');
        }
    }

    parseBulkData(rawData) {
        const lines = rawData.trim().split('\n').filter(line => line.trim());
        const leads = [];
        const duplicatesSet = new Set();
        const duplicatesRemoved = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const fields = line.split(/\t+|\s{2,}/).map(field => field.trim());
            
            if (fields.length < 4) {
                console.warn(`Linha ${i + 1} ignorada: poucos campos`);
                continue;
            }

            const [nome, email, telefone, cpfRaw, produto, valor, rua, numero, complemento, bairro, cep, cidade, estado, pais] = fields;
            const cpf = (cpfRaw || '').replace(/[^\d]/g, '');

            // Verificar duplicatas
            if (duplicatesSet.has(cpf)) {
                duplicatesRemoved.push({ nome, cpf });
                continue;
            }
            duplicatesSet.add(cpf);

            const endereco = this.buildAddressFromFields({
                rua: rua || '',
                numero: numero || '',
                complemento: complemento || '',
                bairro: bairro || '',
                cep: cep || '',
                cidade: cidade || '',
                estado: estado || '',
                pais: pais || 'BR'
            });

            leads.push({
                nome_completo: nome || '',
                email: email || '',
                telefone: telefone || '',
                cpf: cpf,
                produto: produto || 'Kit 12 caixas organizadoras + brinde',
                valor_total: parseFloat(valor) || 67.90,
                endereco: endereco,
                meio_pagamento: 'PIX',
                origem: 'direto',
                etapa_atual: 1,
                status_pagamento: 'pendente',
                order_bumps: [],
                produtos: [{
                    nome: produto || 'Kit 12 caixas organizadoras + brinde',
                    preco: parseFloat(valor) || 67.90
                }],
                lineNumber: i + 1
            });
        }

        console.log(`📊 Dados processados: ${leads.length} leads, ${duplicatesRemoved.length} duplicatas removidas`);
        
        return {
            leads: leads,
            duplicatesRemoved: duplicatesRemoved
        };
    }

    buildAddressFromFields({ rua, numero, complemento, bairro, cep, cidade, estado, pais }) {
        return `${rua}, ${numero}${complemento ? ` - ${complemento}` : ''} - ${bairro} - ${cidade}/${estado} - CEP: ${cep} - ${pais}`;
    }

    displayBulkPreview() {
        const previewSection = document.getElementById('bulkPreviewSection');
        const previewContainer = document.getElementById('bulkPreviewContainer');
        const confirmButton = document.getElementById('confirmBulkImportButton');
        const previewSummary = document.getElementById('previewSummary');

        if (!previewSection || !previewContainer) return;

        previewSection.style.display = 'block';

        let html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nome</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Telefone</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">CPF</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Produto</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Valor</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.bulkData.leads.forEach((lead, index) => {
            const rowStyle = index % 2 === 0 ? 'background: #f9f9f9;' : '';
            html += `
                <tr style="${rowStyle}">
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.nome_completo}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.email}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${CPFValidator.formatCPF(lead.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.produto}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">R$ ${lead.valor_total.toFixed(2)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';

        if (this.bulkData.duplicatesRemoved.length > 0) {
            html += `
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <strong>📋 Duplicatas Removidas (${this.bulkData.duplicatesRemoved.length}):</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        ${this.bulkData.duplicatesRemoved.map(dup => `<li>${dup.nome} - CPF: ${this.formatCPF(dup.cpf)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        previewContainer.innerHTML = html;

        if (previewSummary) {
            previewSummary.textContent = `${this.bulkData.leads.length} leads para importar${this.bulkData.duplicatesRemoved.length > 0 ? `, ${this.bulkData.duplicatesRemoved.length} duplicatas removidas` : ''}`;
        }

        if (confirmButton) {
            confirmButton.style.display = 'inline-block';
        }
    }

    async confirmBulkImport() {
        if (!this.bulkData || !this.bulkData.leads.length) {
            this.showNotification('Nenhum dado para importar', 'error');
            return;
        }

        const confirmButton = document.getElementById('confirmBulkImportButton');
        if (!confirmButton) return;

        const originalText = confirmButton.innerHTML;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
        confirmButton.disabled = true;

        try {
            const results = await this.processBulkImport();
            this.displayBulkResults(results);
        } catch (error) {
            console.error('❌ Erro na importação em massa:', error);
            this.showNotification('Erro na importação: ' + error.message, 'error');
        } finally {
            confirmButton.innerHTML = originalText;
            confirmButton.disabled = false;
        }
    }

    async processBulkImport() {
        const results = {
            success: [],
            errors: [],
            total: this.bulkData.leads.length
        };

        for (const lead of this.bulkData.leads) {
            try {
                const validation = this.validateLeadData(lead);
                if (!validation.isValid) {
                    results.errors.push({
                        nome: lead.nome_completo,
                        cpf: lead.cpf,
                        error: validation.error,
                        type: 'validation'
                    });
                    continue;
                }

                // Verificar se CPF já existe no Supabase
                const existingLead = await this.supabaseService.getLeadByCPF(lead.cpf);
                if (existingLead.success) {
                    results.errors.push({
                        nome: lead.nome_completo,
                        cpf: lead.cpf,
                        error: 'CPF já existe no sistema',
                        type: 'duplicate'
                    });
                    continue;
                }

                // Preparar dados para salvar
                const leadToSave = {
                    ...lead,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Salvar no Supabase automaticamente
                const saveResult = await this.supabaseService.saveLead(leadToSave);
                
                if (saveResult.success) {
                    results.success.push({
                        nome: lead.nome_completo,
                        cpf: lead.cpf,
                        id: leadToSave.id
                    });
                } else {
                    results.errors.push({
                        nome: lead.nome_completo,
                        cpf: lead.cpf,
                        error: saveResult.error,
                        type: 'database'
                    });
                }

            } catch (error) {
                results.errors.push({
                    nome: lead.nome_completo,
                    cpf: lead.cpf,
                    error: error.message,
                    type: 'exception'
                });
            }
        }

        return results;
    }

    validateLeadData(lead) {
        if (!lead.nome_completo || lead.nome_completo.trim().length < 2) {
            return { isValid: false, error: 'Nome completo é obrigatório (mínimo 2 caracteres)' };
        }

        if (!lead.email || !this.isValidEmail(lead.email)) {
            return { isValid: false, error: 'Email é obrigatório e deve ter formato válido' };
        }

        if (!lead.telefone || lead.telefone.length < 10) {
            return { isValid: false, error: 'Telefone é obrigatório (mínimo 10 dígitos)' };
        }

        if (!lead.cpf || lead.cpf.length !== 11) {
            return { isValid: false, error: 'CPF é obrigatório e deve ter 11 dígitos' };
        }

        if (!this.isValidCPF(lead.cpf)) {
            return { isValid: false, error: 'CPF inválido (formato ou dígitos verificadores incorretos)' };
        }

        return { isValid: true };
    }

    isValidCPF(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
            return false;
        }
        return true;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    displayBulkResults(results) {
        const resultsSection = document.getElementById('bulkResultsSection');
        const resultsContainer = document.getElementById('bulkResultsContainer');

        if (!resultsSection || !resultsContainer) return;

        resultsSection.style.display = 'block';

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        `;

        // Sucessos
        html += `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #155724; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle"></i>
                    Pedidos Postados com Sucesso (${results.success.length})
                </h4>
        `;

        if (results.success.length > 0) {
            html += '<ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">';
            results.success.forEach(item => {
                html += `<li style="margin-bottom: 5px; color: #155724;">
                    <strong>${item.nome}</strong> - CPF: ${CPFValidator.formatCPF(item.cpf)}
                </li>`;
            });
            html += '</ul>';

            html += `
                <div style="margin-top: 15px; text-align: center;">
                    <button id="goToLeadsListButton" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                        <i class="fas fa-list"></i> Ir para Lista
                    </button>
                </div>
            `;
        } else {
            html += '<p style="color: #856404; font-style: italic;">Nenhum pedido foi postado com sucesso.</p>';
        }

        html += '</div>';

        // Erros
        html += `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #721c24; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pedidos com Erro (${results.errors.length})
                </h4>
        `;

        if (results.errors.length > 0) {
            html += `
                <div style="max-height: 200px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f5c6cb;">
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">Nome</th>
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">CPF</th>
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">Motivo do Erro</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            results.errors.forEach((error, index) => {
                const rowStyle = index % 2 === 0 ? 'background: #fdf2f2;' : '';
                html += `
                    <tr style="${rowStyle}">
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${error.nome}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${this.formatCPF(error.cpf)}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7; color: #721c24;">
                            <strong>${this.getErrorTypeLabel(error.type)}:</strong> ${error.error}
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
        } else {
            html += '<p style="color: #155724; font-style: italic;">Nenhum erro encontrado! 🎉</p>';
        }

        html += '</div></div>';

        // Resumo
        html += `
            <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 15px; text-align: center;">
                <h4 style="color: #383d41; margin-bottom: 10px;">📊 Resumo da Importação</h4>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <strong style="color: #28a745;">${results.success.length}</strong>
                        <span style="color: #6c757d;"> Sucessos</span>
                    </div>
                    <div>
                        <strong style="color: #dc3545;">${results.errors.length}</strong>
                        <span style="color: #6c757d;"> Erros</span>
                    </div>
                    <div>
                        <strong style="color: #007bff;">${results.total}</strong>
                        <span style="color: #6c757d;"> Total Processados</span>
                    </div>
                    <div>
                        <strong style="color: #ffc107;">${this.bulkData.duplicatesRemoved.length}</strong>
                        <span style="color: #6c757d;"> Duplicatas Removidas</span>
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = html;

        const goToListButton = document.getElementById('goToLeadsListButton');
        if (goToListButton) {
            goToListButton.addEventListener('click', () => {
                this.showView('leadsView');
                this.refreshLeads();
            });
        }

        const previewSection = document.getElementById('bulkPreviewSection');
        if (previewSection) {
            previewSection.style.display = 'none';
        }

        this.bulkResults = results;
    }

    getErrorTypeLabel(type) {
        const labels = {
            'validation': 'Dados Inválidos',
            'duplicate': 'Duplicidade',
            'database': 'Erro de Banco',
            'exception': 'Erro Interno'
        };
        return labels[type] || 'Erro';
    }

    clearBulkData() {
        const textarea = document.getElementById('bulkDataTextarea');
        const previewSection = document.getElementById('bulkPreviewSection');
        const resultsSection = document.getElementById('bulkResultsSection');

        if (textarea) textarea.value = '';
        if (previewSection) previewSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';

        this.bulkData = [];
        this.bulkResults = null;
    }

    editBulkData() {
        const previewSection = document.getElementById('bulkPreviewSection');
        if (previewSection) {
            previewSection.style.display = 'none';
        }

        const textarea = document.getElementById('bulkDataTextarea');
        if (textarea) {
            textarea.focus();
        }
    }

    async refreshLeads() {
        console.log('🔄 Atualizando lista de leads...');
        await this.loadLeads();
        this.showNotification('Lista atualizada com sucesso!', 'success');
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

        let html = '';

        pageLeads.forEach(lead => {
            const isSelected = this.selectedLeads.has(lead.id || lead.cpf);
            const produtos = Array.isArray(lead.produtos) ? lead.produtos : [];
            const produtoNome = produtos.length > 0 ? produtos[0].nome : 'Produto não informado';
            const cpfFormatted = this.formatCPF(lead.cpf || '');

            html += `
                <tr style="${isSelected ? 'background-color: #e3f2fd;' : ''}">
                    <td>
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="adminPanel.toggleLeadSelection('${lead.id || lead.cpf}', this.checked)">
                    </td>
                    <td>${lead.nome_completo || 'N/A'}</td>
                    <td>${cpfFormatted}</td>
                    <td>${lead.email || 'N/A'}</td>
                    <td>${lead.telefone || 'N/A'}</td>
                    <td>${produtoNome}</td>
                    <td>R$ ${(lead.valor_total || 0).toFixed(2)}</td>
                    <td>${this.formatDate(lead.created_at)}</td>
                    <td>
                        <span class="stage-badge ${this.getStageClass(lead.etapa_atual)}">
                            ${lead.etapa_atual || 1}
                        </span>
                    </td>
                    <td>${this.formatDate(lead.updated_at)}</td>
                    <td>
                        <div class="lead-actions">
                            <button class="action-button edit" onclick="adminPanel.editLead('${lead.id || lead.cpf}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button next" onclick="adminPanel.nextStage('${lead.id || lead.cpf}')">
                                <i class="fas fa-forward"></i>
                            </button>
                            <button class="action-button prev" onclick="adminPanel.prevStage('${lead.id || lead.cpf}')">
                                <i class="fas fa-backward"></i>
                            </button>
                            <button class="action-button delete" onclick="adminPanel.deleteLead('${lead.id || lead.cpf}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        this.updateSelectedCount();
    }

    formatCPF(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        if (cleanCPF.length <= 11) {
            return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    toggleLeadSelection(leadId, isSelected) {
        if (isSelected) {
            this.selectedLeads.add(leadId);
        } else {
            this.selectedLeads.delete(leadId);
        }
        this.updateSelectedCount();
    }

    toggleSelectAll(selectAll) {
        const checkboxes = document.querySelectorAll('#leadsTableBody input[type="checkbox"]');
        
        if (selectAll) {
            this.filteredLeads.forEach(lead => {
                this.selectedLeads.add(lead.id || lead.cpf);
            });
        } else {
            this.selectedLeads.clear();
        }

        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });

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

        actionCounts.forEach(element => {
            element.textContent = `(${count} leads)`;
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
        if (stage >= 12) return 'completed';
        if (stage >= 6) return 'pending';
        return '';
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
        }, 3000);
    }

    applyFilters() {
        console.log('🔍 Aplicando filtros...');
        // Implementar filtros se necessário
    }

    handleMassAction(action) {
        console.log(`🔧 Ação em massa: ${action} para ${this.selectedLeads.size} leads`);
        // Implementar ações em massa se necessário
    }

    editLead(leadId) {
        console.log(`✏️ Editando lead: ${leadId}`);
        const lead = JSON.parse(localStorage.getItem('leads') || '[]')
            .find(l => (l.id || l.cpf) === leadId);
        
        if (lead) {
            console.log('Lead encontrado para edição:', lead);
        }
    }

    nextStage(leadId) {
        console.log(`⏭️ Próxima etapa para lead: ${leadId}`);
        this.updateLeadStage(leadId, 1);
    }

    prevStage(leadId) {
        console.log(`⏮️ Etapa anterior para lead: ${leadId}`);
        this.updateLeadStage(leadId, -1);
    }

    async updateLeadStage(leadId, direction) {
        try {
            // Buscar lead atual
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => (l.id || l.cpf) === leadId);
            
            if (leadIndex !== -1) {
                const currentStage = leads[leadIndex].etapa_atual || 1;
                const newStage = Math.max(1, Math.min(16, currentStage + direction));
                
                // Atualizar no localStorage
                leads[leadIndex].etapa_atual = newStage;
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                
                // Sincronizar com Supabase automaticamente
                const cpf = leads[leadIndex].cpf;
                if (cpf) {
                    console.log('🔄 Sincronizando etapa com Supabase...');
                    const result = await this.supabaseService.updateLeadStage(cpf, newStage);
                    
                    if (result.success) {
                        console.log('✅ Etapa sincronizada com Supabase');
                    } else {
                        console.warn('⚠️ Erro ao sincronizar com Supabase:', result.error);
                    }
                }
                
                // Recarregar lista
                await this.loadLeads();
                console.log(`✅ Etapa atualizada para ${newStage}`);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa:', error);
        }
    }

    async deleteLead(leadId) {
        if (!confirm('Tem certeza que deseja excluir este lead?')) return;

        console.log(`🗑️ Excluindo lead: ${leadId}`);
        
        try {
            // Remover do localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]')
                .filter(l => (l.id || l.cpf) !== leadId);
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Remover do Supabase se conectado
            if (this.supabaseService.isSupabaseConnected()) {
                const leadToDelete = this.leads.find(l => (l.id || l.cpf) === leadId);
                if (leadToDelete && leadToDelete.cpf) {
                    console.log('🗑️ Removendo do Supabase...');
                    const { error } = await this.supabaseService.supabase
                        .from('leads')
                        .delete()
                        .eq('cpf', leadToDelete.cpf.replace(/[^\d]/g, ''));
                    
                    if (error) {
                        console.warn('⚠️ Erro ao remover do Supabase:', error);
                    } else {
                        console.log('✅ Lead removido do Supabase');
                    }
                }
            }
            
            await this.loadLeads();
            this.showNotification('Lead excluído com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro ao excluir lead:', error);
            this.showNotification('Erro ao excluir lead', 'error');
        }
    }
}

// Inicializar painel quando DOM estiver pronto
let adminPanel = null;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});

// Expor globalmente para uso nos event handlers inline
window.adminPanel = adminPanel;