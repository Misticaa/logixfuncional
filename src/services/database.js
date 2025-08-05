/**
 * Serviço de banco de dados - Integração Supabase EXCLUSIVA
 * VERSÃO 17.0: PAINEL CENTRALIZADO - SUPABASE COMO FONTE ÚNICA
 */
import { createClient } from '@supabase/supabase-js';

export class DatabaseService {
    constructor() {
        this.supabase = this.initializeSupabase();
        this.isAdmin = this.checkIfAdmin();
        console.log('🗄️ DatabaseService inicializado - Versão 17.0 Centralizada');
        console.log('👤 Modo:', this.isAdmin ? 'PAINEL ADMIN' : 'TRANSPORTADORA');
    }

    checkIfAdmin() {
        return window.location.pathname.includes('painelk7') || 
               window.location.pathname.includes('admin');
    }

    initializeSupabase() {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Variáveis do Supabase não encontradas!');
                console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'CONFIGURADA' : 'AUSENTE');
                console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'CONFIGURADA' : 'AUSENTE');
                return null;
            }
            
            const client = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Cliente Supabase inicializado com sucesso');
            return client;
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            return null;
        }
    }

    async getLeadByCPF(cpf) {
        if (!this.supabase) {
            console.error('❌ Supabase não disponível');
            return { success: false, error: 'Supabase não configurado' };
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
        if (!this.supabase) {
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('🔍 Testando conexão com Supabase...');
            
            const { data, error } = await this.supabase
                .from('leads')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('❌ Erro no teste de conexão:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Conexão com Supabase OK');
            return { success: true, message: 'Conexão estabelecida com sucesso' };
            
        } catch (error) {
            console.error('❌ Erro no teste de conexão:', error);
            return { success: false, error: error.message };
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