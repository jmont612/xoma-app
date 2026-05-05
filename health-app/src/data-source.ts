import { DataSource } from 'typeorm';
import databaseConfig from './database/database.config';

// Provides a DataSource instance to generate and execute entity migrations
export default new DataSource(databaseConfig);
