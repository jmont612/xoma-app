import { InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';

export async function withTransaction<T>(
  dataSource: DataSource,
  fn: (manager: EntityManager) => Promise<T>,
  externalManager?: EntityManager,
) {
  if (externalManager) return fn(externalManager);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await fn(queryRunner.manager);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    if (error instanceof QueryFailedError) {
      throw new InternalServerErrorException(error.message);
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
}
