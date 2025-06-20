import { Injectable } from '@nestjs/common';

@Injectable()
export class SetupStatusService {
  // TODO: Remplacer cette implémentation temporaire par la vraie logique métier
  async getStatus(): Promise<{ isComplete: boolean }> {
    return {
      isComplete: false,
    };
  }
}
