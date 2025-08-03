/**
 * Serviço de integração com Zentra Pay - VERSÃO OFICIAL COM API-SECRET
 */
export class ZentraPayService {
    constructor() {
        this.baseURL = 'https://zentrapay-api.onrender.com';
        this.apiSecret = this.getApiSecret();
        console.log('🔑 ZentraPayService inicializado com API oficial');
        console.log('🔐 API Secret configurada:', this.apiSecret ? 'SIM' : 'NÃO');
    }

    getApiSecret() {
        // Sua chave API Secret oficial
        const apiSecret = window.ZENTRA_PAY_SECRET_KEY || 
                         localStorage.getItem('zentra_pay_secret_key') ||
                         'sk_ab923f7fd51de54a45f835645cae6c73c9ac37e65e28b79fd7d13efb030d74c6cebab32534d07a5f80a871196121732a129ef02e3732504b1a56b8d1972ebbf1';
        
        if (apiSecret && apiSecret.startsWith('sk_')) {
            console.log('✅ API Secret Zentra Pay válida encontrada');
            console.log('🔑 Secret (primeiros 20 chars):', apiSecret.substring(0, 20) + '...');
        } else {
            console.error('❌ API Secret Zentra Pay inválida ou não configurada');
        }
        
        return apiSecret;
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

    async createPixTransaction(userData, valorEmReais) {
        try {
            const timestamp = Date.now();
            const externalId = this.generateExternalId();

            // Re-avaliar API secret antes da requisição
            this.apiSecret = this.getApiSecret();
            
            // Validar API secret antes de prosseguir
            if (!this.apiSecret || !this.apiSecret.startsWith('sk_')) {
                throw new Error('API Secret inválida ou não configurada. Verifique se a chave Zentra Pay está corretamente definida.');
            }

            // Usar dados reais do usuário (do banco de dados)
            const email = userData.email || this.generateUniqueEmail(timestamp);
            const telefone = userData.telefone || this.generateUniquePhone(timestamp);
            
            console.log('📧 Email usado:', email);
            console.log('📱 Telefone usado:', telefone);

            // Dados da transação conforme documentação oficial
            const transactionData = {
                external_id: externalId,
                total_amount: parseFloat(valorEmReais), // Valor em reais
                payment_method: "PIX",
                webhook_url: "https://meusite.com/webhook", // URL padrão conforme solicitado
                items: [
                    {
                        id: "liberation_fee",
                        title: "Taxa de Liberação Aduaneira",
                        quantity: 1,
                        price: parseFloat(valorEmReais),
                        description: "Taxa única para liberação de objeto na alfândega",
                        is_physical: false
                    }
                ],
                ip: "8.8.8.8", // IP padrão conforme solicitado
                customer: {
                    name: userData.nome,
                    email: email, // Email real do banco ou gerado
                    phone: telefone, // Telefone real do banco ou gerado
                    document_type: "CPF",
                    document: userData.cpf.replace(/[^\d]/g, '')
                }
            };

            console.log('🚀 Criando transação Zentra Pay com API oficial:', {
                external_id: transactionData.external_id,
                total_amount: `R$ ${transactionData.total_amount.toFixed(2)}`,
                payment_method: transactionData.payment_method,
                webhook_url: transactionData.webhook_url,
                ip: transactionData.ip,
                customer: {
                    name: transactionData.customer.name,
                    document: transactionData.customer.document,
                    email: transactionData.customer.email,
                    phone: transactionData.customer.phone,
                    document_type: transactionData.customer.document_type
                }
            });

            // Headers obrigatórios conforme documentação oficial
            const headers = {
                'api-secret': this.apiSecret,
                'Content-Type': 'application/json'
            };

            console.log('📡 Headers da requisição (oficial):', {
                'api-secret': `${this.apiSecret.substring(0, 20)}...`,
                'Content-Type': headers['Content-Type']
            });

            const response = await fetch(`${this.baseURL}/v1/transactions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(transactionData)
            });

            console.log('📡 Status da resposta:', response.status);
            console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na API Zentra Pay:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    headers: Object.fromEntries(response.headers.entries())
                });
                
                throw new Error(`Erro na API: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Resposta Zentra Pay recebida:', {
                transaction_id: result.transaction_id || result.id,
                external_id: result.external_id,
                has_pix_payload: !!result.pix?.payload,
                has_qr_code: !!result.pix?.qr_code,
                status: result.status,
                payment_method: result.payment_method
            });

            // Validar se os campos necessários estão presentes
            if (!result.pix || !result.pix.payload) {
                console.error('❌ Resposta incompleta da API:', result);
                throw new Error('Resposta da API não contém os dados PIX necessários (pix.payload)');
            }

            console.log('🎉 PIX gerado com sucesso via API oficial!');
            console.log('📋 PIX Payload (copia e cola):', result.pix.payload);
            
            return {
                success: true,
                externalId: externalId,
                pixPayload: result.pix.payload, // Campo principal: pix.payload
                qrCode: result.pix.qr_code || null,
                transactionId: result.transaction_id || result.id,
                email: email, // Email real usado
                telefone: telefone, // Telefone real usado
                valor: valorEmReais,
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

    // Método para configurar a API secret dinamicamente
    setApiSecret(apiSecret) {
        if (!apiSecret || !apiSecret.startsWith('sk_')) {
            console.error('❌ API Secret inválida fornecida');
            return false;
        }
        
        this.apiSecret = apiSecret;
        localStorage.setItem('zentra_pay_secret_key', apiSecret);
        window.ZENTRA_PAY_SECRET_KEY = apiSecret;
        console.log('🔑 API Secret Zentra Pay atualizada com sucesso');
        return true;
    }

    // Método para testar a conexão com a API
    async testConnection() {
        try {
            console.log('🔍 Testando conexão com Zentra Pay...');
            
            // Re-avaliar API secret antes do teste
            this.apiSecret = this.getApiSecret();
            
            // Validar API secret antes do teste
            if (!this.apiSecret || !this.apiSecret.startsWith('sk_')) {
                throw new Error('API Secret inválida para teste de conexão');
            }
            
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: {
                    'api-secret': this.apiSecret,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log('✅ Conexão com Zentra Pay OK');
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
        
        if (!this.apiSecret.startsWith('sk_')) {
            console.error('❌ Formato de API Secret inválido');
            return false;
        }
        
        if (this.apiSecret.length < 50) {
            console.error('❌ API Secret muito curta');
            return false;
        }
        
        console.log('✅ API Secret válida');
        return true;
    }
}