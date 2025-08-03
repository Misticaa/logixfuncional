/**
 * Sistema de navegação
 */
export class Navigation {
    static init() {
        this.setupTrackingButtons();
        this.setupLogoRedirects();
        this.setupFooterLinks();
        this.setupHeroImageClick();
    }

    static setupTrackingButtons() {
        // Múltiplas estratégias para capturar cliques no botão de rastreamento
        const selectors = [
            '#trackingButton',
            '.cta-button',
            'button[type="button"]',
            '[data-action="track"]'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element.textContent && element.textContent.toLowerCase().includes('rastrear')) {
                    this.setupTrackingButton(element);
                }
            });
        });

        // Fallback global
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.textContent && 
                target.textContent.toLowerCase().includes('rastrear') &&
                (target.tagName === 'BUTTON' || target.classList.contains('cta-button'))) {
                e.preventDefault();
                e.stopPropagation();
                this.redirectToTracking();
            }
        });
    }

    static setupTrackingButton(button) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.redirectToTracking();
        });

        // Garantir que o botão seja clicável
        button.style.cursor = 'pointer';
        button.style.pointerEvents = 'auto';
        button.removeAttribute('disabled');
    }

    static setupLogoRedirects() {
        const logoSelectors = [
            '.logo img',
            '.logo-image',
            '#logoImage',
            '[data-logo]'
        ];

        logoSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(logo => {
                logo.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.redirectToHome();
                });

                logo.style.cursor = 'pointer';
                
                // Efeito hover
                logo.addEventListener('mouseenter', function() {
                    this.style.opacity = '0.8';
                    this.style.transition = 'opacity 0.3s ease';
                });
                
                logo.addEventListener('mouseleave', function() {
                    this.style.opacity = '1';
                });
            });
        });
    }

    static setupFooterLinks() {
        const footerLinks = document.querySelectorAll('.footer-link');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.redirectToHome();
            });

            link.style.cursor = 'pointer';
            link.style.transition = 'color 0.3s ease';
            
            // Efeito hover
            link.addEventListener('mouseenter', function() {
                this.style.color = '#1e4a6b';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.color = '#bdc3c7';
            });
        });
    }

    static setupHeroImageClick() {
        const heroImages = document.querySelectorAll('.hero-image img, #heroImage');
        heroImages.forEach(img => {
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.redirectToTracking();
            });

            img.style.cursor = 'pointer';
            
            // Efeitos de hover
            img.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            img.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

    static redirectToTracking() {
        console.log('Redirecionando para rastreamento...');
        try {
            this.clearOldData();
            
            // Redirecionar diretamente para a página de rastreamento
            window.location.href = '/rastreamento.html?focus=cpf';
        } catch (error) {
            console.error('Erro no redirecionamento:', error);
            // Fallback
            window.location.href = '/rastreamento.html?focus=cpf';
        }
    }

    static redirectToHome() {
        console.log('Redirecionando para home...');
        try {
            if (window.location.pathname.includes('rastreamento.html')) {
                window.location.href = './index.html';
            } else {
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('Erro no redirecionamento home:', error);
            window.location = './index.html';
        }
    }

    static clearOldData() {
        try {
            // Limpar localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('tracking_') || key.startsWith('cpf_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Limpar sessionStorage
            sessionStorage.clear();
            
            console.log('Dados antigos limpos');
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
        }
    }
}