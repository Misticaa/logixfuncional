/**
 * Serviço de sincronização automática com Supabase
 */
import { createClient } from '@supabase/supabase-js';

export class SupabaseService {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseAnonKey) {
                this.supabase = createClient(supabaseUrl, supabaseAnonKey);
                this.isConnected = true;
                console.log('✅ Supabase conectado com sucesso');
            } else {
                console.warn('⚠️ Variáveis do Supabase não encontradas');
            }
        } catch (error) {
            console.error('❌ Erro ao conectar com Supabase:', error);
        }
    }

    async saveLead(leadData) {
        if (!this.isConnected) {
            console.warn('⚠️ Supabase não conectado, salvando apenas no localStorage');
            return { success: false, error: 'Supabase não conectado' };
        }

        try {
            // Preparar dados para o Supabase
            const supabaseData = {
                nome_completo: leadData.nome_completo,
                cpf: leadData.cpf.replace(/[^\d]/g, ''),
                email: leadData.email || null,
                telefone: leadData.telefone || null,
                endereco: leadData.endereco || null,
                produtos: leadData.produtos || [],
                valor_total: parseFloat(leadData.valor_total) || 0,
                meio_pagamento: leadData.meio_pagamento || 'PIX',
                data_compra: leadData.data_compra || new Date().toISOString(),
                origem: leadData.origem || 'direto',
                etapa_atual: leadData.etapa_atual || 1,
                status_pagamento: leadData.status_pagamento || 'pendente',
                order_bumps: leadData.order_bumps || [],
                created_at: leadData.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('💾 Salvando lead no Supabase:', {
                nome: supabaseData.nome_completo,
                cpf: supabaseData.cpf,
                etapa_atual: supabaseData.etapa_atual
            });

            // Tentar inserir novo lead
            const { data, error } = await this.supabase
                .from('leads')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                // Se for erro de duplicata (CPF já existe), atualizar
                if (error.code === '23505') {
                    console.log('🔄 CPF já existe, atualizando lead...');
                    return await this.updateLead(supabaseData.cpf, supabaseData);
                }
                throw error;
            }

            console.log('✅ Lead salvo no Supabase:', data);
            return { success: true, data };

        } catch (error) {
            console.error('❌ Erro ao salvar lead no Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLead(cpf, updateData) {
        if (!this.isConnected) {
            return { success: false, error: 'Supabase não conectado' };
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            updateData.updated_at = new Date().toISOString();

            console.log('🔄 Atualizando lead no Supabase:', {
                cpf: cleanCPF,
                etapa_atual: updateData.etapa_atual,
                status_pagamento: updateData.status_pagamento
            });

            const { data, error } = await this.supabase
                .from('leads')
                .update(updateData)
                .eq('cpf', cleanCPF)
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Lead atualizado no Supabase:', data);
            return { success: true, data };

        } catch (error) {
            console.error('❌ Erro ao atualizar lead no Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeadByCPF(cpf) {
        if (!this.isConnected) {
            console.warn('⚠️ Supabase não conectado, buscando no localStorage');
            return this.getLeadFromLocalStorage(cpf);
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');

            console.log('🔍 Buscando lead no Supabase:', cleanCPF);

            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('cpf', cleanCPF)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('❌ Lead não encontrado no Supabase');
                    return { success: false, error: 'Lead não encontrado' };
                }
                throw error;
            }

            console.log('✅ Lead encontrado no Supabase:', {
                nome: data.nome_completo,
                cpf: data.cpf,
                etapa_atual: data.etapa_atual,
                status_pagamento: data.status_pagamento,
                updated_at: data.updated_at
            });

            return { success: true, data };

        } catch (error) {
            console.error('❌ Erro ao buscar lead no Supabase:', error);
            // Fallback para localStorage
            return this.getLeadFromLocalStorage(cpf);
        }
    }

    getLeadFromLocalStorage(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (lead) {
                console.log('✅ Lead encontrado no localStorage (fallback):', lead);
                return { success: true, data: lead };
            } else {
                console.log('❌ Lead não encontrado no localStorage');
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao buscar no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStage(cpf, newStage) {
        const updateData = {
            etapa_atual: newStage,
            updated_at: new Date().toISOString()
        };

        return await this.updateLead(cpf, updateData);
    }

    async updatePaymentStatus(cpf, status) {
        const updateData = {
            status_pagamento: status,
            updated_at: new Date().toISOString()
        };

        // Se pagamento foi confirmado, avançar para etapa 12
        if (status === 'pago') {
            updateData.etapa_atual = 12;
        }

        return await this.updateLead(cpf, updateData);
    }

    isSupabaseConnected() {
        return this.isConnected;
    }
}