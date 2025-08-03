/**
 * Sistema de rastreamento automatizado com etapas fixas
 * Atualiza sequencialmente a cada 2 horas
 */
export class AutomatedTrackingSystem {
    constructor() {
        this.fixedSteps = this.getFixedSteps();
        this.updateInterval = 2 * 60 * 60 * 1000; // 2 horas em millisegundos
        this.timers = [];
        console.log('🤖 Sistema de rastreamento automatizado inicializado');
    }

    getFixedSteps() {
        return [
            {
                id: 1,
                date: '23 de jul.',
                time: '08:21',
                title: 'Seu pedido foi criado',
                description: 'Seu pedido foi criado',
                isChina: false,
                completed: false
            },
            {
                id: 2,
                date: '23 de jul.',
                time: '22:49',
                title: 'O seu pedido está sendo preparado para envio',
                description: 'O seu pedido está sendo preparado para envio',
                isChina: false,
                completed: false
            },
            {
                id: 3,
                date: '24 de jul.',
                time: '14:26',
                title: '[China] O vendedor enviou seu pedido',
                description: '[China] O vendedor enviou seu pedido',
                isChina: true,
                completed: false
            },
            {
                id: 4,
                date: '24 de jul.',
                time: '11:24',
                title: '[China] O pedido chegou ao centro de triagem de Shenzhen',
                description: '[China] O pedido chegou ao centro de triagem de Shenzhen',
                isChina: true,
                completed: false
            },
            {
                id: 5,
                date: '24 de jul.',
                time: '16:33',
                title: '[China] Pedido saiu do centro logístico de Shenzhen',
                description: '[China] Pedido saiu do centro logístico de Shenzhen',
                isChina: true,
                completed: false
            },
            {
                id: 6,
                date: '24 de jul.',
                time: '21:09',
                title: '[China] Coletado. O pedido está em trânsito internacional',
                description: '[China] Coletado. O pedido está em trânsito internacional',
                isChina: true,
                completed: false
            },
            {
                id: 7,
                date: '24 de jul.',
                time: '09:50',
                title: '[China] O pedido foi liberado na alfândega de exportação',
                description: '[China] O pedido foi liberado na alfândega de exportação',
                isChina: true,
                completed: false
            },
            {
                id: 8,
                date: '24 de jul.',
                time: '05:15',
                title: 'Pedido saiu da origem: Shenzhen',
                description: 'Pedido saiu da origem: Shenzhen',
                isChina: false,
                completed: false
            },
            {
                id: 9,
                date: '24 de jul.',
                time: '15:20',
                title: 'Pedido chegou no Brasil',
                description: 'Pedido chegou no Brasil',
                isChina: false,
                completed: false
            },
            {
                id: 10,
                date: '25 de jul.',
                time: '14:28',
                title: 'Pedido em trânsito para CURITIBA/PR',
                description: 'Pedido em trânsito para CURITIBA/PR',
                isChina: false,
                completed: false
            },
            {
                id: 11,
                date: '25 de jul.',
                time: '15:28',
                title: 'Pedido chegou na alfândega de importação: CURITIBA/PR',
                description: 'Pedido chegou na alfândega de importação: CURITIBA/PR',
                isChina: false,
                completed: false,
                needsLiberation: true
            }
        ];
    }

    // Iniciar sistema automatizado para um CPF específico
    startAutomatedTracking(cpf, userData) {
        console.log('🚀 Iniciando rastreamento automatizado para CPF:', cpf);
        
        // Limpar timers existentes
        this.clearTimers();
        
        // Verificar se já existe progresso salvo
        const savedProgress = this.getSavedProgress(cpf);
        let currentStep = savedProgress ? savedProgress.currentStep : 0;
        
        console.log('📊 Etapa atual:', currentStep);
        
        // Marcar etapas já completadas
        const steps = [...this.fixedSteps];
        for (let i = 0; i < currentStep; i++) {
            steps[i].completed = true;
        }
        
        // Salvar dados do usuário
        this.saveUserData(cpf, userData);
        
        // Iniciar primeira etapa imediatamente se não há progresso
        if (currentStep === 0) {
            this.completeStep(cpf, 0, steps);
            currentStep = 1;
        }
        
        // Programar próximas etapas
        this.scheduleNextSteps(cpf, currentStep, steps);
        
        return {
            steps: steps,
            currentStep: currentStep,
            totalSteps: steps.length
        };
    }

    // Completar uma etapa específica
    completeStep(cpf, stepIndex, steps) {
        if (stepIndex >= steps.length) return;
        
        steps[stepIndex].completed = true;
        
        console.log(`✅ Etapa ${stepIndex + 1} completada:`, steps[stepIndex].title);
        
        // Salvar progresso
        this.saveProgress(cpf, stepIndex + 1);
        
        // Atualizar interface
        this.updateTimelineUI(steps);
        
        // Disparar evento customizado
        this.dispatchStepCompleted(stepIndex, steps[stepIndex]);
    }

    // Programar próximas etapas
    scheduleNextSteps(cpf, startStep, steps) {
        for (let i = startStep; i < steps.length; i++) {
            const delay = (i - startStep) * this.updateInterval;
            
            const timer = setTimeout(() => {
                this.completeStep(cpf, i, steps);
                
                // Se for a última etapa, parar o sistema
                if (i === steps.length - 1) {
                    console.log('🏁 Todas as etapas foram completadas');
                    this.dispatchTrackingCompleted();
                }
            }, delay);
            
            this.timers.push(timer);
            
            console.log(`⏰ Etapa ${i + 1} programada para ${delay / 1000 / 60} minutos`);
        }
    }

    // Atualizar interface da timeline
    updateTimelineUI(steps) {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;
        
        // Limpar timeline atual
        timeline.innerHTML = '';
        
        // Renderizar etapas
        steps.forEach((step, index) => {
            if (step.completed) {
                const timelineItem = this.createTimelineItem(step, index === steps.length - 1);
                timeline.appendChild(timelineItem);
                
                // Animar entrada
                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100 * index);
            }
        });
        
        // Scroll para última etapa
        setTimeout(() => {
            const lastItem = timeline.lastElementChild;
            if (lastItem) {
                lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }

    // Criar item da timeline
    createTimelineItem(step, isLast) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''} ${isLast ? 'last' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        
        const dateStr = step.date; // Já vem formatado como "23 de jul."
        
        let buttonHtml = '';
        if (step.needsLiberation && step.completed) {
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
                    <span class="time">${step.time}</span>
                </div>
                <div class="timeline-text">
                    <p>${step.description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        // Configurar botão de liberação se necessário
        if (step.needsLiberation && step.completed) {
            const liberationButton = item.querySelector('.liberation-button-timeline');
            if (liberationButton) {
                liberationButton.addEventListener('click', () => {
                    this.dispatchLiberationNeeded(step);
                });
            }
        }
        
        return item;
    }

    // Salvar progresso no localStorage
    saveProgress(cpf, currentStep) {
        try {
            const progressData = {
                cpf: cpf,
                currentStep: currentStep,
                lastUpdate: new Date().toISOString(),
                startTime: this.getStartTime(cpf)
            };
            
            localStorage.setItem(`automated_tracking_${cpf}`, JSON.stringify(progressData));
            console.log('💾 Progresso salvo:', progressData);
        } catch (error) {
            console.error('❌ Erro ao salvar progresso:', error);
        }
    }

    // Obter progresso salvo
    getSavedProgress(cpf) {
        try {
            const saved = localStorage.getItem(`automated_tracking_${cpf}`);
            if (saved) {
                const progress = JSON.parse(saved);
                console.log('📖 Progresso carregado:', progress);
                return progress;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar progresso:', error);
        }
        return null;
    }

    // Salvar dados do usuário
    saveUserData(cpf, userData) {
        try {
            localStorage.setItem(`user_data_${cpf}`, JSON.stringify(userData));
        } catch (error) {
            console.error('❌ Erro ao salvar dados do usuário:', error);
        }
    }

    // Obter dados do usuário
    getUserData(cpf) {
        try {
            const saved = localStorage.getItem(`user_data_${cpf}`);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('❌ Erro ao carregar dados do usuário:', error);
            return null;
        }
    }

    // Obter horário de início
    getStartTime(cpf) {
        const saved = this.getSavedProgress(cpf);
        return saved ? saved.startTime : new Date().toISOString();
    }

    // Disparar evento de etapa completada
    dispatchStepCompleted(stepIndex, stepData) {
        const event = new CustomEvent('stepCompleted', {
            detail: {
                stepIndex: stepIndex,
                stepData: stepData,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // Disparar evento de liberação necessária
    dispatchLiberationNeeded(stepData) {
        const event = new CustomEvent('liberationNeeded', {
            detail: {
                stepData: stepData,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // Disparar evento de rastreamento completado
    dispatchTrackingCompleted() {
        const event = new CustomEvent('trackingCompleted', {
            detail: {
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // Limpar todos os timers
    clearTimers() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
        console.log('🧹 Timers limpos');
    }

    // Resetar sistema para um CPF
    resetTracking(cpf) {
        this.clearTimers();
        localStorage.removeItem(`automated_tracking_${cpf}`);
        localStorage.removeItem(`user_data_${cpf}`);
        console.log('🔄 Rastreamento resetado para CPF:', cpf);
    }

    // Obter status atual
    getTrackingStatus(cpf) {
        const progress = this.getSavedProgress(cpf);
        const userData = this.getUserData(cpf);
        
        if (!progress) {
            return {
                active: false,
                message: 'Nenhum rastreamento ativo'
            };
        }
        
        const steps = [...this.fixedSteps];
        for (let i = 0; i < progress.currentStep; i++) {
            steps[i].completed = true;
        }
        
        return {
            active: true,
            cpf: cpf,
            currentStep: progress.currentStep,
            totalSteps: steps.length,
            completedSteps: steps.filter(s => s.completed),
            nextStep: steps[progress.currentStep] || null,
            userData: userData,
            startTime: progress.startTime,
            lastUpdate: progress.lastUpdate
        };
    }
    
    // Mostrar informações do pedido
    showOrderInfo() {
        const orderInfoSection = document.getElementById('orderInfoSection');
        if (orderInfoSection) {
            orderInfoSection.style.display = 'block';
            
            // Atualizar informações com dados do usuário se disponível
            const userData = this.getUserData(this.currentCPF);
            if (userData) {
                this.updateElement('orderCustomerName', userData.nome || 'Nome não informado');
                this.updateElement('orderDeliveryAddress', 'Rua das Flores, 123 - Centro - São Paulo/SP');
                this.updateElement('orderProductName', 'Kit 12 caixas organizadoras + brinde');
                this.updateElement('orderCustomsStatus', 'Pendente');
            }
        }
    }
    
    // Helper para atualizar elementos
    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }
    
    // Atualizar status da taxa alfandegária
    updateCustomsStatus(status) {
        this.updateElement('orderCustomsStatus', status);
    }

    // Acelerar para teste (reduzir intervalo)
    setTestMode(enabled = true) {
        if (enabled) {
            this.updateInterval = 10 * 1000; // 10 segundos para teste
            console.log('🧪 Modo de teste ativado - intervalo: 10 segundos');
        } else {
            this.updateInterval = 2 * 60 * 60 * 1000; // 2 horas normal
            console.log('⏰ Modo normal ativado - intervalo: 2 horas');
        }
    }
}