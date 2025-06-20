import { Injectable } from '@nestjs/common';

interface SetupProgressRecord {
  completed: boolean;
}

@Injectable()
export class SetupProgressRepository {
  // TODO: Remplacer par le vrai repository et persistance
  async findAll(): Promise<SetupProgressRecord[]> {
    return [{ completed: true }, { completed: true }, { completed: false }];
  }
}
