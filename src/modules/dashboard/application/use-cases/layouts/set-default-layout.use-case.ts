import { Injectable, Inject } from '@nestjs/common';
import { IDashboardLayoutRepository } from '../../../domain/interfaces/dashboard-layout.repository.interface';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
} from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class SetDefaultLayoutUseCase {
  constructor(
    @Inject('DashboardLayoutRepository')
    private readonly layoutRepository: IDashboardLayoutRepository,
  ) {}

  async execute(layoutId: string, userId: string): Promise<void> {
    const layout = await this.layoutRepository.findById(layoutId);

    if (!layout) {
      throw new DashboardLayoutNotFoundException(layoutId);
    }

    if (layout.userId !== userId) {
      throw new UnauthorizedDashboardAccessException(layoutId);
    }

    await this.layoutRepository.setDefaultLayout(layoutId, userId);
  }
}
