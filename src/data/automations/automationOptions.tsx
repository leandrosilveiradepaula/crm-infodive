import type { TriggerType, ActionType } from '@/types/automation';
import { Zap, Clock, Mail, CheckCircle, Bell, TrendingUp, AlertTriangle, EyeOff, UserPlus, FileText, DollarSign, Package } from 'lucide-react';

export const triggerOptions: { id: TriggerType; label: string; icon: any; description: string }[] = [
    { id: 'deal_created', label: 'Novo Deal Criado', icon: Zap, description: 'Quando uma oportunidade é adicionada ao pipeline' },
    { id: 'deal_moved', label: 'Deal Mudou de Etapa', icon: TrendingUp, description: 'Quando um deal avança ou recua no funil' },
    { id: 'time_based', label: 'Baseado em Tempo', icon: Clock, description: 'Disparo agendado ou recorrente' },
    { id: 'deal_stagnant', label: 'Deal Estagnado', icon: AlertTriangle, description: 'Quando não há atividade por um período' },
    { id: 'deal_value_zero', label: 'Deal com Valor Zerado', icon: DollarSign, description: 'Quando uma oportunidade é criada sem valor definido' },
    { id: 'deal_no_products', label: 'Deal sem Produtos', icon: Package, description: 'Quando uma oportunidade não possui produtos cadastrados' },
    { id: 'proposal_sent', label: 'Proposta Enviada', icon: FileText, description: 'Quando uma proposta é enviada ao cliente' },
    { id: 'proposal_not_viewed', label: 'Proposta Não Visualizada', icon: EyeOff, description: 'O cliente não abriu a proposta após X dias' },
];

export const actionOptions: { id: ActionType; label: string; icon: any; description: string }[] = [
    { id: 'send_email', label: 'Enviar Email', icon: Mail, description: 'Envia um email automático (template)' },
    { id: 'create_task', label: 'Criar Tarefa', icon: CheckCircle, description: 'Cria uma tarefa para um usuário' },
    { id: 'send_notification', label: 'Enviar Notificação', icon: Bell, description: 'Notificação in-app para usuários' },
    { id: 'move_deal', label: 'Mover Deal', icon: TrendingUp, description: 'Move o deal para outra etapa' },
    { id: 'assign_to', label: 'Atribuir Responsável', icon: UserPlus, description: 'Muda o dono do deal/tarefa' },
];
