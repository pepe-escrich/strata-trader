# Visión General - Strata Trader

## 📖 Introducción

Strata Trader es un bot de trading automatizado de criptomonedas que combina análisis técnico avanzado con gestión de riesgos para ejecutar operaciones rentables en el mercado de futuros.

## 🎯 Objetivo Principal

Automatizar la detección y ejecución de operaciones de trading basadas en:
1. **Niveles de Soporte y Resistencia**: Identificación automática de niveles clave
2. **Divergencias**: Detección de divergencias alcistas/bajistas como señal de entrada
3. **Gestión de Riesgo**: Cálculo automático de stop loss, apalancamiento y take profit
4. **Backtesting**: Validación de estrategias con datos históricos

## 🔄 Flujo de Trabajo

### 1. Análisis de Mercado
- Monitoreo continuo de pares de trading (BTC/USDT, ETH/USDT, etc.)
- Cálculo y actualización de niveles de soporte/resistencia
- Análisis de volumen y patrones de velas

### 2. Detección de Oportunidades
- Identificación cuando el precio se acerca a un nivel clave
- Análisis de divergencias (RSI, MACD, volumen)
- Evaluación de condiciones de mercado

### 3. Gestión de Órdenes

#### Órdenes Supervisadas (Planificadas)
- Configuradas previamente por el usuario
- Ejecución automática cuando se cumplen condiciones
- Seguimiento y ajuste automático

#### Órdenes Alertadas (No Planificadas)
- Detección de oportunidad por el bot
- Alerta al usuario con análisis completo
- Orden preparada con parámetros calculados
- Usuario decide si ejecutar

### 4. Ejecución y Seguimiento
- Apertura de posición con stop loss inicial
- Primera toma de beneficios (scalp)
- Movimiento de stop loss a breakeven
- Cierre parcial o total según estrategia

### 5. Registro y Análisis
- Historial completo de operaciones
- Métricas de rendimiento
- Análisis de efectividad

## 🏛️ Tipos de Operaciones

### Long (Alcista)
- Entrada cerca de soporte
- Divergencia alcista confirmada
- Stop loss por debajo del soporte
- Take profit en resistencia superior

### Short (Bajista)
- Entrada cerca de resistencia
- Divergencia bajista confirmada
- Stop loss por encima de la resistencia
- Take profit en soporte inferior

## 🎮 Modos de Operación

### 1. Modo Automático
- Órdenes supervisadas ejecutadas sin intervención
- Gestión completa del ciclo de vida
- Notificaciones de eventos importantes

### 2. Modo Asistido
- Alertas de oportunidades detectadas
- Usuario aprueba cada operación
- Bot prepara y sugiere parámetros

### 3. Modo Backtesting
- Simulación con datos históricos
- Análisis de rentabilidad
- Optimización de parámetros

## 🔧 Tecnologías Core

- **Backend**: NestJS con TypeScript
- **Frontend**: Angular con PrimeNG y Tailwind
- **Base de Datos**: MongoDB (futuro)
- **Exchange**: BingX API (Testnet VST)
- **Análisis**: Indicadores técnicos personalizados

## 📊 Métricas Clave

- Win Rate (% de operaciones ganadoras)
- Risk/Reward Ratio
- Drawdown máximo
- Profit Factor
- Sharpe Ratio
- Total P&L

## 🚀 Fases de Desarrollo

### Fase 1 - Fundación (Actual)
- Estructura básica de proyecto
- Integración con BingX Testnet
- Cálculo básico de soporte/resistencia

### Fase 2 - Core Trading
- Detección de divergencias
- Sistema de órdenes completo
- Gestión de riesgo automatizada

### Fase 3 - Backtesting
- Motor de simulación histórica
- Optimización de parámetros
- Reportes detallados

### Fase 4 - Optimización
- Machine Learning para mejora de señales
- Múltiples estrategias simultáneas
- Dashboard avanzado

### Fase 5 - Producción
- Transición a cuenta real
- Monitoreo 24/7
- Sistema de alertas avanzado

## 🎓 Conceptos Clave

### Soporte y Resistencia
Niveles de precio donde históricamente el mercado ha mostrado reversiones o consolidación.

### Divergencia
Discrepancia entre el movimiento del precio y un indicador técnico, sugiriendo un posible cambio de tendencia.

### Scalping
Estrategia de tomar beneficios rápidos en movimientos pequeños del precio.

### Breakeven
Mover el stop loss al precio de entrada para eliminar el riesgo de pérdida.

### Risk Management
Cálculo de tamaño de posición basado en el riesgo permitido por operación.
