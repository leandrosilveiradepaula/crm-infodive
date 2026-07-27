'use client';

import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ACCENT_COLORS = [
  { name: 'Azul Nexus', color: '221.2 83.2% 53.3%' },
  { name: 'Verde Esmeralda', color: '142.1 76.2% 36.3%' },
  { name: 'Roxo Royal', color: '262.1 83.3% 57.8%' },
  { name: 'Laranja Vibrante', color: '24.6 95% 53.1%' }
];

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem('nexus-accent');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary', savedColor);
    }
  }, []);

  if (!mounted) return null;

  const setAccentColor = (color: string) => {
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('nexus-accent', color);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9" title="Cores de Destaque">
          <Palette className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ACCENT_COLORS.map((accent) => (
          <DropdownMenuItem 
            key={accent.name} 
            onClick={() => setAccentColor(accent.color)}
            className="cursor-pointer gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10" 
              style={{ backgroundColor: `hsl(${accent.color})` }} 
            />
            {accent.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
