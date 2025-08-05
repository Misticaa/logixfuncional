/**
 * Serviço de banco de dados - Integração Supabase
 */
import { createClient } from '@supabase/supabase-js';

export class DatabaseService {
    constructor() {
        this.supabase = this.initializeSupabase();
        console.log('🗄️ DatabaseService inicializado (Supabase)');
    }

    initializeSupabase() {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                console.warn('⚠️ Variáveis do Supabase não encontradas, usando localStorage como fallback');
                return null;
            }
            
            const client = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Cliente Supabase inicializado');
            return client;
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            return null;
        }
    }

    async getLeadByCPF(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            
            // 🎯 PAINEL CENTRALIZADO: Buscar APENAS no localStorage (painel)
            console.log('🎯 Buscando lead no painel centralizado para CPF:', cleanCPF);
            return this.getLeadFromLocalStorage(cleanCPF);
            
        } catch (error) {
            console.error('❌ Erro ao buscar lead:', error);
            // Fallback para localStorage
            return this.getLeadFromLocalStorage(cpf);
        }
    }

    getLeadFromLocalStorage(cleanCPF) {
        try {
            console.log('🔍 Buscando lead no localStorage para CPF:', cleanCPF);
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (lead) {
                console.log('✅ Lead encontrado no localStorage:', lead);
                return { success: true, data: lead };
            } else {
                console.log('❌ Lead não encontrado no localStorage para CPF:', cleanCPF);
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao buscar lead no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    async createLead(leadData) {
        try {
            // 🎯 PAINEL CENTRALIZADO: Salvar APENAS no localStorage (painel)
            console.log('🎯 Salvando lead no painel centralizado (localStorage)');
            return this.createLeadInLocalStorage(leadData);
            
        } catch (error) {
            console.error('❌ Erro ao criar lead:', error);
            return this.createLeadInLocalStorage(leadData);
        }
    }

    createLeadInLocalStorage(leadData) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leadData.id = Date.now().toString();
            leadData.created_at = new Date().toISOString();
            leadData.updated_at = new Date().toISOString();
            
            leads.push(leadData);
            localStorage.setItem('leads', JSON.stringify(leads));
            
            console.log('✅ Lead criado no localStorage:', leadData);
            return { success: true, data: leadData };
        } catch (error) {
            console.error('❌ Erro ao criar lead no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePaymentStatus(cpf, status) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            
            // 🎯 PAINEL CENTRALIZADO: Atualizar APENAS no localStorage (painel)
            console.log('🎯 Atualizando status no painel centralizado:', status);
            return this.updatePaymentStatusInLocalStorage(cleanCPF, status);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status de pagamento:', error);
            return this.updatePaymentStatusInLocalStorage(cpf, status);
        }
    }

    updatePaymentStatusInLocalStorage(cleanCPF, status) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (leadIndex !== -1) {
                leads[leadIndex].status_pagamento = status;
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                
                console.log('✅ Status de pagamento atualizado no localStorage:', status);
                return { success: true, data: leads[leadIndex] };
            } else {
                console.log('❌ Lead não encontrado para atualizar status de pagamento');
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar status de pagamento no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStage(cpf, stage) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            
            // 🎯 PAINEL CENTRALIZADO: Atualizar APENAS no localStorage (painel)
            console.log('🎯 Atualizando etapa no painel centralizado:', stage);
            return this.updateLeadStageInLocalStorage(cleanCPF, stage);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa do lead:', error);
            return this.updateLeadStageInLocalStorage(cpf, stage);
        }
    }

    updateLeadStageInLocalStorage(cleanCPF, stage) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (leadIndex !== -1) {
                leads[leadIndex].etapa_atual = stage;
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                
                console.log('✅ Etapa do lead atualizada no localStorage:', stage);
                return { success: true, data: leads[leadIndex] };
            } else {
                console.log('❌ Lead não encontrado para atualizar etapa');
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa do lead no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    async syncLeadToSupabase(leadData) {
        if (!this.supabase) {
            console.warn('⚠️ Supabase não disponível para sincronização');
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            console.log('🔄 Sincronizando lead para Supabase:', leadData.cpf);
            
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
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'cpf'
                })
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erro ao sincronizar com Supabase:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Lead sincronizado com Supabase:', data);
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            return { success: false, error: error.message };
        }
    }

    async syncAllLeadsToSupabase() {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log(`🔄 Sincronizando ${leads.length} leads para Supabase...`);
            
            const results = {
                success: 0,
                errors: 0,
                total: leads.length
            };
            
            for (const lead of leads) {
                const result = await this.syncLeadToSupabase(lead);
                if (result.success) {
                    results.success++;
                } else {
                    results.errors++;
                }
            }
            
            console.log('📊 Sincronização completa:', results);
            return results;
            
        } catch (error) {
            console.error('❌ Erro na sincronização em massa:', error);
            return { success: 0, errors: 1, total: 0, error: error.message };
        }
    }
    async syncAllLeadsToSupabase() {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log(`🔄 Sincronizando ${leads.length} leads para Supabase...`);
            
            const results = {
                success: 0,
                errors: 0,
                total: leads.length
            };
            
            for (const lead of leads) {
                const result = await this.syncLeadToSupabase(lead);
                if (result.success) {
                    results.success++;
                } else {
                    results.errors++;
                }
            }
            
            console.log('📊 Sincronização completa:', results);
            return results;
            
        } catch (error) {
            console.error('❌ Erro na sincronização em massa:', error);
            return { success: 0, errors: 1, total: 0, error: error.message };
        }
    }

    async getData() {
        try {
            // 🎯 PAINEL CENTRALIZADO: Buscar APENAS do localStorage (painel)
            console.log('🎯 Buscando dados do painel centralizado');
            return this.getDataFromLocalStorage();
            
        } catch (error) {
            console.error('❌ Erro ao obter dados:', error);
            return this.getDataFromLocalStorage();
        }
    }

    getDataFromLocalStorage() {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log(`📊 ${leads.length} leads encontrados no localStorage`);
            return { success: true, data: leads };
        } catch (error) {
            console.error('❌ Erro ao obter dados do localStorage:', error);
            return { success: false, error: error.message };
        }
    }
}