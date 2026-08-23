import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NacosNamingClient, NacosConfigClient } from 'nacos';
import * as os from 'os';

@Injectable()
export class NacosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NacosService.name);
  private namingClient: NacosNamingClient | null = null;
  private configClient: NacosConfigClient | null = null;
  private registered = false;

  private readonly enabled: boolean;
  private readonly serverList: string;
  private readonly namespace: string;
  private readonly username: string;
  private readonly password: string;
  private readonly serviceName: string;
  private readonly groupName: string;
  private readonly clusterName: string;
  private readonly serviceIp: string;
  private readonly servicePort: number;
  private readonly serviceWeight: number;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>('NACOS_ENABLED', 'false') === 'true';
    this.serverList = this.configService.get<string>(
      'NACOS_SERVER_LIST',
      '127.0.0.1:8848',
    );
    this.namespace = this.configService.get<string>(
      'NACOS_NAMESPACE',
      'public',
    );
    this.username = this.configService.get<string>('NACOS_USERNAME', '');
    this.password = this.configService.get<string>('NACOS_PASSWORD', '');
    this.serviceName = this.configService.get<string>(
      'NACOS_SERVICE_NAME',
      'lumax-service',
    );
    this.groupName = this.configService.get<string>(
      'NACOS_GROUP_NAME',
      'DEFAULT_GROUP',
    );
    this.clusterName = this.configService.get<string>(
      'NACOS_CLUSTER_NAME',
      'DEFAULT',
    );
    this.serviceIp = this.configService.get<string>(
      'NACOS_SERVICE_IP',
      this.getLocalIp(),
    );
    this.servicePort = this.configService.get<number>(
      'NACOS_SERVICE_PORT',
      this.configService.get<number>('PORT', 9008),
    );
    this.serviceWeight = this.configService.get<number>(
      'NACOS_SERVICE_WEIGHT',
      1,
    );
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Nacos integration is disabled, skipping registration');
      return;
    }

    try {
      await this.initNamingClient();
      await this.registerService();
      await this.initConfigClient();
    } catch (error) {
      this.logger.error(
        `Failed to initialize Nacos: ${error?.message || error}`,
      );
      if (error?.stack) {
        this.logger.debug(error.stack);
      }
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;

    try {
      await this.deregisterService();
      await this.closeClients();
    } catch (error) {
      this.logger.error(
        'Failed to cleanup Nacos resources',
        error?.message || error,
      );
    }
  }

  private async initNamingClient() {
    this.logger.log(
      `Connecting to Nacos server: ${this.serverList}, namespace: "${this.namespace}"`,
    );
    this.logger.warn(
      'Reminder: NACOS_NAMESPACE must be the Namespace ID (usually a UUID), not the display name. ' +
        'Check Nacos Console -> Namespace Management for the correct ID.',
    );

    const namingOpts: any = {
      logger: console,
      serverList: this.serverList,
      namespace: this.namespace,
    };
    if (this.username) {
      namingOpts.username = this.username;
      namingOpts.password = this.password;
    }
    this.namingClient = new NacosNamingClient(namingOpts);

    await this.namingClient.ready();
    this.logger.log('Nacos naming client is ready');
  }

  private async initConfigClient() {
    const configEnabled =
      this.configService.get<string>('NACOS_CONFIG_ENABLED', 'false') ===
      'true';
    if (!configEnabled) return;

    const dataId = this.configService.get<string>(
      'NACOS_CONFIG_DATA_ID',
      'lumax-service.properties',
    );

    const configOpts: any = {
      serverAddr: this.serverList,
      namespace: this.namespace,
    };
    if (this.username) {
      configOpts.username = this.username;
      configOpts.password = this.password;
    }
    this.configClient = new NacosConfigClient(configOpts);

    this.configClient.subscribe(
      { dataId, group: this.groupName },
      (content: string) => {
        this.logger.log(`Nacos config updated [${dataId}]`);
        this.onConfigChanged(content);
      },
    );

    this.logger.log(`Subscribed to Nacos config: ${dataId}`);
  }

  private onConfigChanged(content: string) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        process.env[key] = value;
      }
    }
  }

  private async registerService() {
    if (!this.namingClient) return;

    const instance: any = {
      ip: this.serviceIp,
      port: this.servicePort,
      weight: this.serviceWeight,
      ephemeral: true,
      clusterName: this.clusterName,
    };

    this.logger.log(
      `Registering instance: ${this.serviceName} -> ${this.serviceIp}:${this.servicePort} ` +
        `(namespace="${this.namespace}", group="${this.groupName}", cluster="${this.clusterName}")`,
    );

    await this.namingClient.registerInstance(
      this.serviceName,
      instance,
      this.groupName,
    );

    this.registered = true;
    this.logger.log(
      `Successfully registered in Nacos: ${this.serviceName} -> ${this.serviceIp}:${this.servicePort}`,
    );
  }

  private async deregisterService() {
    if (!this.namingClient || !this.registered) return;

    const instance: any = {
      ip: this.serviceIp,
      port: this.servicePort,
      clusterName: this.clusterName,
    };

    await this.namingClient.deregisterInstance(this.serviceName, instance);

    this.registered = false;
    this.logger.log(
      `Deregistered from Nacos: ${this.serviceName} -> ${this.serviceIp}:${this.servicePort}`,
    );
  }

  private async closeClients() {
    this.namingClient = null;
    if (this.configClient) {
      this.configClient.close();
      this.configClient = null;
    }
    this.logger.log('Nacos clients closed');
  }

  private getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] ?? []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  getNamingClient(): NacosNamingClient | null {
    return this.namingClient;
  }

  getConfigClient(): NacosConfigClient | null {
    return this.configClient;
  }
}
