import { Global, Module } from '@nestjs/common';
import { NacosService } from './nacos.service';

@Global()
@Module({
  providers: [NacosService],
  exports: [NacosService],
})
export class NacosModule {}
