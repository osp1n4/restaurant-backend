import { AnalyticsQueryDTO, AnalyticsResponseDTO, CSVExportRequestDTO } from '../dtos/analytics';
import { Readable } from 'stream';

/**
 * Interface para el servicio de analíticas
 * Cumple con Dependency Inversion Principle (DIP)
 */
export interface IAnalyticsService {
  /**
   * Obtiene analíticas basadas en el query proporcionado
   */
  getAnalytics(query: AnalyticsQueryDTO): Promise<AnalyticsResponseDTO | null>;
  
  /**
   * Genera un stream de CSV con los datos de analíticas
   */
  streamCsv(query: CSVExportRequestDTO): Readable;
}
