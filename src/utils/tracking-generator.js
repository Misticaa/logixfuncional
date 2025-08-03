/**
 * Gerador de dados de rastreamento
 */
export class TrackingGenerator {
    static generateTrackingData(userData) {
        const today = new Date();
        const trackingData = {
            cpf: userData.cpf,
            currentStep: 'customs',
            steps: [],
            liberationPaid: false,
            liberationDate: null,
            deliveryAttempts: 0,
            lastUpdate: today.toISOString()
        };

        const dates = this.generateRealisticDates(today, 11);
        const trackingSteps = this.getTrackingSteps();
        
        // Adicionar steps completados
        for (let i = 0; i < 10; i++) {
            trackingData.steps.push({
                id: i + 1,
                date: dates[i],
                title: trackingSteps[i].title,
                description: trackingSteps[i].description,
                isChina: trackingSteps[i].isChina || false,
                completed: true
            });
        }

        // Adicionar step atual (alfândega)
        trackingData.steps.push({
            id: 11,
            date: dates[10],
            title: trackingSteps[10].title,
            description: trackingSteps[10].description,
            completed: true,
            needsLiberation: true
        });

        return trackingData;
    }

    static generateRealisticDates(endDate, numSteps) {
        const dates = [];
        const now = new Date(); // Horário atual da consulta
        const today = new Date(endDate);
        
        // Dia -2
        const day1 = new Date(today);
        day1.setDate(day1.getDate() - 2);
        dates.push(this.getRandomTimeOnDate(day1));
        dates.push(this.getRandomTimeOnDate(day1));
        
        // Dia -1
        const day2 = new Date(today);
        day2.setDate(day2.getDate() - 1);
        for (let i = 2; i < 9; i++) {
            dates.push(this.getRandomTimeOnDate(day2));
        }
        
        // Hoje - HORÁRIOS SEMPRE ANTERIORES AO MOMENTO ATUAL
        // Para as duas últimas etapas que acontecem hoje
        dates.push(this.getTimeBeforeNow(today, now, 1)); // Primeira etapa de hoje
        dates.push(this.getTimeBeforeNow(today, now, 2)); // Segunda etapa de hoje (mais recente)
        
        return dates;
    }

    static getRandomTimeOnDate(date) {
        const newDate = new Date(date);
        const hour = Math.floor(Math.random() * 18) + 5; // 5h às 23h
        const minute = Math.floor(Math.random() * 60);
        newDate.setHours(hour, minute, 0, 0);
        return newDate;
    }

    /**
     * Gera horário anterior ao momento atual para etapas do dia atual
     */
    static getTimeBeforeNow(targetDate, currentTime, stepOrder) {
        const newDate = new Date(targetDate);
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        
        // Calcular quantas horas antes do horário atual
        let hoursBack;
        if (stepOrder === 1) {
            // Primeira etapa: entre 2-6 horas atrás
            hoursBack = Math.floor(Math.random() * 4) + 2; // 2-5 horas
        } else {
            // Segunda etapa: entre 30 minutos e 2 horas atrás
            hoursBack = Math.random() * 1.5 + 0.5; // 0.5-2 horas
        }
        
        // Subtrair as horas do horário atual
        const targetTime = new Date(currentTime);
        targetTime.setHours(targetTime.getHours() - hoursBack);
        
        // Garantir que não seja muito cedo (mínimo 6h da manhã)
        if (targetTime.getHours() < 6) {
            targetTime.setHours(6 + Math.floor(Math.random() * 2)); // 6h-8h
            targetTime.setMinutes(Math.floor(Math.random() * 60));
        }
        
        // Aplicar a data correta mantendo o horário calculado
        newDate.setHours(targetTime.getHours(), targetTime.getMinutes(), 0, 0);
        
        return newDate;
    }

    static getTrackingSteps() {
        return [
            { title: "Seu pedido foi criado", description: "Seu pedido foi criado" },
            { title: "Preparando para envio", description: "O seu pedido está sendo preparado para envio" },
            { title: "Pedido enviado", description: "[China] O vendedor enviou seu pedido", isChina: true },
            { title: "Centro de triagem", description: "[China] O pedido chegou ao centro de triagem de Shenzhen", isChina: true },
            { title: "Centro logístico", description: "[China] Pedido saiu do centro logístico de Shenzhen", isChina: true },
            { title: "Trânsito internacional", description: "[China] Coletado. O pedido está em trânsito internacional", isChina: true },
            { title: "Liberado para exportação", description: "[China] O pedido foi liberado na alfândega de exportação", isChina: true },
            { title: "Saiu da origem", description: "Pedido saiu da origem: Shenzhen" },
            { title: "Chegou no Brasil", description: "Pedido chegou no Brasil" },
            { title: "Centro de distribuição", description: "Pedido em trânsito para CURITIBA/PR" },
            { title: "Alfândega de importação", description: "Pedido chegou na alfândega de importação: CURITIBA/PR" }
        ];
    }
}