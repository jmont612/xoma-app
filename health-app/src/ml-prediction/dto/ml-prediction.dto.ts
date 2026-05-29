import { ApiProperty } from '@nestjs/swagger';

export class MlPredictionDto {
  @ApiProperty({
    required: false,
    example: 7,
    description: 'Valor de ánimo en escala del 0 al 10',
  })
  mood_0_10?: number;

  @ApiProperty({
    required: false,
    example: 5,
    description: 'Valor de estrés en escala del 0 al 10',
  })
  stress_0_10?: number;

  @ApiProperty({
    required: false,
    example: 4,
    description: 'Valor de ansiedad en escala del 0 al 10',
  })
  anxiety_0_10?: number;

  @ApiProperty({
    required: false,
    example: 3,
    description: 'Valor de impulsividad en escala del 0 al 10',
  })
  impulsivity_0_10?: number;

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Valor de impulso de autolesión en booleano (0 o 1)',
  })
  urge_self_harm?: number;

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Valor de ideación suicida en booleano (0 o 1)',
  })
  suicidal_ideation?: number;
}

export class MlPredictionResponseDto {
  @ApiProperty({
    description: 'Probabilidades de cada etiqueta de riesgo',
    example: { BAJO: 0.8, MEDIO: 0.15, ALTO: 0.05 },
  })
  probabilities: {
    BAJO: number;
    MEDIO: number;
    ALTO: number;
  };

  @ApiProperty({
    example: 'BAJO',
    description: 'Etiqueta de riesgo calculada por el modelo',
  })
  label_thresholds: string;

  @ApiProperty({
    example: 'BAJO',
    description: 'Etiqueta de riesgo calculada por el modelo',
  })
  label_gate: string;
}
