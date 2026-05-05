export class MlPredictionDto {
  mood_0_10?: number;
  stress_0_10?: number;
  anxiety_0_10?: number;
  impulsivity_0_10?: number;
  urge_self_harm?: number;
  suicidal_ideation?: number;
}

export class MlPredictionResponseDto {
  probabilities: {
    BAJO: number;
    MEDIO: number;
    ALTO: number;
  };
  label_thresholds: string;
  label_gate: string;
}
