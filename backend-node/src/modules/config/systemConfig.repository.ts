import { prisma } from '../../config/prisma';
import { SYSTEM_CONFIG_KEYS, DEFAULT_CARE_INTERVAL_DAYS } from '../../constants/careStatus.constant';

export class SystemConfigRepository {
  async getConfig(key: string): Promise<string | null> {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });
    return config ? config.value : null;
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  async getDefaultCareDays(): Promise<number> {
    const val = await this.getConfig(SYSTEM_CONFIG_KEYS.CUSTOMER_CARE_DEFAULT_DAYS);
    if (val && !isNaN(Number(val)) && Number(val) > 0) {
      return parseInt(val, 10);
    }
    return DEFAULT_CARE_INTERVAL_DAYS;
  }
}

export const systemConfigRepository = new SystemConfigRepository();
