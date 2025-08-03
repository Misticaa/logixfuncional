/**
 * Utilitários para validação e formatação de CPF
 */
export class CPFValidator {
    static formatCPF(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        if (cleanCPF.length <= 11) {
            return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    static cleanCPF(cpf) {
        return cpf.replace(/[^\d]/g, '');
    }

    static isValidCPF(cpf) {
        const cleanCPF = this.cleanCPF(cpf);
        
        // Verificar se tem 11 dígitos
        if (cleanCPF.length !== 11) return false;
        
        // Verificar se não são todos os dígitos iguais
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
        
        // Validar dígitos verificadores
        return this.validateCPFDigits(cleanCPF);
    }

    static validateCPFDigits(cpf) {
        // Primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        let digit1 = remainder >= 10 ? 0 : remainder;

        if (digit1 !== parseInt(cpf.charAt(9))) return false;

        // Segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        let digit2 = remainder >= 10 ? 0 : remainder;

        return digit2 === parseInt(cpf.charAt(10));
    }

    static applyCPFMask(input) {
        let value = input.value.replace(/[^\d]/g, '');
        
        // Limitar a 11 dígitos
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        // Aplicar máscara
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
        
        input.value = value;
        return value;
    }
}