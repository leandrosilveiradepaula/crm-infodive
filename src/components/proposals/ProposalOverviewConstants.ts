export interface ProjectObjective {
    number: string;
    title: string;
    description: string;
}

export const defaultObjectives: ProjectObjective[] = [
    {
        number: '01',
        title: 'Performance Elevada',
        description: 'Infraestrutura otimizada para máximo desempenho e disponibilidade'
    },
    {
        number: '02',
        title: 'Segurança Nativa',
        description: 'Proteção integrada em todas as camadas da solução'
    },
    {
        number: '03',
        title: 'Escalabilidade',
        description: 'Crescimento alinhado às necessidades do negócio'
    },
    {
        number: '04',
        title: 'Suporte Especializado',
        description: 'Equipe técnica dedicada e certificada'
    }
];
