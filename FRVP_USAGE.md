# Guía de Uso: Fixed Range Volume Profile (FRVP)

## ¿Qué es FRVP?

El Fixed Range Volume Profile analiza la distribución del volumen en diferentes niveles de precio dentro de un rango temporal específico. Identifica dónde se ha concentrado la actividad de trading, revelando niveles clave de soporte y resistencia basados en datos reales de volumen.

---

## Cómo Usar FRVP

### Paso 1: Seleccionar FRVP
1. Ve a la página **Niveles**
2. En el dropdown "Tipo de Nivel", selecciona **"Volume Profile (FRVP)"**
3. Selecciona la **Temporalidad** de las velas (ej: 1h, 4h, 1d)

### Paso 2: Dibujar el Rango
1. Click en el botón **"📐 Dibujar Rango"**
2. El cursor cambiará a una cruz ✛
3. **Haz click y arrastra** en la gráfica para seleccionar el rango:
   - **Horizontal**: Define el período temporal (ej: últimas 3 horas, 2 días, etc.)
   - **Vertical**: Define el rango de precios a analizar

**Consejo:** Dibuja un rectángulo que cubra:
- Temporalmente: El período que quieres analizar
- Precio: El rango de precios relevante

### Paso 3: Ajustar Resolución
- Usa el **slider de bins** (50-300)
- **Más bins = Mayor precisión** pero más lento
- Recomendado:
  - **Scalping**: 200-300 bins
  - **Swing Trading**: 100-150 bins

### Paso 4: Calcular
1. Click en **"Calcular FRVP"**
2. El backend analizará las velas de Binance en ese rango
3. Verás una lista de niveles identificados

### Paso 5: Revisar Niveles

El sistema identifica automáticamente:

#### **POC (Point of Control)** 🟡
- Precio con el MAYOR volumen
- Nivel más importante - actúa como imán del precio
- **Uso:** Soporte/resistencia muy fuerte

#### **VAH (Value Area High)** 🔴
- Límite superior del 70% del volumen
- **Uso:** Resistencia en mercado alcista

#### **VAL (Value Area Low)** 🟢
- Límite inferior del 70% del volumen
- **Uso:** Soporte en mercado bajista

#### **HVN (High Volume Nodes)** 🔵
- Picos locales de volumen
- **Uso:** Soporte/resistencia adicionales

#### **LVN (Low Volume Nodes)** 🟣
- Valles de bajo volumen
- **Uso:** Zonas de ruptura potencial (el precio tiende a atravesarlas rápido)

### Paso 6: Guardar Niveles
1. **Marca los checkboxes** de los niveles que te interesen
2. Click en **"Guardar Seleccionados (N)"**
3. Los niveles se guardan en MongoDB con fuerza calculada

---

## Ejemplos de Configuración

### Para Scalping (5-15 min)
```
Símbolo: BTCUSDT
Intervalo: 5m
Rango Temporal: Últimas 2-4 horas
Rango de Precio: Estrecho (1-2% del precio actual)
Bins: 250
```

**Ejemplo específico:**
- Precio actual: $50,000
- Rango: $49,500 - $50,500 (2%)
- Tiempo: Últimas 3 horas
- Resultado: Micro-niveles para entradas/salidas rápidas

### Para Swing Trading (1-7 días)
```
Símbolo: ETHUSDT
Intervalo: 1h o 4h
Rango Temporal: Últimos 3-7 días
Rango de Precio: Amplio (5-10% del precio actual)
Bins: 120
```

**Ejemplo específico:**
- Precio actual: $3,000
- Rango: $2,800 - $3,200 (13%)
- Tiempo: Últimos 5 días
- Resultado: Niveles clave para posiciones de varios días

### Para Position Trading (semanas/meses)
```
Símbolo: BTCUSDT
Intervalo: 1d
Rango Temporal: Últimas 2-4 semanas
Rango de Precio: Muy amplio (10-20%)
Bins: 100
```

---

## Interpretación de Niveles

### POC - Point of Control
- **Si el precio está ARRIBA del POC:** Sesgo alcista
- **Si el precio está ABAJO del POC:** Sesgo bajista
- **Si el precio TOCA el POC:** Suele rebotar (muy fuerte)

### VAH y VAL - Value Area
- **Dentro de VAH-VAL:** Rango de consolidación
- **Arriba de VAH:** Mercado alcista fuerte
- **Debajo de VAL:** Mercado bajista fuerte

### HVN - High Volume Nodes
- Actúan como soporte/resistencia
- El precio tiende a "descansar" en estos niveles
- Buenos para:
  - Stop loss
  - Take profit
  - Entradas en pullback

### LVN - Low Volume Nodes
- Zonas de poco interés histórico
- El precio tiende a atravesarlas rápido
- Buenos para:
  - Identificar zonas de breakout
  - Evitar entradas (vacío de volumen)

---

## Tips y Mejores Prácticas

### ✅ HACER

1. **Combinar con otros indicadores**
   - FRVP + Pivot Points
   - FRVP + Fibonacci
   - FRVP + Ichimoku

2. **Actualizar regularmente**
   - Recalcula FRVP cada sesión de trading
   - El volumen cambia con el tiempo

3. **Usar múltiples timeframes**
   - FRVP en 1h para intraday
   - FRVP en 1d para contexto general

4. **Prestar atención al POC**
   - Es el nivel MÁS importante
   - Suele actuar como soporte/resistencia muy fuerte

5. **Usar resolución adecuada**
   - Scalp: 200-300 bins (muy preciso)
   - Swing: 100-150 bins (equilibrado)

### ❌ EVITAR

1. **Rangos demasiado pequeños**
   - Mínimo: 1 hora y 1% de rango de precio
   - Ideal: Varios días y 5-10% de rango

2. **Demasiados bins en rangos grandes**
   - Ralentiza el cálculo
   - No aporta información útil adicional

3. **Ignorar el contexto de mercado**
   - Un nivel fuerte puede romperse en tendencias extremas
   - Siempre considera el contexto general

4. **Confiar solo en LVN**
   - Son menos confiables que POC/VAH/VAL/HVN
   - Úsalos como complemento, no como principal

---

## Solución de Problemas

### No puedo dibujar el rectángulo
- ✅ Verifica que hiciste click en "📐 Dibujar Rango"
- ✅ El cursor debe cambiar a cruz ✛
- ✅ Haz click y ARRASTRA (no solo click)

### "Selección demasiado pequeña"
- ✅ Dibuja un rectángulo más grande
- ✅ Mínimo: 1 minuto en horizontal
- ✅ Mínimo: 0.01 en vertical

### Cálculo muy lento
- ✅ Reduce el número de bins
- ✅ Reduce el rango temporal
- ✅ Verifica tu conexión a Internet

### No aparecen niveles
- ✅ Verifica que MongoDB esté corriendo
- ✅ Verifica la conexión al backend
- ✅ Revisa la consola del navegador (F12)

---

## Atajos de Teclado

- **ESC**: Cancelar dibujo de rectángulo
- Click en "Cancelar": Salir del modo dibujo

---

## Arquitectura Técnica

### Backend
```typescript
POST /api/levels/frvp
{
  symbol: "BTCUSDT",
  interval: "1h",
  startTime: 1736352000000,
  endTime: 1736438400000,
  highPrice: 51000,
  lowPrice: 49000,
  bins: 150
}
```

### Algoritmo
1. Obtener velas de Binance en el rango
2. Dividir rango de precio en N bins
3. Distribuir volumen de cada vela en los bins que toca
4. Identificar POC (bin con más volumen)
5. Calcular Value Area (expandir desde POC hasta 70% volumen)
6. Detectar HVN y LVN (picos y valles locales)

### Datos Reales
- Fuente: **Binance API**
- Sin estimaciones ni aproximaciones
- Basado en volumen real negociado

---

## Próximas Mejoras

- [ ] Histograma de volumen visual en la gráfica
- [ ] Detección automática de rangos óptimos
- [ ] Auto-ajuste de bins según volatilidad
- [ ] Comparación de múltiples períodos

---

## Soporte

¿Problemas? Revisa:
1. Consola del navegador (F12)
2. Logs del backend
3. Estado de MongoDB (`mongod` corriendo)
4. Conexión a Binance API

**¡Feliz Trading!** 📈📊
