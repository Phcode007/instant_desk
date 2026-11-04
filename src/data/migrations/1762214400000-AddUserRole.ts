import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddUserRole1762214400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const hasRoleColumn = await queryRunner.hasColumn('tb_users', 'role');

    if (!hasRoleColumn) {
      await queryRunner.addColumn(
        'tb_users',
        new TableColumn({
          name: 'role',
          type: 'varchar',
          length: '16',
          isNullable: false,
          default: "'USER'",
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const hasRoleColumn = await queryRunner.hasColumn('tb_users', 'role');

    if (hasRoleColumn) {
      await queryRunner.dropColumn('tb_users', 'role');
    }
  }
}