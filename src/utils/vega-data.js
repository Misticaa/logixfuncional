/**
 * Utilitários para processar dados do Vega Checkout
 */
export class VegaDataProcessor {
    static parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const vegaData = {};

        // Mapear parâmetros do Vega para nossos campos
        const paramMapping = {
            'nome': 'nome_completo',
            'name': 'nome_completo',
            'cpf': 'cpf',
            'email': 'email',
            'telefone': 'telefone',
            'phone': 'telefone',
            'endereco': 'endereco',
            'address': 'endereco',
            'valor': 'valor_total',
            'amount': 'valor_total',
            'payment': 'meio_pagamento',
            'pagamento': 'meio_pagamento'
        };

        // Extrair dados básicos
        for (const [vegaParam, ourField] of Object.entries(paramMapping)) {
            const value = urlParams.get(vegaParam);
            if (value) {
                vegaData[ourField] = decodeURIComponent(value);
            }
        }

        // Processar order bumps
        vegaData.order_bumps = this.extractOrderBumps(urlParams);

        // Definir origem
        vegaData.origem = 'direto';
        vegaData.data_compra = new Date().toISOString();

        // Produto principal sempre fixo
        vegaData.produtos = [{
            nome: 'Kit 12 caixas organizadoras + brinde',
            preco: vegaData.valor_total || 0,
            imagem: '/traduza-have-you-propose copy.png'
        }];

        return vegaData;
    }

    static extractOrderBumps(urlParams) {
        const orderBumps = [];
        
        // Lista de order bumps possíveis
        const possibleBumps = [
            {
                id: 'bump1',
                nome: 'Pague em Até 5 Minutos e Ganhe Mais 3 Caixas Organizadoras',
                preco: 0.00,
                imagem: '/traduza-have-you-propose copy.png',
                params: ['bump1', 'bonus_caixas', 'extra_caixas']
            },
            {
                id: 'bump2',
                nome: 'Leve Mais 8 Caixas Pela Metade do Preço',
                preco: 39.90,
                imagem: '/traduza-have-you-propose copy.png',
                params: ['bump2', 'caixas_extras', 'mais_caixas']
            },
            {
                id: 'bump3',
                nome: 'Kit de 6 Potes Herméticos',
                preco: 29.90,
                imagem: '/traduza-have-you-propose copy.png',
                params: ['bump3', 'potes', 'hermeticos']
            }
        ];

        // Verificar quais bumps foram comprados
        possibleBumps.forEach(bump => {
            const wasPurchased = bump.params.some(param => {
                const value = urlParams.get(param);
                return value && (value === '1' || value === 'true' || value === 'yes');
            });

            if (wasPurchased) {
                orderBumps.push(bump);
            }
        });

        return orderBumps;
    }

    static generateMockVegaData(cpf) {
        // Gerar dados mock para teste quando não há parâmetros Vega
        const names = [
            'João Silva Santos', 'Maria Oliveira Costa', 'Pedro Souza Lima',
            'Ana Paula Ferreira', 'Carlos Eduardo Alves', 'Fernanda Santos Rocha'
        ];
        
        const emails = [
            'joao.silva@email.com', 'maria.costa@email.com', 'pedro.lima@email.com',
            'ana.ferreira@email.com', 'carlos.alves@email.com', 'fernanda.rocha@email.com'
        ];

        const addresses = [
            'Rua das Flores, 123 - Centro - São Paulo/SP - CEP: 01234-567',
            'Av. Paulista, 456 - Bela Vista - São Paulo/SP - CEP: 01310-100',
            'Rua Augusta, 789 - Consolação - São Paulo/SP - CEP: 01305-000'
        ];

        const cpfIndex = parseInt(cpf.slice(-2)) % names.length;
        
        return {
            nome_completo: names[cpfIndex],
            cpf: cpf,
            email: emails[cpfIndex],
            telefone: `(11) 9${cpf.slice(-8)}`,
            endereco: addresses[cpfIndex % addresses.length],
            valor_total: 67.90,
            meio_pagamento: 'PIX',
            origem: 'direto',
            data_compra: new Date().toISOString(),
            produtos: [{
                nome: 'Kit 12 caixas organizadoras + brinde',
                preco: 67.90,
                imagem: '/traduza-have-you-propose copy.png'
            }],
            order_bumps: [
                {
                    id: 'bump2',
                    nome: 'Leve Mais 8 Caixas Pela Metade do Preço',
                    preco: 39.90,
                    imagem: '/traduza-have-you-propose copy.png'
                }
            ]
        };
    }

    static isVegaOrigin() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('origem') === 'vega' || 
               urlParams.has('nome') || 
               urlParams.has('name') ||
               urlParams.has('vega');
    }
}