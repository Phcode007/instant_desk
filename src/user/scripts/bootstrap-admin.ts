import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UserService } from '../services/user.service';

function parseId(args: string[], flag: string): number {
  const index = args.indexOf(flag);
  const value = Number(args[index + 1]);

  if (
    index < 0 ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    args[index + 1]?.startsWith('--')
  ) {
    throw new Error(`Informe um valor inteiro positivo para ${flag}`);
  }

  return value;
}

async function bootstrap(): Promise<void> {
  const args = process.argv.slice(2);
  const companyId = parseId(args, '--company-id');
  const userId = parseId(args, '--user-id');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    await app.get(UserService).bootstrapAdmin(companyId, userId);
    console.log(
      `ADMIN inicial criado para usuário ${userId}, empresa ${companyId}.`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Falha ao criar ADMIN inicial',
  );
  process.exitCode = 1;
});
