import { IAnalyticsService } from '../interfaces/IAnalyticsService';
import { IAnalyticsRepository } from '../interfaces/IAnalyticsRepository';
import { AnalyticsQueryDTO, AnalyticsResponseDTO, CSVExportRequestDTO } from '../dtos/analytics';
import { Readable } from 'stream';

/**
 * Servicio de analíticas refactorizado
 * Cumple con Single Responsibility Principle: Solo orquestación
 * Cumple con Dependency Inversion Principle: Depende de abstracciones
 */
export class AnalyticsService implements IAnalyticsService {
  constructor(private repository: IAnalyticsRepository) {}

  async getAnalytics(query: AnalyticsQueryDTO): Promise<AnalyticsResponseDTO | null> {
    // Delega al repositorio - Single Responsibility
    return this.repository.getAnalytics(query);
  }

  streamCsv(query: CSVExportRequestDTO): Readable {
    // Delega al repositorio - Single Responsibility
    return this.repository.streamCsv(query);
  }
}