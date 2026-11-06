import { MigrationInterface, QueryRunner } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { ensureCompanyDefaults } from '../../company/services/company-defaults.service';

export class SeedCompanyTicketDefaults1762472400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const requiredTables = ['tb_companies', 'tb_categories', 'tb_priorities'];
    for (const table of requiredTables) {
      if (!(await queryRunner.hasTable(table))) {
        return;
      }
    }

    const companies = await queryRunner.manager.find(Company);
    for (const company of companies) {
      await ensureCompanyDefaults(queryRunner.manager, company.id);
    }
  }

  async down(): Promise<void> {
    // Seeded defaults are retained to avoid deleting user-customized or referenced records.
  }
}
