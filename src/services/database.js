/**
 * Serviço de banco de dados - Versão simplificada para localStorage
 */
export class DatabaseService {
    constructor() {
        console.log('🗄️ DatabaseService inicializado (localStorage)');
    }

    async getLeadByCPF(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
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
            console.error('❌ Erro ao atualizar status de pagamento:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStage(cpf, stage) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
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
            console.error('❌ Erro ao atualizar etapa do lead:', error);
            return { success: false, error: error.message };
        }
    }

    // Método para compatibilidade
    async getData() {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            return { success: true, data: leads };
        } catch (error) {
            console.error('❌ Erro ao obter dados:', error);
            return { success: false, error: error.message };
        }
    }
}