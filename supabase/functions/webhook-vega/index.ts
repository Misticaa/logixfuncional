import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, api-secret",
};

interface VegaWebhookData {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  produto?: string;
  valor?: number;
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
          mensagem: "Método não permitido. Use POST." 
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

    // Verificar autenticação via api-secret
    const apiSecret = req.headers.get('api-secret');
    const expectedSecret = 'SUA_CHAVE_SECRETA_DO_VEGA';
    
    if (!apiSecret || apiSecret !== expectedSecret) {
      console.log('❌ Tentativa de acesso não autorizada:', {
        providedSecret: apiSecret ? `${apiSecret.substring(0, 10)}...` : 'null',
        expectedSecret: `${expectedSecret.substring(0, 10)}...`
      });
      
      return new Response(
        JSON.stringify({ 
          status: "error", 
          mensagem: "Não autorizado. api-secret inválida ou ausente." 
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // Parse do body da requisição
    let webhookData: VegaWebhookData;
    try {
      webhookData = await req.json();
    } catch (error) {
      console.error('❌ Erro ao fazer parse do JSON:', error);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          mensagem: "JSON inválido no body da requisição." 
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
    if (!webhookData.nome || !webhookData.cpf) {
      console.error('❌ Campos obrigatórios ausentes:', webhookData);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          mensagem: "Campos obrigatórios ausentes: nome e cpf são necessários." 
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

    console.log('📦 Webhook Vega recebido:', {
      nome: webhookData.nome,
      cpf: webhookData.cpf,
      email: webhookData.email,
      telefone: webhookData.telefone,
      produto: webhookData.produto,
      valor: webhookData.valor
    });

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preparar dados para inserção
    const pedidoData = {
      nome: webhookData.nome,
      cpf: webhookData.cpf.replace(/[^\d]/g, ''), // Limpar CPF
      email: webhookData.email || null,
      telefone: webhookData.telefone || null,
      produto: webhookData.produto || 'Kit 12 caixas organizadoras + brinde',
      valor: webhookData.valor || 67.90,
      etapa_atual: 'Seu pedido foi criado',
      etapa_data: new Date().toISOString()
    };

    console.log('💾 Salvando no Supabase:', pedidoData);

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('rastreamento_pedidos')
      .insert([pedidoData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
      
      // Se for erro de duplicata, tentar atualizar
      if (error.code === '23505') { // Unique violation
        console.log('🔄 CPF já existe, tentando atualizar...');
        
        const { data: updateData, error: updateError } = await supabase
          .from('rastreamento_pedidos')
          .update({
            nome: pedidoData.nome,
            email: pedidoData.email,
            telefone: pedidoData.telefone,
            produto: pedidoData.produto,
            valor: pedidoData.valor,
            etapa_data: pedidoData.etapa_data
          })
          .eq('cpf', pedidoData.cpf)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erro ao atualizar registro:', updateError);
          return new Response(
            JSON.stringify({ 
              status: "error", 
              mensagem: `Erro ao atualizar dados: ${updateError.message}` 
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

        console.log('✅ Registro atualizado com sucesso:', updateData);
        return new Response(
          JSON.stringify({ 
            status: "ok", 
            mensagem: "Lead atualizado com sucesso",
            data: updateData
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

      return new Response(
        JSON.stringify({ 
          status: "error", 
          mensagem: `Erro ao salvar dados: ${error.message}` 
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

    console.log('✅ Lead salvo com sucesso:', data);

    // Retornar sucesso
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        mensagem: "Lead salvo com sucesso",
        data: {
          id: data.id,
          nome: data.nome,
          cpf: data.cpf,
          etapa_atual: data.etapa_atual,
          created_at: data.created_at
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

  } catch (error) {
    console.error('💥 Erro interno no webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        status: "error", 
        mensagem: "Erro interno do servidor",
        details: error.message
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