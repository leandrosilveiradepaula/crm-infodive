import React, { useState } from 'react';
import { DollarSign, TrendingUp, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency as formatCurrencyUtil } from '@/utils/format';

interface CommissionWidgetProps {
    projectedCommission: number;
    guaranteedCommission: number;
    commissionRate: number;
}

export const CommissionWidget = ({ projectedCommission, guaranteedCommission, commissionRate }: CommissionWidgetProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const formatValue = (val: number) => {
        return formatCurrencyUtil(val, { compact: true });
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-card p-1.5 rounded-2xl border border-border shadow-sm overflow-hidden group">
                {/* Projected */}
                <div className="flex items-center gap-3 bg-info/10 px-4 py-2 rounded-xl border border-info/20 hover:border-info/40 transition-all cursor-default">
                    <div className="h-8 w-8 rounded-lg bg-info/20 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-info" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-info uppercase tracking-widest leading-none mb-1">Minha Meta</p>
                        <div className={`transition-all duration-500 ${isVisible ? 'blur-0' : 'blur-md select-none'}`}>
                            <p className="text-sm font-black text-foreground">{formatValue(projectedCommission)}</p>
                        </div>
                    </div>
                </div>

                {/* Guaranteed */}
                <div className="flex items-center gap-3 bg-success/10 px-4 py-2 rounded-xl border border-success/20 hover:border-success/40 transition-all cursor-default relative">
                    <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-success" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-success uppercase tracking-widest leading-none mb-1">Garantido</p>
                        <div className={`transition-all duration-500 ${isVisible ? 'blur-0' : 'blur-md select-none'}`}>
                            <p className="text-sm font-black text-foreground">{formatValue(guaranteedCommission)}</p>
                        </div>
                    </div>
                </div>

                {/* Rate Badge */}
                <div className="px-4 py-2 bg-muted rounded-xl border border-border hidden 2xl:block">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">Margem Média</p>
                    <p className="text-xs text-foreground font-black">{commissionRate.toFixed(1)}%</p>
                </div>

                {/* Global Toggle Button */}
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className={`
                        flex items-center justify-center h-10 w-10 rounded-xl transition-all border
                        ${isVisible
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                        }
                    `}
                    title={isVisible ? 'Ocultar Valores' : 'Mostrar Valores Sensíveis'}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isVisible ? 'visible' : 'hidden'}
                            initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
};
