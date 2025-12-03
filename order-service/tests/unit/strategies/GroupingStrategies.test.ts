/**
 * PRUEBAS UNITARIAS - Estrategias de Agrupación de Períodos
 * 
 * Nivel: UNITARIA
 * Alcance: Valida la lógica de agrupación por día, semana, mes y año
 * 
 * Qué se prueba:
 * - Generación correcta de expresiones MongoDB para cada estrategia
 * - Formateo de periodos según el tipo de agrupación
 * - Factory que crea la estrategia correcta según el parámetro
 * 
 * Por qué:
 * Las estrategias de agrupación son críticas para la correcta generación
 * de reportes analíticos. Cada estrategia debe producir expresiones MongoDB
 * válidas y formatear fechas de forma consistente.
 * 
 * Principio FIRST:
 * - Fast: Sin I/O, solo lógica pura
 * - Isolated: No depende de BD ni servicios externos
 * - Repeatable: Mismo input = mismo output siempre
 * - Self-validating: Asserts claros de éxito/fallo
 * - Timely: Creadas junto con el código de producción
 */

import {
  DayGroupingStrategy,
  WeekGroupingStrategy,
  MonthGroupingStrategy,
  YearGroupingStrategy,
  GroupingStrategyFactory
} from '../../../src/strategies/GroupingStrategies';

describe('Estrategias de Agrupación - Pruebas Unitarias', () => {
  
  describe('DayGroupingStrategy', () => {
    let strategy: DayGroupingStrategy;

    beforeEach(() => {
      // Arrange: Crear instancia limpia antes de cada prueba
      strategy = new DayGroupingStrategy();
    });

    test('debe generar expresión MongoDB correcta para agrupación diaria', () => {
      // Qué valida: La expresión $dateToString con formato día (YYYY-MM-DD)
      // Por qué: MongoDB usa esta expresión en el pipeline de agregación
      const expression = strategy.getPeriodExpression();

      expect(expression).toEqual({
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      });
    });

    test('debe formatear fecha a formato YYYY-MM-DD', () => {
      // Qué valida: El formateo de fechas JavaScript a string ISO día
      // Por qué: Frontend necesita este formato para graficar series temporales
      const testDate = new Date('2025-12-02T14:30:00.000Z');
      const formatted = strategy.formatPeriod(testDate);

      expect(formatted).toBe('2025-12-02');
    });

    test('debe retornar "day" como tipo de agrupación', () => {
      // Qué valida: Identificador del tipo de estrategia
      // Por qué: Se usa para validaciones y logs
      expect(strategy.getGroupBy()).toBe('day');
    });
  });

  describe('WeekGroupingStrategy', () => {
    let strategy: WeekGroupingStrategy;

    beforeEach(() => {
      strategy = new WeekGroupingStrategy();
    });

    test('debe generar expresión MongoDB correcta para agrupación semanal', () => {
      // Qué valida: Expresión con formato ISO 8601 week (%G-%V)
      // Por qué: %G = año ISO, %V = número de semana ISO
      const expression = strategy.getPeriodExpression();

      expect(expression).toEqual({
        $dateToString: { format: '%G-%V', date: '$createdAt' }
      });
    });

    test('debe formatear fecha a formato YYYY-WW (semana ISO 8601)', () => {
      // Qué valida: Cálculo correcto del número de semana ISO
      // Por qué: Semanas ISO comienzan en lunes, pueden cruzar años
      
      // Primera semana de 2025 (jueves 2 de enero)
      const week1 = new Date('2025-01-02T12:00:00.000Z');
      expect(strategy.formatPeriod(week1)).toBe('2025-01');

      // Última semana de 2024 (lunes 30 de diciembre)
      const week53 = new Date('2024-12-30T12:00:00.000Z');
      expect(strategy.formatPeriod(week53)).toBe('2025-01');
    });

    test('debe retornar "week" como tipo de agrupación', () => {
      expect(strategy.getGroupBy()).toBe('week');
    });
  });

  describe('MonthGroupingStrategy', () => {
    let strategy: MonthGroupingStrategy;

    beforeEach(() => {
      strategy = new MonthGroupingStrategy();
    });

    test('debe generar expresión MongoDB correcta para agrupación mensual', () => {
      // Qué valida: Formato año-mes (%Y-%m)
      // Por qué: Agrupa todos los días de un mes en una sola serie
      const expression = strategy.getPeriodExpression();

      expect(expression).toEqual({
        $dateToString: { format: '%Y-%m', date: '$createdAt' }
      });
    });

    test('debe formatear fecha a formato YYYY-MM', () => {
      // Qué valida: Extracción de año y mes con padding de ceros
      const testDate = new Date('2025-03-15T10:00:00.000Z');
      const formatted = strategy.formatPeriod(testDate);

      expect(formatted).toBe('2025-03');
    });

    test('debe manejar correctamente meses de un solo dígito', () => {
      // Qué valida: Zero-padding en meses < 10
      // Por qué: Consistencia en ordenamiento y comparación
      const january = new Date('2025-01-05T00:00:00.000Z');
      expect(strategy.formatPeriod(january)).toBe('2025-01');

      const september = new Date('2025-09-20T00:00:00.000Z');
      expect(strategy.formatPeriod(september)).toBe('2025-09');
    });

    test('debe retornar "month" como tipo de agrupación', () => {
      expect(strategy.getGroupBy()).toBe('month');
    });
  });

  describe('YearGroupingStrategy', () => {
    let strategy: YearGroupingStrategy;

    beforeEach(() => {
      strategy = new YearGroupingStrategy();
    });

    test('debe generar expresión MongoDB correcta para agrupación anual', () => {
      // Qué valida: Formato solo año (%Y)
      // Por qué: Agrupa todos los meses de un año
      const expression = strategy.getPeriodExpression();

      expect(expression).toEqual({
        $dateToString: { format: '%Y', date: '$createdAt' }
      });
    });

    test('debe formatear fecha a formato YYYY', () => {
      // Qué valida: Extracción solo del año
      const testDate = new Date('2025-07-20T15:45:30.000Z');
      const formatted = strategy.formatPeriod(testDate);

      expect(formatted).toBe('2025');
    });

    test('debe retornar "year" como tipo de agrupación', () => {
      expect(strategy.getGroupBy()).toBe('year');
    });
  });

  describe('GroupingStrategyFactory', () => {
    
    test('debe crear DayGroupingStrategy cuando groupBy es "day"', () => {
      // Qué valida: Factory retorna instancia correcta
      // Por qué: Patrón Factory centraliza creación y facilita extensión
      const strategy = GroupingStrategyFactory.create('day');

      expect(strategy).toBeInstanceOf(DayGroupingStrategy);
      expect(strategy.getGroupBy()).toBe('day');
    });

    test('debe crear WeekGroupingStrategy cuando groupBy es "week"', () => {
      const strategy = GroupingStrategyFactory.create('week');

      expect(strategy).toBeInstanceOf(WeekGroupingStrategy);
      expect(strategy.getGroupBy()).toBe('week');
    });

    test('debe crear MonthGroupingStrategy cuando groupBy es "month"', () => {
      const strategy = GroupingStrategyFactory.create('month');

      expect(strategy).toBeInstanceOf(MonthGroupingStrategy);
      expect(strategy.getGroupBy()).toBe('month');
    });

    test('debe crear YearGroupingStrategy cuando groupBy es "year"', () => {
      const strategy = GroupingStrategyFactory.create('year');

      expect(strategy).toBeInstanceOf(YearGroupingStrategy);
      expect(strategy.getGroupBy()).toBe('year');
    });

    test('debe retornar MonthGroupingStrategy por defecto si groupBy no es válido', () => {
      // Qué valida: Comportamiento por defecto ante input inválido
      // Por qué: Evita errores en runtime; 'month' es el más común
      const strategy = GroupingStrategyFactory.create('invalid' as any);

      expect(strategy).toBeInstanceOf(MonthGroupingStrategy);
      expect(strategy.getGroupBy()).toBe('month');
    });

    test('debe crear estrategias independientes (no singleton)', () => {
      // Qué valida: Cada llamada retorna instancia nueva
      // Por qué: Evita estado compartido entre requests
      const strategy1 = GroupingStrategyFactory.create('day');
      const strategy2 = GroupingStrategyFactory.create('day');

      expect(strategy1).not.toBe(strategy2);
    });
  });
});
