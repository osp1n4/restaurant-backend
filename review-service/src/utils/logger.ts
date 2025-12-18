/**
 * Utilidad de logging estructurado
 * Proporciona niveles de log (error, warn, info, debug) con timestamps y contexto
 */

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  context?: any;
  stack?: string;
}

class Logger {
  private service: string;
  private isDevelopment: boolean;

  constructor(serviceName: string = 'review-service') {
    this.service = serviceName;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Formatea y registra un mensaje de log
   */
  private log(level: LogLevel, message: string, context?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
    };

    if (context) {
      logEntry.context = context;
    }

    // En desarrollo, log formateado legible
    if (this.isDevelopment) {
      const emoji = this.getEmoji(level);
      const color = this.getColor(level);
      
      console.log(
        `${emoji} [${logEntry.timestamp}] ${color}${level}${this.resetColor()} - ${message}`
      );
      
      if (context) {
        console.log('  Context:', JSON.stringify(context, null, 2));
      }
    } else {
      // En producción, log en formato JSON para herramientas de análisis
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log de errores (nivel crítico)
   */
  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log de advertencias (posibles problemas)
   */
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log de información general
   */
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log de depuración (solo en desarrollo)
   */
  debug(message: string, context?: any): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Obtiene emoji según nivel de log
   */
  private getEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.ERROR]: '❌',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.DEBUG]: '🔍',
    };
    return emojis[level];
  }

  /**
   * Obtiene código de color ANSI según nivel de log
   */
  private getColor(level: LogLevel): string {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Rojo
      [LogLevel.WARN]: '\x1b[33m',  // Amarillo
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[35m', // Magenta
    };
    return colors[level];
  }

  /**
   * Reset de color ANSI
   */
  private resetColor(): string {
    return '\x1b[0m';
  }
}

// Exportar instancia única del logger
export const logger = new Logger('review-service');

// Exportar también la clase para otros servicios
export { Logger };
