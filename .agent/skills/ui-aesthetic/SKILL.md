---
name: UI & Aesthetic Excellence Guard
description: Regras obrigatórias para manter a consistência visual, excelência de design (Premium) e suporte a temas no CRM Next Gen.
---

# UI & Aesthetic Excellence Guard

> **REGRA DE OURO**: A interface deve ser "Wowed" à primeira vista. Use cores ricas (OKLCH), micro-animações, sombras suaves e transparências (Glassmorphism). Se parece um MVP básico, você falhou.

---

## 1. Sistema de Cores (Design Tokens)

O sistema utiliza **OKLCH** para cores vibrantes e consistentes entre temas.

### 1.1 Cores Primárias (IBM Blue Heritage)
- **Primary**: `oklch(0.488 0.243 264.376)` (#0f62fe)
- **Primary Foreground**: `oklch(0.985 0 0)` (Quase branco)

### 1.2 Fundos e Superfícies
- **Light Background**: `oklch(0.985 0.002 247.839)` (Cinza ultra leve, não use #ffffff puro)
- **Dark Background**: `oklch(0.145 0 0)` (Preto profundo)
- **Card**: `oklch(1 0 0)` (Branco puro em light) / `oklch(0.205 0 0)` (Cinza escuro em dark)

### ✅ REGRAS DE CORES
- **Sempre** use variáveis CSS (`bg-background`, `text-primary`, `border-border`).
- **Nunca** use hard-coded hex colors nos componentes.
- Use `opacity` em vez de criar novas cores para estados secundários.

---

## 2. Tipografia e Layout

### 2.1 Fontes
- **Sans**: `Geist Sans` (Moderno, limpo)
- **Mono**: `Geist Mono` (Para dados técnicos e códigos)

### 2.2 Espaçamento e Bordas
- **Radius**: Padrão `0.625rem` (`6.25px`).
- Use variantes: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` (calculados proporcionalmente).

---

## 3. Utilitários Premium (Glassmorphism)

Para efeitos de profundidade e modernidade:

```css
/* Definido em globals.css */
.glass-card {
  @apply bg-card/60 backdrop-blur-xl border border-border;
}
```

### ✅ QUANDO USAR
- Modais, sidebars flutuantes, e headers fixos.
- Sobreposições sobre gráficos ou imagens de fundo.

---

## 4. Suporte a Temas (Dark/Light)

A aplicação suporta temas dinâmicos via classe `.dark`.

### 4.1 Implementação Segura
```tsx
// ✅ Use o hook useTheme quando precisar de lógica condicional
const { theme } = useTheme();

// ✅ Use variantes de classe para estilos específicos
<div className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
```

### 4.2 Imagens e Ícones
- Alterne ícones ou sua opacidade entre temas para garantir legibilidade.
- Imagens de fundo devem ser escurecidas ou trocadas no modo dark.

---

## 5. Micro-animações e Interatividade

### 5.1 Transições Sugeridas
```tsx
// ✅ Feedback tátil em botões e cards
<button className="transition-all active:scale-95 hover:brightness-110">
```

### 5.2 Loading States
- Use o componente `<LoadingSpinner />` ou animações de skeleton para estados de transição.
- Evite que a tela dê "pulos" quando os dados carregam (Layout Stability).

---

## 6. Icons & Assets

### 6.1 Lucide React
Use preferencialmente `lucide-react` para ícones consistentes.

```tsx
import { User, Settings, CheckCircle } from 'lucide-react';

// ✅ Mantenha o stroke-width padrão (2) ou sutil (1.5)
<User className="size-5" />
```

---

## 7. Checklist de Excelência Visual

Use antes de finalizar qualquer componente de UI:

- [ ] O componente tem suporte a **Dark Mode**?
- [ ] O contraste de cores segue as regras do **OKLCH**?
- [ ] Usei **variáveis do tema** em vez de cores fixas?
- [ ] O componente tem **feedback visual** (hover, active, focus)?
- [ ] As bordas seguem o padrão de **radius 0.625rem**?
- [ ] Usei **Glassmorphism** onde agrega valor estético?
- [ ] A tipografia está usando a família **Geist**?
- [ ] O layout é **responsivo** (mobile-first)?
- [ ] As micro-animações estão suaves e não intrusivas?
- [ ] Evitei o uso de placeholders feios ou genéricos?

---

## 8. Referências Técnicas

| Recurso | Localização |
|---|---|
| CSS Global | `src/app/globals.css` |
| UI Components | `src/components/ui/` |
| Theme Provider | `src/components/providers/ThemeProvider.tsx` |
| Theme Toggle | `src/components/ui/ThemeToggle.tsx` |
| Lucide Icons | [lucide.dev](https://lucide.dev/) |
