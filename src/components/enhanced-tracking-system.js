/**
 * Sistema de rastreamento aprimorado com integração Supabase
 * VERSÃO LIMPA - SEM SIMULADORES DE TESTE
 */
import { TrackingSystem } from './tracking-system.js';
import { DatabaseService } from '../services/database.js';
import { VegaDataProcessor } from '../utils/vega-data.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { PostPaymentSystem } from './post-payment-system.js';

export class EnhancedTrackingSystem extends TrackingSystem {
    constructor() {
        super();
        this.dbService = new DatabaseService();
        this.isVegaOrigin = false;
        this.leadData = null;
        this.postPaymentSystem = null;
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Inicializando sistema de rastreamento aprimorado');
        
        try {
            // Verificar origem da requisição
            this.checkOrigin();
            
            // Configurar sistema base
            await super.init();
            
            // Configurações específicas para origem Vega
            if (this.isVegaOrigin) {
                await this.handleVegaOrigin();
            }
            
            console.log('✅ Sistema de rastreamento aprimorado inicializado');
        } catch (error) {
            console.error('❌ Erro na inicialização do sistema aprimorado:', error);
        }
    }

    checkOrigin() {
        const urlParams = new URLSearchParams(window.location.search);
        this.isVegaOrigin = urlParams.get('origem') === 'vega';
        
        if (this.isVegaOrigin) {
            console.log('📦 Origem detectada: Vega Checkout');
        } else {
            console.log('🔍 Origem detectada: Rastreamento direto');
        }
    }

    async handleVegaOrigin() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpf = urlParams.get('cpf');
        
        if (cpf) {
            console.log('🔍 Buscando dados do lead para CPF:', cpf);
            
            // Buscar dados do lead no banco
            const result = await this.dbService.getLeadByCPF(cpf);
            
            if (result.success && result.data) {
                this.leadData = result.data;
                console.log('✅ Dados do lead encontrados:', this.leadData);
                
                // Auto-preencher CPF e simular busca
                await this.autoFillAndTrack(cpf);
            } else {
                console.log('⚠️ Lead não encontrado, criando dados mock');
                // Criar dados mock e salvar
                this.leadData = VegaDataProcessor.generateMockVegaData(cpf);
                await this.dbService.createLead(this.leadData);
                await this.autoFillAndTrack(cpf);
            }
        }
    }

    async autoFillAndTrack(cpf) {
        // Auto-preencher campo CPF
        const cpfInput = document.getElementById('cpfInput');
        if (cpfInput) {
            cpfInput.value = CPFValidator.formatCPF(cpf);
            
            // Simular processo de rastreamento
            setTimeout(() => {
                this.handleTrackingSubmit();
            }, 1000);
        }
    }

    async handleTrackingSubmit() {
        console.log('🔍 Iniciando rastreamento aprimorado');
        
        // Se for origem Vega e já temos dados, usar dados do banco
        if (this.isVegaOrigin && this.leadData) {
            return this.handleVegaTracking();
        }
        
        // Caso contrário, usar lógica original
        return super.handleTrackingSubmit();
    }

    async handleVegaTracking() {
        console.log('📦 Processando rastreamento Vega');
        
        // Mostrar loading
        const { UIHelpers } = await import('../utils/ui-helpers.js');
        UIHelpers.showLoadingNotification();
        
        try {
            // Simular delay de processamento
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Configurar dados do usuário
            this.currentCPF = this.leadData.cpf.replace(/[^\d]/g, '');
            this.userData = {
                nome: this.leadData.nome_completo || this.leadData.nome,
                cpf: this.leadData.cpf || this.currentCPF,
                nascimento: this.generateBirthDate(this.leadData.cpf),
                situacao: 'REGULAR'
            };
            
            console.log('📦 Dados do usuário configurados (Vega):', this.userData);
            console.log('📦 Nome que será exibido:', this.userData.nome);
            console.log('📦 CPF que será exibido:', this.userData.cpf);
            
            UIHelpers.closeLoadingNotification();
            
            // Exibir resultados com etapas baseadas no banco
            this.displayOrderDetails();
            this.generateEnhancedTrackingData();
            this.displayTrackingResults();
            
            // Scroll para resultados
            const orderDetails = document.getElementById('orderDetails');
            if (orderDetails) {
                UIHelpers.scrollToElement(orderDetails, 100);
            }
            
            // Destacar botão de liberação se necessário
            setTimeout(() => {
                this.highlightLiberationButton();
                // Inicializar sistema pós-pagamento
                this.initializePostPaymentSystem();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro no rastreamento Vega:', error);
            UIHelpers.closeLoadingNotification();
            UIHelpers.showError('Erro ao processar rastreamento');
        }
    }

    // Sobrescrever método para usar dados corretos da API quando não for Vega
    async handleTrackingSubmit() {
        console.log('🔍 Iniciando rastreamento aprimorado');
        
        // Se for origem Vega e já temos dados, usar dados do banco
        if (this.isVegaOrigin && this.leadData) {
            return this.handleVegaTracking();
        }
        
        // Caso contrário, usar lógica original que busca na API
        console.log('🌐 Usando busca na API oficial para dados do CPF');
        const result = await super.handleTrackingSubmit();
        
        // Garantir que os dados da API sejam preservados
        console.log('✅ Dados obtidos da API preservados:', this.userData);
        
        return result;
    }

    // Sobrescrever método para adicionar sistema pós-pagamento
    highlightLiberationButton() {
        super.highlightLiberationButton();
        
        // Adicionar sistema pós-pagamento após destacar o botão
        setTimeout(() => {
            this.initializePostPaymentSystem();
        }, 1000);
    }

    // Inicializar sistema pós-pagamento
    initializePostPaymentSystem() {
        if (!this.postPaymentSystem) {
            this.postPaymentSystem = new PostPaymentSystem(this);
            console.log('🚀 Sistema pós-pagamento inicializado');
        }
    }

    generateEnhancedTrackingData() {
        const { TrackingGenerator } = require('../utils/tracking-generator.js');
        
        // Gerar dados base
        this.trackingData = TrackingGenerator.generateTrackingData(this.userData);
        
        // Ajustar etapa baseada nos dados do banco
        if (this.leadData && this.leadData.etapa_atual) {
            this.trackingData.currentStep = this.getStepNameByNumber(this.leadData.etapa_atual);
            
            // Marcar etapas como completadas até a etapa atual
            this.trackingData.steps.forEach((step, index) => {
                step.completed = index < this.leadData.etapa_atual;
            });
        }
        
        // Verificar status de pagamento
        if (this.leadData && this.leadData.status_pagamento === 'pago') {
            this.trackingData.liberationPaid = true;
        }
    }

    getStepNameByNumber(stepNumber) {
        const stepMap = {
            1: 'created',
            2: 'preparing',
            3: 'shipped',
            4: 'in_transit',
            5: 'customs',
            6: 'delivered'
        };
        
        return stepMap[stepNumber] || 'customs';
    }

    generateBirthDate(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        const year = 1960 + (parseInt(cleanCPF.slice(0, 2)) % 40);
        const month = (parseInt(cleanCPF.slice(2, 4)) % 12) + 1;
        const day = (parseInt(cleanCPF.slice(4, 6)) % 28) + 1;
        
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    async updateLeadStage(newStage) {
        if (this.leadData && this.leadData.cpf) {
            try {
                await this.dbService.updateLeadStage(this.leadData.cpf, newStage);
                console.log('✅ Etapa do lead atualizada:', newStage);
            } catch (error) {
                console.error('❌ Erro ao atualizar etapa do lead:', error);
            }
        }
    }

    async updatePaymentStatus(status) {
        if (this.leadData && this.leadData.cpf) {
            try {
                await this.dbService.updatePaymentStatus(this.leadData.cpf, status);
                console.log('✅ Status de pagamento atualizado:', status);
            } catch (error) {
                console.error('❌ Erro ao atualizar status de pagamento:', error);
            }
        }
    }

    // Método para limpar sistema ao sair
    cleanup() {
        if (this.postPaymentSystem) {
            this.postPaymentSystem.reset();
        }
        
        console.log('🧹 Sistema de rastreamento limpo');
    }
}