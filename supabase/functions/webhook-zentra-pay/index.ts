import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Signature",
};

interface ZentraPayWebhookData {
  transaction_id: string;
  external_id: string;
  status: string;
  amount: number;
  payment_method: string;
  customer: {
    name: string;
    document: string;
    email: string;
    phone: string;
  };
  product_id?: string;
  paid_at?: string;
}

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "Método não permitido. Use POST." 
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    console.log('🔔 Webhook Zentra Pay Brasil recebido');
    console.log('📡 Headers:', req.headers);

    // Parse do body da requisição
    let webhookData: ZentraPayWebhookData;
    try {
      const bodyText = await req.text();
      console.log('📦 Body recebido:', bodyText);
      webhookData = JSON.parse(bodyText);
    } catch (error) {
      console.error('❌ Erro ao fazer parse do JSON:', error);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "JSON inválido no body da requisição." 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // Validar campos obrigatórios
    if (!webhookData.transaction_id || !webhookData.customer?.document) {
      console.error('❌ Campos obrigatórios ausentes:', webhookData);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "Campos obrigatórios ausentes: transaction_id e customer.document são necessários." 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    console.log('💳 Dados do pagamento Zentra Pay:', {
      transaction_id: webhookData.transaction_id,
      external_id: webhookData.external_id,
      status: webhookData.status,
      amount: webhookData.amount,
      customer_document: webhookData.customer.document,
      customer_name: webhookData.customer.name,
      product_id: webhookData.product_id
    });

    // Processar apenas pagamentos confirmados
    if (webhookData.status === 'paid' || webhookData.status === 'approved' || webhookData.status === 'completed') {
      console.log('✅ Pagamento confirmado, atualizando lead...');

      // Inicializar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const cpf = webhookData.customer.document.replace(/[^\d]/g, '');
      
      // Determinar nova etapa baseada no produto
      let newStage = 12; // Padrão para taxa alfandegária
      if (webhookData.product_id) {
        const stageMap = {
          'UlCGsjOn': 12, // Taxa Alfandegária -> Liberado
          'xPTSsVmH': 17, // Tentativa 1 -> Próxima etapa
          'xkgmEGMN': 21, // Tentativa 2 -> Próxima etapa  
          'jnHNAKcF': 25  // Tentativa 3 -> Próxima etapa
        };
        newStage = stageMap[webhookData.product_id] || 12;
      }

      // Atualizar lead no Supabase
      const { data, error } = await supabase
        .from('leads')
        .update({
          status_pagamento: 'pago',
          etapa_atual: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('cpf', cpf)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar lead no Supabase:', error);
        return new Response(
          JSON.stringify({ 
            status: "error", 
            message: `Erro ao atualizar lead: ${error.message}` 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            }
          }
        );
      }

      console.log('✅ Lead atualizado com sucesso:', {
        cpf: cpf,
        new_stage: newStage,
        payment_status: 'pago',
        product_id: webhookData.product_id
      });

      return new Response(
        JSON.stringify({ 
          status: "success", 
          message: "Pagamento processado e lead atualizado com sucesso",
          data: {
            cpf: cpf,
            new_stage: newStage,
            transaction_id: webhookData.transaction_id,
            updated_at: new Date().toISOString()
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );

    } else {
      console.log(`⚠️ Status não processado: ${webhookData.status}`);
      
      return new Response(
        JSON.stringify({ 
          status: "received", 
          message: `Webhook recebido com status: ${webhookData.status}`,
          data: {
            transaction_id: webhookData.transaction_id,
            status: webhookData.status,
            timestamp: new Date().toISOString()
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

  } catch (error) {
    console.error('💥 Erro interno no webhook Zentra Pay:', error);
    
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: "Erro interno do servidor",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  }
});