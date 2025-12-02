import { GroupBy } from '../dtos/analytics';

/**
 * Interface para estrategias de agrupación de periodos
 * Cumple con Open/Closed Principle (OCP) y Strategy Pattern
 */
export interface IGroupingStrategy {
  /**
   * Genera la expresión de agregación MongoDB para el periodo
   */
  getPeriodExpression(): any;
  
  /**
   * Formatea una fecha al formato del periodo
   */
  formatPeriod(date: Date): string;
  
  /**
   * Retorna el tipo de agrupación
   */
  getGroupBy(): GroupBy;
}
