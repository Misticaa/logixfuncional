/**
 * Script principal da página inicial
 */
import { Navigation } from './src/components/navigation.js';

(function() {
    'use strict';
    
    console.log('Script principal carregando...');
    
    function initializeMainPage() {
        console.log('Inicializando página principal...');
        
        try {
            // Inicializar navegação
            Navigation.init();
            
            // Configurar animações de scroll
            setupScrollAnimations();
            
            // Configurar efeito de header no scroll
            setupHeaderScrollEffect();
            
            // Configurar efeitos de hover nos ícones de serviço
            setupServiceIconEffects();
            
            console.log('Página principal inicializada com sucesso');
        } catch (error) {
            console.error('Erro na inicialização da página principal:', error);
        }
    }
    
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observar itens de serviço
        const serviceItems = document.querySelectorAll('.service-item, .driver-service');
        serviceItems.forEach(function(item) {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(item);
        });
    }
    
    function setupHeaderScrollEffect() {
        window.addEventListener('scroll', function() {
            const header = document.querySelector('.header');
            if (header) {
                if (window.scrollY > 100) {
                    header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    header.style.backdropFilter = 'blur(10px)';
                } else {
                    header.style.backgroundColor = '#fff';
                    header.style.backdropFilter = 'none';
                }
            }
        });
    }
    
    function setupServiceIconEffects() {
        const serviceIcons = document.querySelectorAll('.service-icon');
        serviceIcons.forEach(function(icon) {
            icon.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1) rotate(5deg)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            icon.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1) rotate(0deg)';
            });
        });
    }
    
    // Expor função globalmente como fallback
    window.redirectToTracking = function() {
        console.log('Função global redirectToTracking chamada');
        Navigation.redirectToTracking();
    };
    
    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMainPage);
    } else {
        initializeMainPage();
    }
    
    // Fallback adicional
    setTimeout(initializeMainPage, 100);
    
    console.log('Script principal carregado');
})();