/**
 * Serviço de banco de dados - Integração Supabase EXCLUSIVA
 * VERSÃO 17.0: PAINEL CENTRALIZADO - SUPABASE COMO FONTE ÚNICA
 */
import { createClient } from '@supabase/supabase-js';

export class DatabaseService {
    constructor() {
        this.supabase = null;
        this.connectionAttempts = 0;
        this.maxRetries = 3;
        this.isAdmin = this.checkIfAdmin();
        console.log('🗄️ DatabaseService inicializado - Versão 17.2 com Auto-Retry');
        console.log('👤 Modo:', this.isAdmin ? 'PAINEL ADMIN' : 'TRANSPORTADORA');
        this.initializeWithRetry();
    }

    async initializeWithRetry() {
        while (this.connectionAttempts < this.maxRetries && !this.supabase) {
            this.connectionAttempts++;
            console.log(`🔄 Tentativa ${this.connectionAttempts}/${this.maxRetries} de conexão com Supabase`);
            
            this.supabase = this.initializeSupabase();
            
            if (this.supabase) {
                const testResult = await this.testConnection();
                if (testResult.success) {
                    console.log('✅ Conexão com Supabase estabelecida com sucesso');
                    break;
                } else {
                    console.warn(`⚠️ Teste de conexão falhou na tentativa ${this.connectionAttempts}`);
                    this.supabase = null;
                }
            }
            
            if (this.connectionAttempts < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        if (!this.supabase) {
            console.error('❌ Falha ao conectar com Supabase após todas as tentativas');
        }
    }

    async forceReconnect() {
        console.log('🔄 Forçando reconexão com Supabase...');
        this.supabase = null;
        this.connectionAttempts = 0;
        await this.initializeWithRetry();
        return !!this.supabase;
    }

    checkIfAdmin() {
        return window.location.pathname.includes('painelk7') || 
               window.location.pathname.includes('admin');
    }

    initializeSupabase() {
        try {
            // Múltiplas fontes com fallbacks robustos
            const supabaseUrl = this.getSupabaseUrl();
            const supabaseKey = this.getSupabaseKey();
            
            console.log('🔗 Configuração Supabase:', {
                url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NÃO ENCONTRADA',
                keyConfigured: !!supabaseKey,
                attempt: this.connectionAttempts
            });
            
            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Credenciais do Supabase não encontradas!');
                return null;
            }
            
            const client = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Cliente Supabase criado');
            return client;
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            return null;
        }
    }

    getSupabaseUrl() {
        // Conexão direta com Supabase - sem dependências externas
        const supabaseUrl = 'https://coegmiyojkubtksfhwky.supabase.co';
        console.log('🔗 URL Supabase configurada diretamente:', supabaseUrl);
        return supabaseUrl;
    }

    getSupabaseKey() {
        // Chave pública Supabase configurada diretamente - sem dependências externas
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZWdtaXlvamt1YnRrc2Zod2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNjEyNjIsImV4cCI6MjA2OTgzNzI2Mn0.cLn3hKWDuf8Vjb8GtLAl0W30nTIc7GhvRJbSnVsegFY';
        console.log('🔑 Chave Supabase configurada diretamente');
        return supabaseKey;
    }

    async getLeadByCPF(cpf) {
        // Tentar reconectar se necessário
        if (!this.supabase) {
            console.log('🔄 Supabase não disponível, tentando reconectar...');
            await this.forceReconnect();
        }

        if (!this.supabase) {
            console.error('❌ Supabase não disponível após reconexão');
            return { success: false, error: 'Erro de conexão com banco de dados' };
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('🔍 Buscando lead no Supabase para CPF:', cleanCPF);
            
            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('cpf', cleanCPF)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('❌ Lead não encontrado no Supabase para CPF:', cleanCPF);
                    return { success: false, error: 'Lead não encontrado' };
                }
                console.error('❌ Erro ao buscar lead no Supabase:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Lead encontrado no Supabase:', data);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na busca do lead:', error);
            return { success: false, error: error.message };
        }
    }

    async createLead(leadData) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('📝 Criando lead no Supabase:', leadData);
            
            const { data, error } = await this.supabase
                .from('leads')
                .upsert({
                    nome_completo: leadData.nome_completo,
                    cpf: leadData.cpf.replace(/[^\d]/g, ''),
                    email: leadData.email,
                    telefone: leadData.telefone,
                    endereco: leadData.endereco,
                    produtos: leadData.produtos || [],
                    valor_total: leadData.valor_total,
                    meio_pagamento: leadData.meio_pagamento || 'PIX',
                    origem: leadData.origem || 'direto',
                    etapa_atual: leadData.etapa_atual || 1,
                    status_pagamento: leadData.status_pagamento || 'pendente',
                    order_bumps: leadData.order_bumps || [],
                    data_compra: leadData.data_compra || new Date().toISOString()
                }, { onConflict: 'cpf' })
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erro ao criar lead no Supabase:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Lead criado/atualizado no Supabase:', data);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na criação do lead:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePaymentStatus(cpf, status) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('💳 Atualizando status de pagamento no Supabase:', { cpf: cleanCPF, status });
            
            const { data, error } = await this.supabase
                .from('leads')
                .update({
                    status_pagamento: status,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', cleanCPF)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erro ao atualizar status de pagamento:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Status de pagamento atualizado no Supabase:', data);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na atualização do status:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStage(cpf, stage) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('📊 Atualizando etapa do lead no Supabase:', { cpf: cleanCPF, stage });
            
            const { data, error } = await this.supabase
                .from('leads')
                .update({
                    etapa_atual: stage,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', cleanCPF)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erro ao atualizar etapa do lead:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Etapa do lead atualizada no Supabase:', data);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na atualização da etapa:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllLeads() {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('📊 Buscando todos os leads no Supabase...');
            
            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erro ao buscar leads:', error);
                return { success: false, error: error.message };
            }
            
            console.log(`✅ ${data.length} leads encontrados no Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na busca dos leads:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLead(leadId, updateData) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('📝 Atualizando lead no Supabase:', { leadId, updateData });
            
            const { data, error } = await this.supabase
                .from('leads')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erro ao atualizar lead:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Lead atualizado no Supabase:', data);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na atualização do lead:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteLead(leadId) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('🗑️ Excluindo lead do Supabase:', leadId);
            
            const { error } = await this.supabase
                .from('leads')
                .delete()
                .eq('id', leadId);
            
            if (error) {
                console.error('❌ Erro ao excluir lead:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Lead excluído do Supabase');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro na exclusão do lead:', error);
            return { success: false, error: error.message };
        }
    }

    async bulkUpdateLeads(leadIds, updateData) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('📊 Atualizando leads em massa no Supabase:', { count: leadIds.length, updateData });
            
            const { data, error } = await this.supabase
                .from('leads')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .in('id', leadIds)
                .select();
            
            if (error) {
                console.error('❌ Erro na atualização em massa:', error);
                return { success: false, error: error.message };
            }
            
            console.log(`✅ ${data.length} leads atualizados no Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na atualização em massa:', error);
            return { success: false, error: error.message };
        }
    }

    async testConnection() {
        try {
            if (!this.supabase) {
                console.error('❌ Cliente Supabase não inicializado');
                return { success: false, error: 'Cliente Supabase não inicializado' };
            }

            console.log('🔍 Testando conexão com Supabase...', {
                attempt: this.connectionAttempts,
                hasClient: !!this.supabase
            });
            
            // Teste com timeout para evitar travamento
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout na conexão')), 10000);
            });
            
            const testPromise = this.supabase
                .from('leads')
                .select('id')
                .limit(1);
            
            const { data, error } = await Promise.race([testPromise, timeoutPromise]);
            
            if (error) {
                console.error('❌ Erro no teste de conexão:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                
                // Mensagens de erro mais específicas
                let errorMessage = error.message;
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Erro de conexão: Verifique as configurações do Supabase e CORS';
                } else if (error.code === '42P01') {
                    errorMessage = 'Tabela "leads" não encontrada no banco de dados';
                } else if (error.code === '42501') {
                    errorMessage = 'Permissões insuficientes para acessar a tabela';
                }
                
                return { success: false, error: errorMessage };
            }
            
            console.log('✅ Conexão com Supabase OK', { recordsFound: data?.length || 0 });
            return { success: true, message: 'Conexão estabelecida com sucesso' };
            
        } catch (error) {
            console.error('❌ Erro crítico no teste de conexão:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 200)
            });
            
            // Tratamento específico para diferentes tipos de erro
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Erro de rede: Verifique sua conexão e configurações CORS do Supabase';
            } else if (error.message.includes('Timeout')) {
                errorMessage = 'Timeout na conexão: Servidor Supabase pode estar indisponível';
            } else if (error.name === 'TypeError') {
                errorMessage = 'Erro de configuração: Verifique URL e chave do Supabase';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async getLeadsByStage() {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('📊 Contando leads por etapa no Supabase...');
            
            const { data, error } = await this.supabase
                .from('leads')
                .select('etapa_atual')
                .order('etapa_atual');
            
            if (error) {
                console.error('❌ Erro ao contar leads por etapa:', error);
                return { success: false, error: error.message };
            }
            
            // Contar leads por etapa
            const stageCount = {};
            for (let i = 1; i <= 26; i++) {
                stageCount[i] = 0;
            }
            
            data.forEach(lead => {
                const stage = lead.etapa_atual || 1;
                if (stage >= 1 && stage <= 26) {
                    stageCount[stage]++;
                }
            });
            
            console.log('✅ Contagem por etapa:', stageCount);
            return { success: true, data: stageCount };
            
        } catch (error) {
            console.error('❌ Erro na contagem por etapa:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeadsByDateRange(startDate, endDate = null) {
        if (!this.supabase) {
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            let query = this.supabase
                .from('leads')
                .select('*')
                .gte('created_at', startDate);
            
            if (endDate) {
                query = query.lte('created_at', endDate);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erro ao buscar leads por data:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na busca por data:', error);
            return { success: false, error: error.message };
        }
    }

    async searchLeads(searchTerm) {
        if (!this.supabase) {
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            const cleanCPF = searchTerm.replace(/[^\d]/g, '');
            
            let query = this.supabase.from('leads').select('*');
            
            // Se for número, buscar por CPF
            if (/^\d+$/.test(cleanCPF) && cleanCPF.length >= 3) {
                query = query.eq('cpf', cleanCPF);
            } else {
                // Se for texto, buscar por nome
                query = query.ilike('nome_completo', `%${searchTerm}%`);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erro na busca:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na busca:', error);
            return { success: false, error: error.message };
        }
    }

    // REMOVIDO: Todos os métodos de localStorage
    // O sistema agora usa EXCLUSIVAMENTE o Supabase
}

export class CPFValidator {
    static formatCPF(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        if (cleanCPF.length <= 11) {
            return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    static cleanCPF(cpf) {
        return cpf.replace(/[^\d]/g, '');
    }

    static isValidCPF(cpf) {
        const cleanCPF = this.cleanCPF(cpf);
        
        if (cleanCPF.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
        
        return this.validateCPFDigits(cleanCPF);
    }

    static validateCPFDigits(cpf) {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        let digit1 = remainder >= 10 ? 0 : remainder;

        if (digit1 !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        let digit2 = remainder >= 10 ? 0 : remainder;

        return digit2 === parseInt(cpf.charAt(10));
    }

    static applyCPFMask(input) {
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
        
        input.value = value;
        return value;
    }
}