import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class DeleteGroupUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }

    await this.logHistory.execute('group', id, 'DELETE', userId);

    try {
      await this.groupRepository.deleteWithTransaction(id);
    } catch (error) {
      if (
        error.message.includes('Cannot delete group with associated resources')
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
