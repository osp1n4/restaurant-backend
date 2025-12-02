import { IGroupingStrategy } from '../interfaces/IGroupingStrategy';
import { GroupBy } from '../dtos/analytics';

/**
 * Estrategia de agrupación por día
 * Cumple con Open/Closed Principle
 */
export class DayGroupingStrategy implements IGroupingStrategy {
  getPeriodExpression(): any {
    return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }

  formatPeriod(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getGroupBy(): GroupBy {
    return 'day';
  }
}

/**
 * Estrategia de agrupación por semana
 */
export class WeekGroupingStrategy implements IGroupingStrategy {
  getPeriodExpression(): any {
    return { $dateToString: { format: '%G-%V', date: '$createdAt' } };
  }

  formatPeriod(date: Date): string {
    // ISO week format
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-${String(week).padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  getGroupBy(): GroupBy {
    return 'week';
  }
}

/**
 * Estrategia de agrupación por mes
 */
export class MonthGroupingStrategy implements IGroupingStrategy {
  getPeriodExpression(): any {
    return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }

  formatPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getGroupBy(): GroupBy {
    return 'month';
  }
}

/**
 * Estrategia de agrupación por año
 */
export class YearGroupingStrategy implements IGroupingStrategy {
  getPeriodExpression(): any {
    return { $dateToString: { format: '%Y', date: '$createdAt' } };
  }

  formatPeriod(date: Date): string {
    return String(date.getFullYear());
  }

  getGroupBy(): GroupBy {
    return 'year';
  }
}

/**
 * Factory para crear estrategias de agrupación
 * Cumple con Factory Pattern y Open/Closed Principle
 */
export class GroupingStrategyFactory {
  static create(groupBy: GroupBy): IGroupingStrategy {
    switch (groupBy) {
      case 'day':
        return new DayGroupingStrategy();
      case 'week':
        return new WeekGroupingStrategy();
      case 'month':
        return new MonthGroupingStrategy();
      case 'year':
        return new YearGroupingStrategy();
      default:
        return new MonthGroupingStrategy();
    }
  }
}
