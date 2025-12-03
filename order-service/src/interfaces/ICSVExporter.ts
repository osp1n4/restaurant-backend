import { AnalyticsResponseDTO, CSVExportRequestDTO } from '../dtos/analytics';
import { Readable } from 'stream';

/**
 * Interface para exportación de CSV
 * Cumple con Single Responsibility Principle (SRP)
 */
export interface ICSVExporter {
  /**
   * Exporta analíticas a formato CSV en stream
   */
  export(analytics: AnalyticsResponseDTO | null, query: CSVExportRequestDTO): Readable;
}
