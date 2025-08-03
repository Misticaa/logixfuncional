/**
 * Painel Administrativo - Sistema de Gerenciamento de Leads
 */

import { CPFValidator } from '../utils/cpf-validator.js';
import { DatabaseService } from '../services/database.js';

class AdminPanel {
    constructor() {
        this.dbService = new DatabaseService();
        this.leads = [];
        this.filteredLeads = [];
        this.selectedLeads = new Set();
        this.currentPage = 1;
        this.leadsPerPage = 20;
        this.isLoggedIn = false;
        this.systemMode = 'auto';
        this.bulkData = [];
        this.bulkResults = null;
        this.editingLead = null;
        
        console.log('🔧 AdminPanel inicializado - Modo Local');
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando painel administrativo...');
        
        try {
            this.setupEventListeners();
            this.checkLoginStatus();
            
            if (this.isLoggedIn) {
                this.loadLeads();
                this.renderLeadsTable();
                this.updateLeadsCount();
            }
            
            console.log('✅ Painel administrativo inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização do painel:', error);
        }
    }

    setupEventListeners() {
        // Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
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

        // Add Lead Form
        const addLeadForm = document.getElementById('addLeadForm');
        if (addLeadForm) {
            addLeadForm.addEventListener('submit', (e) => this.handleAddLead(e));
        }

        // Bulk Import
        const previewButton = document.getElementById('previewBulkDataButton');
        if (previewButton) {
            previewButton.addEventListener('click', () => this.previewBulkData());
        }

        const clearButton = document.getElementById('clearBulkDataButton');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearBulkData());
        }

        const confirmButton = document.getElementById('confirmBulkImportButton');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => this.confirmBulkImport());
        }

        const editButton = document.getElementById('editBulkDataButton');
        if (editButton) {
            editButton.addEventListener('click', () => this.editBulkData());
        }

        // Controls
        let refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshLeads());
        }

        const applyFiltersButton = document.getElementById('applyFiltersButton');
        if (applyFiltersButton) {
            applyFiltersButton.addEventListener('click', () => this.applyFilters());
        }

        // Mass Actions
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

        // Botões de controle do sistema
        const nextAllButton = document.getElementById('nextAllButton');
        if (nextAllButton) {
            nextAllButton.addEventListener('click', () => this.handleSystemAction('nextAll'));
        }

        const prevAllButton = document.getElementById('prevAllButton');
        if (prevAllButton) {
            prevAllButton.addEventListener('click', () => this.handleSystemAction('prevAll'));
        }

        refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.handleSystemAction('refresh'));
        }

        const clearAllButton = document.getElementById('clearAllButton');
        if (clearAllButton) {
            clearAllButton.addEventListener('click', () => this.handleSystemAction('clearAll'));
        }

        // Edit Modal Events
        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => this.closeEditModal());
        }

        const cancelEdit = document.getElementById('cancelEdit');
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.closeEditModal());
        }

        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

    }

    checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
        
        if (isLoggedIn) {
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
        // Hide all views
        const views = document.querySelectorAll('.admin-view');
        views.forEach(view => {
            view.style.display = 'none';
        });

        // Remove active class from all nav buttons
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Add active class to corresponding nav button
        const activeButton = document.getElementById(`show${viewId.charAt(0).toUpperCase() + viewId.slice(1)}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    loadLeads() {
        try {
            console.log('📊 Carregando leads do localStorage...');
            const storedLeads = localStorage.getItem('leads');
            this.leads = storedLeads ? JSON.parse(storedLeads) : [];
            this.filteredLeads = [...this.leads];
            console.log(`📦 ${this.leads.length} leads carregados do localStorage`);
            this.renderLeadsTable();
            this.updateLeadsCount();
        } catch (error) {
            console.error('❌ Erro ao carregar leads do localStorage:', error);
            this.leads = [];
            this.filteredLeads = [];
            this.renderLeadsTable();
            this.updateLeadsCount();
        }
    }

    handleAddLead(e) {
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

        // Save to localStorage
        this.saveLeadToLocalStorage(leadData);
        this.loadLeads();
        this.showView('leadsView');
        e.target.reset();
        this.showNotification('Lead criado com sucesso!', 'success');
    }

    saveLeadToLocalStorage(leadData) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leadData.id = Date.now().toString();
            leads.push(leadData);
            localStorage.setItem('leads', JSON.stringify(leads));
            console.log('✅ Lead salvo no localStorage');
        } catch (error) {
            console.error('❌ Erro ao salvar lead:', error);
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

    // Bulk Import Methods
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
        const parsedData = [];
        const seenCPFs = new Set();
        const duplicatesRemoved = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by tabs or multiple spaces
            const fields = line.split(/\t+|\s{2,}/).map(field => field.trim());
            
            if (fields.length < 4) {
                console.warn(`Linha ${i + 1} ignorada: poucos campos`);
                continue;
            }

            const [nome, email, telefone, cpf, produto, valor, rua, numero, complemento, bairro, cep, cidade, estado, pais] = fields;
            
            // Clean CPF
            const cleanCPF = (cpf || '').replace(/[^\d]/g, '');
            
            // Check for internal duplicates
            if (seenCPFs.has(cleanCPF)) {
                duplicatesRemoved.push({ nome, cpf: cleanCPF });
                continue;
            }
            
            seenCPFs.add(cleanCPF);

            // Build address
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

            parsedData.push({
                nome_completo: nome || '',
                email: email || '',
                telefone: telefone || '',
                cpf: cleanCPF,
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

        console.log(`📊 Dados processados: ${parsedData.length} leads, ${duplicatesRemoved.length} duplicatas removidas`);
        
        return {
            leads: parsedData,
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

        // Create preview table
        let tableHTML = `
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
            const rowClass = index % 2 === 0 ? 'background: #f9f9f9;' : '';
            tableHTML += `
                <tr style="${rowClass}">
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.nome_completo}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.email}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${CPFValidator.formatCPF(lead.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.produto}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">R$ ${lead.valor_total.toFixed(2)}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';

        // Add duplicates info if any
        if (this.bulkData.duplicatesRemoved.length > 0) {
            tableHTML += `
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <strong>📋 Duplicatas Removidas (${this.bulkData.duplicatesRemoved.length}):</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        ${this.bulkData.duplicatesRemoved.map(dup => 
                            `<li>${dup.nome} - CPF: ${this.formatCPF(dup.cpf)}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }

        previewContainer.innerHTML = tableHTML;

        // Update summary
        if (previewSummary) {
            previewSummary.textContent = `${this.bulkData.leads.length} leads para importar${this.bulkData.duplicatesRemoved.length > 0 ? `, ${this.bulkData.duplicatesRemoved.length} duplicatas removidas` : ''}`;
        }

        // Show confirm button
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

    processBulkImport() {
        const results = {
            success: [],
            errors: [],
            total: this.bulkData.leads.length
        };

        this.bulkData.leads.forEach(leadData => {
            try {
                // Validate lead data
                const validation = this.validateLeadData(leadData);
                if (!validation.isValid) {
                    results.errors.push({
                        nome: leadData.nome_completo,
                        cpf: leadData.cpf,
                        error: validation.error,
                        type: 'validation'
                    });
                    return;
                }

                // Check if lead already exists in localStorage
                const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                const existingLead = existingLeads.find(lead => lead.cpf === leadData.cpf);
                if (existingLead) {
                    results.errors.push({
                        nome: leadData.nome_completo,
                        cpf: leadData.cpf,
                        error: 'CPF já existe no sistema',
                        type: 'duplicate'
                    });
                    return;
                }

                // Create lead
                leadData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                existingLeads.push(leadData);
                localStorage.setItem('leads', JSON.stringify(existingLeads));
                
                results.success.push({
                    nome: leadData.nome_completo,
                    cpf: leadData.cpf,
                    id: leadData.id
                });
            } catch (error) {
                results.errors.push({
                    nome: leadData.nome_completo,
                    cpf: leadData.cpf,
                    error: error.message,
                    type: 'exception'
                });
            }
        });

        return results;
    }

    validateLeadData(leadData) {
        // Check required fields
        if (!leadData.nome_completo || leadData.nome_completo.trim().length < 2) {
            return { isValid: false, error: 'Nome completo é obrigatório (mínimo 2 caracteres)' };
        }

        if (!leadData.email || !this.isValidEmail(leadData.email)) {
            return { isValid: false, error: 'Email é obrigatório e deve ter formato válido' };
        }

        if (!leadData.telefone || leadData.telefone.length < 10) {
            return { isValid: false, error: 'Telefone é obrigatório (mínimo 10 dígitos)' };
        }

        if (!leadData.cpf || leadData.cpf.length !== 11) {
            return { isValid: false, error: 'CPF é obrigatório e deve ter 11 dígitos' };
        }

        if (!this.isValidCPF(leadData.cpf)) {
            return { isValid: false, error: 'CPF inválido (formato ou dígitos verificadores incorretos)' };
        }

        return { isValid: true };
    }

    isValidCPF(cpf) {
        // Basic CPF validation
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        if (cleanCPF.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    displayBulkResults(results) {
        const resultsSection = document.getElementById('bulkResultsSection');
        const resultsContainer = document.getElementById('bulkResultsContainer');

        if (!resultsSection || !resultsContainer) return;

        resultsSection.style.display = 'block';

        let resultsHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        `;

        // Success Section
        resultsHTML += `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #155724; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle"></i>
                    Pedidos Postados com Sucesso (${results.success.length})
                </h4>
        `;

        if (results.success.length > 0) {
            resultsHTML += '<ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">';
            results.success.forEach(item => {
                resultsHTML += `<li style="margin-bottom: 5px; color: #155724;">
                    <strong>${item.nome}</strong> - CPF: ${CPFValidator.formatCPF(item.cpf)}
                </li>`;
            });
            resultsHTML += '</ul>';

            // Add "Ir para Lista" button
            resultsHTML += `
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
            resultsHTML += '<p style="color: #856404; font-style: italic;">Nenhum pedido foi postado com sucesso.</p>';
        }

        resultsHTML += '</div>';

        // Error Section
        resultsHTML += `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #721c24; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pedidos com Erro (${results.errors.length})
                </h4>
        `;

        if (results.errors.length > 0) {
            resultsHTML += `
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
                const rowClass = index % 2 === 0 ? 'background: #fdf2f2;' : '';
                resultsHTML += `
                    <tr style="${rowClass}">
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${error.nome}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${this.formatCPF(error.cpf)}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7; color: #721c24;">
                            <strong>${this.getErrorTypeLabel(error.type)}:</strong> ${error.error}
                        </td>
                    </tr>
                `;
            });

            resultsHTML += '</tbody></table></div>';
        } else {
            resultsHTML += '<p style="color: #155724; font-style: italic;">Nenhum erro encontrado! 🎉</p>';
        }

        resultsHTML += '</div></div>';

        // Summary
        resultsHTML += `
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

        resultsContainer.innerHTML = resultsHTML;

        // Setup "Ir para Lista" button event
        const goToListButton = document.getElementById('goToLeadsListButton');
        if (goToListButton) {
            goToListButton.addEventListener('click', () => {
                this.showView('leadsView');
                this.refreshLeads();
            });
        }

        // Hide preview section
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

    refreshLeads() {
        console.log('🔄 Atualizando lista de leads...');
        this.loadLeads();
        this.showNotification('Lista atualizada com sucesso!', 'success');
    }

    // Aplicar filtros aos leads
    applyFilters() {
        console.log('🔍 Aplicando filtros...');
        
        const searchInput = document.getElementById('searchInput');
        const dateFilter = document.getElementById('dateFilter');
        const stageFilter = document.getElementById('stageFilter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const dateValue = dateFilter ? dateFilter.value : '';
        const stageValue = stageFilter ? stageFilter.value : 'all';
        
        console.log('Filtros aplicados:', { searchTerm, dateValue, stageValue });
        
        this.filteredLeads = this.leads.filter(lead => {
            // Filtro por nome ou CPF
            if (searchTerm) {
                const nameMatch = (lead.nome_completo || '').toLowerCase().includes(searchTerm);
                const cpfMatch = (lead.cpf || '').replace(/[^\d]/g, '').includes(searchTerm.replace(/[^\d]/g, ''));
                if (!nameMatch && !cpfMatch) {
                    return false;
                }
            }
            
            // Filtro por data
            if (dateValue) {
                const leadDate = new Date(lead.created_at);
                const filterDate = new Date(dateValue);
                if (leadDate.toDateString() !== filterDate.toDateString()) {
                    return false;
                }
            }
            
            // Filtro por etapa
            if (stageValue !== 'all') {
                const leadStage = lead.etapa_atual || 1;
                if (leadStage.toString() !== stageValue) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log(`Filtros aplicados: ${this.filteredLeads.length} de ${this.leads.length} leads`);
        
        // Resetar página atual
        this.currentPage = 1;
        
        // Atualizar tabela
        this.renderLeadsTable();
        this.updateLeadsCount();
        
        this.showNotification(`Filtros aplicados: ${this.filteredLeads.length} leads encontrados`, "info");
    }

    // Lidar com ações do sistema (botões de controle)
    async handleSystemAction(action) {
        console.log(`🔧 Executando ação do sistema: ${action}`);
        
        // Aplicar filtros primeiro para obter leads corretos
        this.applyFilters();
        
        const filteredLeads = this.filteredLeads;
        
        if (action === 'refresh') {
            this.showLoadingButton('refreshButton', 'Atualizando...');
            try {
                this.refreshLeads();
                this.showNotification("Lista atualizada com sucesso!", "success");
            } finally {
                this.hideLoadingButton('refreshButton', '<i class="fas fa-sync"></i> Atualizar Lista');
            }
            return;
        }
        
        if (action === 'clearAll') {
            if (filteredLeads.length === 0) {
                this.showNotification("Nenhum lead encontrado com os filtros aplicados", "error");
                return;
            }
            
            const confirmed = confirm(`Tem certeza que deseja excluir ${filteredLeads.length} leads filtrados? Esta ação é irreversível.`);
            if (!confirmed) return;
            
            this.showLoadingButton('clearAllButton', 'Excluindo...');
            try {
                await this.deleteFilteredLeads(filteredLeads);
                this.showNotification(`${filteredLeads.length} leads excluídos com sucesso!`, "success");
            } catch (error) {
                console.error('❌ Erro ao excluir leads:', error);
                this.showNotification("Erro ao excluir leads: " + error.message, "error");
            } finally {
                this.hideLoadingButton('clearAllButton', '<i class="fas fa-trash"></i> Limpar Todos');
            }
            return;
        }
        
        if (action === 'nextAll' || action === 'prevAll') {
            if (filteredLeads.length === 0) {
                this.showNotification("Nenhum lead encontrado com os filtros aplicados", "error");
                return;
            }
            
            const actionText = action === 'nextAll' ? 'avançar' : 'voltar';
            const buttonId = action === 'nextAll' ? 'nextAllButton' : 'prevAllButton';
            const buttonText = action === 'nextAll' ? 
                '<i class="fas fa-forward"></i> Avançar Todos' : 
                '<i class="fas fa-backward"></i> Voltar Todos';
            
            const confirmed = confirm(`Tem certeza que deseja ${actionText} ${filteredLeads.length} leads filtrados?`);
            if (!confirmed) return;
            
            this.showLoadingButton(buttonId, `${actionText === 'avançar' ? 'Avançando' : 'Voltando'}...`);
            try {
                await this.updateFilteredLeadsStage(filteredLeads, action === 'nextAll' ? 1 : -1);
                this.showNotification(`${filteredLeads.length} leads ${actionText === 'avançar' ? 'avançados' : 'voltados'} com sucesso!`, "success");
            } catch (error) {
                console.error(`❌ Erro ao ${actionText} leads:`, error);
                this.showNotification(`Erro ao ${actionText} leads: ` + error.message, "error");
            } finally {
                this.hideLoadingButton(buttonId, buttonText);
            }
        }
    }

    // Mostrar loading em botão
    showLoadingButton(buttonId, loadingText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
            button.disabled = true;
        }
    }

    // Esconder loading do botão
    hideLoadingButton(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.innerHTML = originalText || button.dataset.originalText || button.innerHTML;
            button.disabled = false;
            delete button.dataset.originalText;
        }
    }

    // Atualizar etapa de leads filtrados
    async updateFilteredLeadsStage(filteredLeads, increment) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let updatedCount = 0;
            
            filteredLeads.forEach(filteredLead => {
                const leadIndex = leads.findIndex(l => (l.id || l.cpf) === (filteredLead.id || filteredLead.cpf));
                if (leadIndex !== -1) {
                    const currentStage = leads[leadIndex].etapa_atual || 1;
                    const newStage = Math.max(1, Math.min(16, currentStage + increment));
                    
                    if (newStage !== currentStage) {
                        leads[leadIndex].etapa_atual = newStage;
                        leads[leadIndex].updated_at = new Date().toISOString();
                        updatedCount++;
                    }
                }
            });
            
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Recarregar dados
            this.loadLeads();
            
            console.log(`✅ ${updatedCount} leads atualizados`);
            return updatedCount;
        } catch (error) {
            console.error('❌ Erro ao atualizar etapas:', error);
            throw error;
        }
    }

    // Excluir leads filtrados
    async deleteFilteredLeads(filteredLeads) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const idsToDelete = filteredLeads.map(lead => lead.id || lead.cpf);
            
            const remainingLeads = leads.filter(lead => 
                !idsToDelete.includes(lead.id || lead.cpf)
            );
            
            localStorage.setItem('leads', JSON.stringify(remainingLeads));
            
            // Recarregar dados
            this.loadLeads();
            
            console.log(`✅ ${filteredLeads.length} leads excluídos`);
            return filteredLeads.length;
        } catch (error) {
            console.error('❌ Erro ao excluir leads:', error);
            throw error;
        }
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
            const isSelected = this.selectedLeads.has(lead.id || lead.cpf);
            const produtos = Array.isArray(lead.produtos) ? lead.produtos : [];
            const produtoNome = produtos.length > 0 ? produtos[0].nome : 'Produto não informado';
            const formattedCPF = this.formatCPF(lead.cpf || '');

            tableHTML += `
                <tr style="${isSelected ? 'background-color: #e3f2fd;' : ''}">
                    <td>
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="adminPanel.toggleLeadSelection('${lead.id || lead.cpf}', this.checked)">
                    </td>
                    <td>${lead.nome_completo || 'N/A'}</td>
                    <td>${formattedCPF}</td>
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

        tableBody.innerHTML = tableHTML;
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

        // Enable/disable mass action buttons
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

        // Update action counts
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
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
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

    handleMassAction(action) {
        if (this.selectedLeads.size === 0) {
            this.showNotification('Nenhum lead selecionado', 'error');
            return;
        }

        console.log(`🔧 Ação em massa: ${action} para ${this.selectedLeads.size} leads`);
        
        switch (action) {
            case 'nextStage':
                this.massNextStage();
                break;
            case 'prevStage':
                this.massPrevStage();
                break;
            case 'setStage':
                this.massSetStage();
                break;
            case 'delete':
                this.massDeleteLeads();
                break;
            default:
                console.warn('Ação não reconhecida:', action);
        }
    }

    async massNextStage() {
        if (this.selectedLeads.size === 0) {
            this.showNotification('Nenhum lead selecionado', 'error');
            return;
        }

        const confirmMessage = `Tem certeza que deseja avançar ${this.selectedLeads.size} lead(s) para a próxima etapa?`;
        if (!confirm(confirmMessage)) return;

        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let updatedCount = 0;

            // Atualizar cada lead selecionado
            this.selectedLeads.forEach(leadId => {
                const leadIndex = leads.findIndex(l => (l.id || l.cpf) === leadId);
                if (leadIndex !== -1) {
                    const currentStage = leads[leadIndex].etapa_atual || 1;
                    const newStage = Math.min(16, currentStage + 1); // Máximo 16
                    
                    leads[leadIndex].etapa_atual = newStage;
                    leads[leadIndex].updated_at = new Date().toISOString();
                    updatedCount++;
                }
            });

            // Salvar no localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Limpar seleção e recarregar tabela
            this.selectedLeads.clear();
            this.loadLeads();
            
            this.showNotification(`${updatedCount} lead(s) avançado(s) com sucesso!`, 'success');
            console.log(`✅ ${updatedCount} leads avançados para próxima etapa`);
            
        } catch (error) {
            console.error('❌ Erro ao avançar leads:', error);
            this.showNotification('Erro ao avançar leads: ' + error.message, 'error');
        }
    }

    async massPrevStage() {
        if (this.selectedLeads.size === 0) {
            this.showNotification('Nenhum lead selecionado', 'error');
            return;
        }

        const confirmMessage = `Tem certeza que deseja retroceder ${this.selectedLeads.size} lead(s) para a etapa anterior?`;
        if (!confirm(confirmMessage)) return;

        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let updatedCount = 0;

            // Atualizar cada lead selecionado
            this.selectedLeads.forEach(leadId => {
                const leadIndex = leads.findIndex(l => (l.id || l.cpf) === leadId);
                if (leadIndex !== -1) {
                    const currentStage = leads[leadIndex].etapa_atual || 1;
                    const newStage = Math.max(1, currentStage - 1); // Mínimo 1
                    
                    leads[leadIndex].etapa_atual = newStage;
                    leads[leadIndex].updated_at = new Date().toISOString();
                    updatedCount++;
                }
            });

            // Salvar no localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Limpar seleção e recarregar tabela
            this.selectedLeads.clear();
            this.loadLeads();
            
            this.showNotification(`${updatedCount} lead(s) retrocedido(s) com sucesso!`, 'success');
            console.log(`✅ ${updatedCount} leads retrocedidos para etapa anterior`);
            
        } catch (error) {
            console.error('❌ Erro ao retroceder leads:', error);
            this.showNotification('Erro ao retroceder leads: ' + error.message, 'error');
        }
    }

    async massSetStage() {
        if (this.selectedLeads.size === 0) {
            this.showNotification('Nenhum lead selecionado', 'error');
            return;
        }

        // Solicitar a etapa desejada
        const targetStage = prompt(`Digite a etapa desejada (1-16) para ${this.selectedLeads.size} lead(s):`);
        
        if (!targetStage) return; // Usuário cancelou
        
        const stageNumber = parseInt(targetStage);
        if (isNaN(stageNumber) || stageNumber < 1 || stageNumber > 16) {
            this.showNotification('Etapa inválida. Digite um número entre 1 e 16.', 'error');
            return;
        }

        const confirmMessage = `Tem certeza que deseja definir a etapa ${stageNumber} para ${this.selectedLeads.size} lead(s)?`;
        if (!confirm(confirmMessage)) return;

        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let updatedCount = 0;

            // Atualizar cada lead selecionado
            this.selectedLeads.forEach(leadId => {
                const leadIndex = leads.findIndex(l => (l.id || l.cpf) === leadId);
                if (leadIndex !== -1) {
                    leads[leadIndex].etapa_atual = stageNumber;
                    leads[leadIndex].updated_at = new Date().toISOString();
                    updatedCount++;
                }
            });

            // Salvar no localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Limpar seleção e recarregar tabela
            this.selectedLeads.clear();
            this.loadLeads();
            
            this.showNotification(`${updatedCount} lead(s) definido(s) para etapa ${stageNumber} com sucesso!`, 'success');
            console.log(`✅ ${updatedCount} leads definidos para etapa ${stageNumber}`);
            
        } catch (error) {
            console.error('❌ Erro ao definir etapa dos leads:', error);
            this.showNotification('Erro ao definir etapa dos leads: ' + error.message, 'error');
        }
    }

    async massDeleteLeads() {
        if (this.selectedLeads.size === 0) {
            this.showNotification('Nenhum lead selecionado', 'error');
            return;
        }

        const confirmMessage = `⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR ${this.selectedLeads.size} lead(s)?\n\nEsta ação não pode ser desfeita!`;
        if (!confirm(confirmMessage)) return;

        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let deletedCount = 0;

            // Filtrar leads removendo os selecionados
            const remainingLeads = leads.filter(lead => {
                const leadId = lead.id || lead.cpf;
                if (this.selectedLeads.has(leadId)) {
                    deletedCount++;
                    return false; // Remove este lead
                }
                return true; // Mantém este lead
            });

            // Salvar no localStorage
            localStorage.setItem('leads', JSON.stringify(remainingLeads));
            
            // Limpar seleção e recarregar tabela
            this.selectedLeads.clear();
            this.loadLeads();
            
            this.showNotification(`${deletedCount} lead(s) excluído(s) com sucesso!`, 'success');
            console.log(`✅ ${deletedCount} leads excluídos`);
            
        } catch (error) {
            console.error('❌ Erro ao excluir leads:', error);
            this.showNotification('Erro ao excluir leads: ' + error.message, 'error');
        }
    }

    async editLead(leadId) {
        console.log(`✏️ Editando lead: ${leadId}`);
        
        try {
            // Find lead in localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => (l.id || l.cpf) === leadId);
            
            if (!lead) {
                this.showNotification('Lead não encontrado', 'error');
                return;
            }
            
            this.editingLead = lead;
            this.populateEditForm(lead);
            this.showEditModal();
            
        } catch (error) {
            console.error('❌ Erro ao carregar lead para edição:', error);
            this.showNotification('Erro ao carregar dados do lead', 'error');
        }
    }

    populateEditForm(lead) {
        document.getElementById('editName').value = lead.nome_completo || '';
        document.getElementById('editCPF').value = lead.cpf || '';
        document.getElementById('editEmail').value = lead.email || '';
        document.getElementById('editPhone').value = lead.telefone || '';
        document.getElementById('editAddress').value = lead.endereco || '';
        document.getElementById('editStage').value = lead.etapa_atual || 1;
        
        // Set current date/time for stage if not exists
        if (lead.updated_at) {
            const date = new Date(lead.updated_at);
            const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('editStageDateTime').value = localDateTime;
        } else {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('editStageDateTime').value = localDateTime;
        }
    }

    showEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.editingLead = null;
    }

    async handleEditSubmit(e) {
        e.preventDefault();
        
        if (!this.editingLead) {
            this.showNotification('Nenhum lead selecionado para edição', 'error');
            return;
        }

        try {
            const formData = new FormData(e.target);
            const updatedLead = {
                ...this.editingLead,
                nome_completo: document.getElementById('editName').value,
                cpf: document.getElementById('editCPF').value.replace(/[^\d]/g, ''),
                email: document.getElementById('editEmail').value,
                telefone: document.getElementById('editPhone').value,
                endereco: document.getElementById('editAddress').value,
                etapa_atual: parseInt(document.getElementById('editStage').value),
                updated_at: new Date().toISOString()
            };

            // Update in localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => (l.id || l.cpf) === (this.editingLead.id || this.editingLead.cpf));
            
            if (leadIndex !== -1) {
                leads[leadIndex] = updatedLead;
                localStorage.setItem('leads', JSON.stringify(leads));
                
                this.closeEditModal();
                this.loadLeads();
                this.showNotification('Lead atualizado com sucesso!', 'success');
            } else {
                throw new Error('Lead não encontrado para atualização');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar lead:', error);
            this.showNotification('Erro ao atualizar lead: ' + error.message, 'error');
        }
    }

    async nextStage(leadId) {
        console.log(`⏭️ Próxima etapa para lead: ${leadId}`);
        await this.updateLeadStage(leadId, 1);
    }

    async prevStage(leadId) {
        console.log(`⏮️ Etapa anterior para lead: ${leadId}`);
        await this.updateLeadStage(leadId, -1);
    }

    async updateLeadStage(leadId, direction) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => (l.id || l.cpf) === leadId);
            
            if (leadIndex !== -1) {
                const currentStage = leads[leadIndex].etapa_atual || 1;
                const newStage = Math.max(1, Math.min(16, currentStage + direction));
                
                leads[leadIndex].etapa_atual = newStage;
                leads[leadIndex].updated_at = new Date().toISOString();
                
                localStorage.setItem('leads', JSON.stringify(leads));
                this.loadLeads();
                
                const actionText = direction > 0 ? 'avançada' : 'retrocedida';
                this.showNotification(`Etapa ${actionText} com sucesso! Nova etapa: ${newStage}`, 'success');
                console.log(`✅ Etapa atualizada para ${newStage}`);
            } else {
                throw new Error('Lead não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa:', error);
            this.showNotification('Erro ao atualizar etapa: ' + error.message, 'error');
        }
    }

    async deleteLead(leadId) {
        if (confirm('Tem certeza que deseja excluir este lead?')) {
            console.log(`🗑️ Excluindo lead: ${leadId}`);
            try {
                const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                const filteredLeads = leads.filter(l => (l.id || l.cpf) !== leadId);
                
                if (leads.length === filteredLeads.length) {
                    throw new Error('Lead não encontrado para exclusão');
                }
                
                localStorage.setItem('leads', JSON.stringify(filteredLeads));
                this.loadLeads();
                this.showNotification('Lead excluído com sucesso!', 'success');
            } catch (error) {
                console.error('❌ Erro ao excluir lead:', error);
                this.showNotification('Erro ao excluir lead', 'error');
            }
        }
    }
}

// Initialize admin panel when DOM is ready
let adminPanel = null;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    window.adminPanel = adminPanel;
});

export default AdminPanel;