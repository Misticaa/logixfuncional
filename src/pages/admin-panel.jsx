import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/database.js';

const AdminPanel = () => {
  const [rawData, setRawData] = useState('');
  const [bulkImportData, setBulkImportData] = useState([]);
  const [dbService] = useState(() => new DatabaseService());
  const [isLoading, setIsLoading] = useState(false);

  // Parse raw bulk data function
  const parseRawBulkData = (rawText) => {
    if (!rawText || rawText.trim() === '') {
      return [];
    }

    const lines = rawText.trim().split('\n');
    const parsedData = [];

    lines.forEach((line, index) => {
      if (line.trim() === '') return;

      const columns = line.split('\t');
      
      if (columns.length >= 6) {
        const leadData = {
          nome_completo: columns[0]?.trim() || '',
          email: columns[1]?.trim() || '',
          telefone: columns[2]?.trim() || '',
          cpf: columns[3]?.replace(/[^\d]/g, '') || '',
          produtos: [{ nome: columns[4]?.trim() || 'Kit 12 caixas organizadoras + brinde' }],
          valor_total: parseFloat(columns[5]) || 67.90,
          endereco: columns[6]?.trim() || '',
          origem: 'direto', // Fix: Set valid origem value
          etapa_atual: 1,
          status_pagamento: 'pendente',
          data_compra: new Date().toISOString()
        };

        // Validate required fields
        if (leadData.nome_completo && leadData.cpf && leadData.cpf.length === 11) {
          parsedData.push(leadData);
        } else {
          console.warn(`Linha ${index + 1} ignorada - dados incompletos:`, leadData);
        }
      }
    });

    return parsedData;
  };

  // Confirm bulk import function
  const confirmBulkImport = async (importData) => {
    if (!importData || importData.length === 0) {
      throw new Error('Nenhum dado para importar');
    }

    console.log('📦 Iniciando importação em massa:', importData.length, 'leads');
    
    const results = {
      success: 0,
      errors: 0,
      details: []
    };

    for (const leadData of importData) {
      try {
        console.log('💾 Importando lead:', leadData.nome_completo);
        
        const result = await dbService.createLead(leadData);
        
        if (result.success) {
          results.success++;
          console.log('✅ Lead importado:', leadData.nome_completo);
        } else {
          results.errors++;
          results.details.push({
            nome: leadData.nome_completo,
            erro: result.error
          });
          console.error('❌ Erro ao importar lead:', leadData.nome_completo, result.error);
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          nome: leadData.nome_completo,
          erro: error.message
        });
        console.error('❌ Erro ao importar lead:', leadData.nome_completo, error.message);
      }
    }

    console.log('📊 Resultado da importação:', results);
    return results;
  };

  const handlePreview = () => {
    console.log('👁️ Gerando preview dos dados...');
    const parsed = parseRawBulkData(rawData);
    console.log('📊 Dados parseados:', parsed.length, 'leads');
    setBulkImportData(parsed);
  };

  const handleConfirmImport = async () => {
    console.log('🚀 Iniciando confirmação de importação...');
    console.log('📊 Dados disponíveis para importação:', bulkImportData.length);
    
    if (!bulkImportData || bulkImportData.length === 0) {
      alert('Nenhum dado para importar. Faça a pré-visualização primeiro.');
      return;
    }

    setIsLoading(true);

    try {
      const results = await confirmBulkImport(bulkImportData);
      
      if (results.success > 0) {
        alert(`Importação concluída! ${results.success} leads importados com sucesso.${results.errors > 0 ? ` ${results.errors} erros encontrados.` : ''}`);
      } else {
        alert('Nenhum lead foi importado. Verifique os dados e tente novamente.');
      }
      
      // Clear data after successful import
      setBulkImportData([]);
      setRawData('');
      
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      alert(`Falha na importação: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    setRawData('');
    setBulkImportData([]);
  };

  return (
    <div className="admin-panel">
      <h1>Painel de Importação em Massa</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="bulkDataTextarea">Dados para Importar:</label>
        <textarea
          id="bulkDataTextarea"
          placeholder="João Silva Santos	joao@email.com	11999999999	12345678901	Kit 12 caixas organizadoras	67.90	Rua das Flores	123	Apto 45	Centro	01234-567	São Paulo	SP	BR"
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '15px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            resize: 'vertical',
          }}
        />
      </div>

      <div className="actions" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handlePreview}
          style={{
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          <i className="fas fa-eye"></i> Visualizar
        </button>
        
        <button 
          onClick={handleClearData}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          <i className="fas fa-trash"></i> Limpar
        </button>
      </div>

      {/* Preview Section */}
      {bulkImportData.length > 0 && (
        <div id="bulkPreviewSection">
          <h4 style={{ color: '#1e4a6b', marginBottom: '15px' }}>
            <i className="fas fa-table"></i> Preview dos Dados
          </h4>
          
          <div 
            id="bulkPreviewContainer" 
            style={{
              maxHeight: '400px',
              overflow: 'auto',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <table className="bulk-import-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>Nome</th>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>Email</th>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>Telefone</th>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>CPF</th>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>Produto</th>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>Valor</th>
                  <th style={{ background: '#1e4a6b', color: 'white', padding: '10px 8px' }}>Endereço</th>
                </tr>
              </thead>
              <tbody>
                {bulkImportData.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>{item.nome_completo}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>{item.email}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>{item.telefone}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>{item.cpf}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>{item.produtos[0]?.nome}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>R$ {item.valor_total.toFixed(2)}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e1e5e9' }}>{item.endereco}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p style={{ fontWeight: '600', color: '#1e4a6b', marginBottom: '20px' }}>
            {bulkImportData.length} leads prontos para importação
          </p>
          
          <button 
            onClick={handleConfirmImport}
            disabled={isLoading}
            style={{
              background: isLoading ? '#6c757d' : 'linear-gradient(45deg, #28a745, #20c997)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              width: '100%',
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Importando...
              </>
            ) : (
              <>
                <i className="fas fa-database"></i> Confirmar Importação para Supabase
              </>
            )}
          </button>
        </div>
      )}

      {bulkImportData.length === 0 && rawData.trim() !== '' && (
        <p style={{ color: '#dc3545', fontWeight: '600' }}>
          Clique em "Visualizar" para processar os dados antes de importar.
        </p>
      )}
    </div>
  );
};

export default AdminPanel;