/**
 * Página de Obrigado - Pós-venda
 */
import { VegaDataProcessor } from '../utils/vega-data.js';
import { CPFValidator } from '../utils/cpf-validator.js';

class ObrigadoPage {
    constructor() {
        this.vegaData = null;
        this.init();
    }

    async init() {
        console.log('🎉 Inicializando página de Obrigado');
        
        try {
            // Processar dados do Vega ou URL
            await this.processVegaData();
            
            // Exibir dados na interface
            this.displayOrderData();
            
            // Configurar botão de rastreamento
            this.setupTrackingButton();
            
            console.log('✅ Página de Obrigado inicializada com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização da página de Obrigado:', error);
            this.showError('Erro ao carregar dados do pedido');
        }
    }

    async processVegaData() {
        // Verificar se há dados do Vega na URL
        if (VegaDataProcessor.isVegaOrigin()) {
            console.log('📦 Processando dados do Vega Checkout');
            this.vegaData = VegaDataProcessor.parseURLParams();
        } else {
            // Tentar obter CPF da URL para buscar dados existentes
            const urlParams = new URLSearchParams(window.location.search);
            const cpf = urlParams.get('cpf');
            
            if (cpf) {
                console.log('🔍 Buscando dados existentes para CPF:', cpf);
                const result = await this.dbService.getLeadByCPF(cpf);
                
                if (result.success && result.data) {
                    this.vegaData = result.data;
                } else {
                    // Gerar dados mock se não encontrar
                    this.vegaData = VegaDataProcessor.generateMockVegaData(cpf);
                }
            } else {
                // Dados de exemplo se não há parâmetros
                this.vegaData = VegaDataProcessor.generateMockVegaData('12345678901');
            }
        }

        // Salvar/atualizar no banco de dados
        if (this.vegaData) {
            await this.saveLeadData();
        }
    }

    async saveLeadData() {
        try {
            // Save to localStorage instead of database
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const existingLeadIndex = leads.findIndex(lead => lead.cpf === this.vegaData.cpf);
            
            if (existingLeadIndex !== -1) {
                console.log('📝 Lead já existe, atualizando dados');
                leads[existingLeadIndex] = { ...leads[existingLeadIndex], ...this.vegaData };
            } else {
                console.log('📝 Criando novo lead no localStorage');
                this.vegaData.id = Date.now().toString();
                leads.push(this.vegaData);
            }
            
            localStorage.setItem('leads', JSON.stringify(leads));
            console.log('✅ Lead salvo com sucesso no localStorage');
        } catch (error) {
            console.error('❌ Erro ao salvar dados do lead:', error);
        }
    }

    displayOrderData() {
        if (!this.vegaData) {
            this.showError('Dados do pedido não encontrados');
            return;
        }

        // Dados do cliente
        this.updateElement('customerName', this.vegaData.nome_completo);
        this.updateElement('customerCPF', CPFValidator.formatCPF(this.vegaData.cpf));
        this.updateElement('customerEmail', this.vegaData.email || 'Não informado');
        this.updateElement('customerPhone', this.vegaData.telefone || 'Não informado');
        this.updateElement('customerAddress', this.vegaData.endereco || 'Não informado');

        // Dados financeiros
        this.updateElement('totalValue', this.formatCurrency(this.vegaData.valor_total));
        this.updateElement('paymentMethod', this.vegaData.meio_pagamento || 'PIX');
        this.updateElement('purchaseDate', this.formatDate(this.vegaData.data_compra));

        // Produtos
        this.displayProducts();
    }

    displayProducts() {
        const productsList = document.getElementById('productsList');
        if (!productsList) return;

        productsList.innerHTML = '';

        // Produto principal (sempre exibido)
        const mainProduct = {
            nome: 'Kit 12 caixas organizadoras + brinde',
            preco: this.vegaData.valor_total || 67.90,
            imagem: '/traduza-have-you-propose copy.png'
        };

        productsList.appendChild(this.createProductElement(mainProduct, true));

        // Order Bumps (se houver)
        if (this.vegaData.order_bumps && this.vegaData.order_bumps.length > 0) {
            this.vegaData.order_bumps.forEach(bump => {
                productsList.appendChild(this.createProductElement(bump, false));
            });
        }
    }

    createProductElement(product, isMain = false) {
        const productDiv = document.createElement('div');
        productDiv.className = `product-item ${isMain ? 'main-product' : 'order-bump'}`;

        productDiv.innerHTML = `
            <div class="product-image">
                <img src="${product.imagem}" alt="${product.nome}" onerror="this.src='/traduza-have-you-propose copy.png'">
            </div>
            <div class="product-details">
                <h4 class="product-name">${product.nome}</h4>
                <div class="product-price">${this.formatCurrency(product.preco)}</div>
                ${isMain ? '<span class="main-badge">Produto Principal</span>' : '<span class="bump-badge">Order Bump</span>'}
            </div>
        `;

        return productDiv;
    }

    setupTrackingButton() {
        const trackButton = document.getElementById('trackOrderButton');
        if (!trackButton) return;

        trackButton.addEventListener('click', () => {
            if (this.vegaData && this.vegaData.cpf) {
                const cpf = this.vegaData.cpf.replace(/[^\d]/g, '');
                const trackingUrl = `/rastreamento.html?origem=vega&cpf=${cpf}`;
                window.location.href = trackingUrl;
            } else {
                window.location.href = '/rastreamento.html';
            }
        });
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    formatCurrency(value) {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(value));
    }

    formatDate(dateString) {
        if (!dateString) return 'Data não informada';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        console.error('❌ Erro:', message);
        
        // Exibir dados de fallback
        this.updateElement('customerName', 'Cliente Shopee');
        this.updateElement('customerCPF', '000.000.000-00');
        this.updateElement('customerEmail', 'cliente@email.com');
        this.updateElement('customerPhone', '(11) 99999-9999');
        this.updateElement('customerAddress', 'Endereço não informado');
        this.updateElement('totalValue', 'R$ 67,90');
        this.updateElement('paymentMethod', 'PIX');
        this.updateElement('purchaseDate', new Date().toLocaleDateString('pt-BR'));
    }
}

// Inicializar página quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new ObrigadoPage();
});