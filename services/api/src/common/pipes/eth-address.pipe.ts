import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

@Injectable()
export class EthAddressPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!ETH_ADDRESS_RE.test(value)) {
      throw new BadRequestException('Invalid Ethereum address');
    }
    return value.toLowerCase();
  }
}
