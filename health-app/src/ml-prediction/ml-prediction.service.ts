import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  MlPredictionDto,
  MlPredictionResponseDto,
} from './dto/ml-prediction.dto';

@Injectable()
export class MlPredictionService {
  private readonly mlApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlApiUrl =
      this.configService.get<string>('ML_API_URL') || 'http://localhost:8000';
  }

  async getPrediction(data: MlPredictionDto): Promise<MlPredictionResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<MlPredictionDto>(
          `${this.mlApiUrl}/classify`,
          data,
        ),
      );

      return response.data as MlPredictionResponseDto;
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          `Error connecting to ML service: ${error.message}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'Error connecting to ML service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
