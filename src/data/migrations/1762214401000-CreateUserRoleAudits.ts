import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserRoleAudits1762214401000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('tb_user_role_audits')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'tb_user_role_audits',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'administratorId', type: 'integer', isNullable: true },
          { name: 'affectedUserId', type: 'integer' },
          { name: 'companyId', type: 'integer' },
          { name: 'previousRole', type: 'varchar', length: '16' },
          { name: 'newRole', type: 'varchar', length: '16' },
          { name: 'source', type: 'varchar', length: '16', default: "'ADMIN'" },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('tb_user_role_audits')) {
      await queryRunner.dropTable('tb_user_role_audits');
    }
  }
}