import { ApiProperty } from '@nestjs/swagger';
import { VmwareServerDto } from './list-servers-response.dto';

export class SyncServerVmwareDataResponseDto {
  @ApiProperty({
    description: 'Number of servers synchronized with VMware data',
  })
  synchronized: number;

  @ApiProperty({
    description: 'List of servers discovered in VMware but not found in database',
    type: [VmwareServerDto],
  })
  discovered: VmwareServerDto[];

  @ApiProperty({
    description: 'List of server names in database but not found in VMware',
    type: [String],
  })
  notFound: string[];
}