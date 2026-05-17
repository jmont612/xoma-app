import { EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Behavior } from '@/behaviors/entities/behavior.entity';
import { EmaType } from '@/ema-types/entities/ema-type.entity';
import { MoodState } from '@/mood-states/entities/mood-state.entity';
import { Skill } from '@/skills/entities/skill.entity';
import { SubSkill } from '@/sub-skills/entities/sub-skill.entity';
import { Step } from '@/steps/entities/step.entity';
import { DailyQuote } from '@/daily-quotes/entities/daily-quote.entity';
import { EmaTypeEvaluationType } from '@/common/enums/ema-type-evaluation-type.enum';
import dataSource from '@/data-source';

const logger = new Logger('Seed');

interface BehaviorSeed extends Partial<Behavior> {
  id: number;
  name: string;
}

interface EmaTypeSeed extends Partial<EmaType> {
  id: number;
  name: string;
  evaluationType: EmaTypeEvaluationType;
}

interface MoodStateSeed extends Partial<MoodState> {
  id: number;
  name: string;
}

interface SkillSeed extends Partial<Skill> {
  id: number;
  name: string;
}

interface SubSkillSeed extends Partial<SubSkill> {
  id: number;
  name: string;
  skillId: number;
}

interface StepSeed extends Partial<Step> {
  id: number;
  description: string;
  hasTimer: boolean;
  requiresValidation: boolean;
  subSkillId: number;
}

interface DailyQuoteSeed extends Partial<DailyQuote> {
  id: number;
  quote: string;
  day: number;
}

const behaviorSeeds: BehaviorSeed[] = [
  { id: 1, name: 'thinkSelfHarm' },
  { id: 2, name: 'selfHarm' },
  { id: 3, name: 'suicidalIdeation' },
  { id: 4, name: 'suicideAttempt' },
  { id: 5, name: 'thinkSubstances' },
  { id: 6, name: 'useSubstances' },
  { id: 7, name: 'thinkImpulsiveBehavior' },
  { id: 8, name: 'impulsiveBehavior' },
];

const emaTypeSeeds: EmaTypeSeed[] = [
  { id: 1, name: 'mood', evaluationType: EmaTypeEvaluationType.RATING },
  { id: 2, name: 'stress', evaluationType: EmaTypeEvaluationType.RATING },
  { id: 3, name: 'anxiety', evaluationType: EmaTypeEvaluationType.RATING },
  { id: 4, name: 'impulsivity', evaluationType: EmaTypeEvaluationType.RATING },
  { id: 5, name: 'selfHarm', evaluationType: EmaTypeEvaluationType.BOOLEAN },
  {
    id: 6,
    name: 'suicidalIdeation',
    evaluationType: EmaTypeEvaluationType.BOOLEAN,
  },
];

const moodStateSeeds: MoodStateSeed[] = [
  { id: 1, name: 'joy' },
  { id: 2, name: 'sadness' },
  { id: 3, name: 'fear' },
  { id: 4, name: 'anger' },
  { id: 5, name: 'guilt' },
  { id: 6, name: 'shame' },
  { id: 7, name: 'rejection' },
];

const skillSeeds: SkillSeed[] = [
  { id: 1, name: 'Temperatura (T)' },
  { id: 2, name: 'Ejercicio Intenso (I)' },
  { id: 3, name: 'Respiración (R)' },
];

const subSkillSeeds: SubSkillSeed[] = [
  { id: 1, name: 'Inmersión facial', skillId: 1 },
  { id: 2, name: 'Compresas frías', skillId: 1 },
  { id: 3, name: 'Sostener un objeto', skillId: 1 },
  { id: 4, name: 'Lavado de manos', skillId: 1 },
  { id: 5, name: 'Ducha fría', skillId: 1 },
  { id: 6, name: 'Saltos de cuerda', skillId: 2 },
  { id: 7, name: 'Skipping', skillId: 2 },
  { id: 8, name: 'Sentadillas', skillId: 2 },
  { id: 9, name: 'Flexiones', skillId: 2 },
  { id: 10, name: 'Saltos estrella', skillId: 2 },
  { id: 11, name: 'Respiración diafragmática', skillId: 3 },
  { id: 12, name: 'Respiración cuadrada', skillId: 3 },
  { id: 13, name: 'Relajación muscular', skillId: 3 },
  { id: 14, name: 'Respiración con visualización', skillId: 3 },
  { id: 15, name: 'Escaneo corporal', skillId: 3 },
];

const stepSeeds: StepSeed[] = [
  {
    id: 1,
    description:
      'Prepara un recipiente con agua fría. Respira profundo antes de empezar.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 1,
  },
  {
    id: 2,
    description:
      'Sumerge tu rostro en el agua fría durante el tiempo indicado.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 1,
  },
  {
    id: 3,
    description:
      '¿Te ayudó esta técnica a calmar tu activación emocional? Califica de 1 a 5.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 1,
  },
  {
    id: 4,
    description:
      'Busca una compresa fría o una toalla humedecida con agua fría.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 2,
  },
  {
    id: 5,
    description: 'Coloca la compresa en tu rostro o cuello por unos segundos.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 2,
  },
  {
    id: 6,
    description:
      'Evalúa si esta técnica te ayudó a disminuir la activación emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 2,
  },
  {
    id: 7,
    description:
      'Encuentra un objeto frío como una botella helada o una compresa.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 3,
  },
  {
    id: 8,
    description:
      'Sostén el objeto frío entre tus manos y enfoca tu atención en la sensación.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 3,
  },
  {
    id: 9,
    description:
      'Evalúa si esta técnica disminuyó tu nivel de tensión emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 3,
  },
  {
    id: 10,
    description:
      'Abre el grifo y ajusta el agua a una temperatura fría tolerable.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 4,
  },
  {
    id: 11,
    description:
      'Lava tus manos lentamente, prestando atención a la sensación del agua fría.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 4,
  },
  {
    id: 12,
    description:
      'Califica si la habilidad te ayudó a bajar la intensidad emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 4,
  },
  {
    id: 13,
    description:
      'Asegúrate de estar en un espacio seguro para tomar una ducha fría.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 5,
  },
  {
    id: 14,
    description: 'Permanece bajo el agua fría durante unos segundos.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 5,
  },
  {
    id: 15,
    description:
      'Indica si esta técnica te ayudó a regular tu activación emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 5,
  },
  {
    id: 16,
    description: 'Busca un espacio seguro para realizar saltos de cuerda.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 6,
  },
  {
    id: 17,
    description: 'Realiza saltos de cuerda a intensidad moderada o alta.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 6,
  },
  {
    id: 18,
    description: 'Evalúa si el ejercicio ayudó a liberar tensión emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 6,
  },
  {
    id: 19,
    description:
      'Párate erguido y prepárate para elevar las rodillas al ritmo.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 7,
  },
  {
    id: 20,
    description:
      'Haz skipping elevando las rodillas rápidamente por el tiempo indicado.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 7,
  },
  {
    id: 21,
    description:
      'Indica si esta actividad te ayudó a reducir tu activación emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 7,
  },
  {
    id: 22,
    description: 'Colócate de pie con los pies a la altura de los hombros.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 8,
  },
  {
    id: 23,
    description:
      'Realiza sentadillas a un ritmo constante manteniendo la forma.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 8,
  },
  {
    id: 24,
    description:
      'Evalúa si esta técnica te ayudó a bajar la intensidad emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 8,
  },
  {
    id: 25,
    description:
      'Ubícate en posición de flexión manteniendo tu cuerpo alineado.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 9,
  },
  {
    id: 26,
    description: 'Realiza flexiones controladas durante el tiempo indicado.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 9,
  },
  {
    id: 27,
    description:
      '¿Te ayudó esta técnica a regular tus emociones? Califica el resultado.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 9,
  },
  {
    id: 28,
    description: 'Párate erguido y prepárate para realizar saltos explosivos.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 10,
  },
  {
    id: 29,
    description: 'Realiza saltos estrella abriendo brazos y piernas.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 10,
  },
  {
    id: 30,
    description: 'Evalúa si esta actividad redujo tu tensión emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 10,
  },
  {
    id: 31,
    description:
      'Siéntate o recuéstate en una posición cómoda y coloca una mano en tu abdomen.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 11,
  },
  {
    id: 32,
    description: 'Inhala por la nariz llenando tu abdomen y exhala lentamente.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 11,
  },
  {
    id: 33,
    description: 'Evalúa si esta técnica te ayudó a recuperar la calma.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 11,
  },
  {
    id: 34,
    description:
      'Encuentra un lugar tranquilo y siéntate en una posición cómoda.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 12,
  },
  {
    id: 35,
    description:
      'Inhala 4 segundos, retén 4 segundos, exhala 4 segundos, retén 4 segundos.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 12,
  },
  {
    id: 36,
    description:
      '¿La respiración ayudó a disminuir tu activación emocional? Califica.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 12,
  },
  {
    id: 37,
    description: 'Siéntate o recuéstate de manera cómoda antes de comenzar.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 13,
  },
  {
    id: 38,
    description:
      'Tensa y luego suelta distintos grupos musculares guiándote por las instrucciones.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 13,
  },
  {
    id: 39,
    description: 'Indica si la técnica ayudó a relajar tu cuerpo y mente.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 13,
  },
  {
    id: 40,
    description: 'Elige una imagen mental calmante como una playa o un bosque.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 14,
  },
  {
    id: 41,
    description: 'Respira profundamente mientras visualizas la escena elegida.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 14,
  },
  {
    id: 42,
    description:
      'Evalúa si esta visualización te ayudó a recuperar estabilidad emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 14,
  },
  {
    id: 43,
    description:
      'Encuentra un lugar tranquilo y colócate en una posición cómoda.',
    hasTimer: false,
    requiresValidation: false,
    subSkillId: 15,
  },
  {
    id: 44,
    description:
      'Recorre mentalmente cada parte de tu cuerpo observando sensaciones.',
    hasTimer: true,
    requiresValidation: false,
    subSkillId: 15,
  },
  {
    id: 45,
    description:
      'Indica si el escaneo corporal ayudó a disminuir tu activación emocional.',
    hasTimer: false,
    requiresValidation: true,
    subSkillId: 15,
  },
];

const dailyQuoteSeeds: DailyQuoteSeed[] = [
  {
    id: 1,
    quote: 'Cada día es una nueva oportunidad para crecer y sanar.',
    day: 1,
  },
  { id: 2, quote: 'Tu bienestar es una prioridad, cuídate con amor.', day: 2 },
  { id: 3, quote: 'Pequeños pasos pueden llevar a grandes cambios.', day: 3 },
  { id: 4, quote: 'Confía en el proceso de curación y en ti mismo.', day: 4 },
  {
    id: 5,
    quote: 'Cada emoción es temporal, y tú tienes el poder de manejarla.',
    day: 5,
  },
  {
    id: 6,
    quote: 'Eres más fuerte de lo que imaginas, sigue adelante.',
    day: 6,
  },
  {
    id: 7,
    quote: 'El amor propio es el inicio de toda transformación.',
    day: 7,
  },
  { id: 8, quote: 'Permítete sentir y sanar a tu propio ritmo.', day: 8 },
  {
    id: 9,
    quote: 'Respirar profundo es un acto de cuidado hacia ti mismo.',
    day: 9,
  },
  {
    id: 10,
    quote: 'No tienes que estar bien todos los días para ser valioso.',
    day: 10,
  },
  {
    id: 11,
    quote:
      'La calma no es ausencia de tormenta, es encontrar paz en medio de ella.',
    day: 11,
  },
  {
    id: 12,
    quote: 'Hoy basta con dar un paso; mañana podrás dar otro.',
    day: 12,
  },
  {
    id: 13,
    quote: 'Pedir ayuda es un signo de valentía, no de debilidad.',
    day: 13,
  },
  {
    id: 14,
    quote: 'Tu historia no termina aquí; hay más capítulos por vivir.',
    day: 14,
  },
  {
    id: 15,
    quote: 'Las emociones difíciles también pasan; espéralas con compasión.',
    day: 15,
  },
  {
    id: 16,
    quote: 'Mereces el mismo cuidado que das a las personas que amas.',
    day: 16,
  },
  {
    id: 17,
    quote: 'Cada respiración consciente te acerca a la calma interior.',
    day: 17,
  },
  {
    id: 18,
    quote: 'No eres tus pensamientos; puedes observarlos sin ser ellos.',
    day: 18,
  },
  {
    id: 19,
    quote: 'La vulnerabilidad es la base de toda conexión genuina.',
    day: 19,
  },
  {
    id: 20,
    quote: 'Hoy elige una pequeña acción que cuide de ti mismo.',
    day: 20,
  },
  {
    id: 21,
    quote: 'La paciencia contigo mismo es una forma de amor.',
    day: 21,
  },
  {
    id: 22,
    quote:
      'Los días difíciles también forman parte del camino hacia la sanación.',
    day: 22,
  },
  {
    id: 23,
    quote: 'Cuidar tu salud mental es tan importante como cuidar tu cuerpo.',
    day: 23,
  },
  {
    id: 24,
    quote: 'Tienes el derecho de establecer límites que te protejan.',
    day: 24,
  },
  {
    id: 25,
    quote: 'Cada momento de paz que encuentras es una victoria.',
    day: 25,
  },
  {
    id: 26,
    quote: 'No necesitas ser perfecto para merecer amor y apoyo.',
    day: 26,
  },
  {
    id: 27,
    quote:
      'La autocompasión comienza cuando te tratas como tratarías a un amigo.',
    day: 27,
  },
  {
    id: 28,
    quote: 'Tus esfuerzos cuentan, aunque no siempre sean visibles.',
    day: 28,
  },
  { id: 29, quote: 'Hoy puedes elegir ser gentil contigo mismo.', day: 29 },
  {
    id: 30,
    quote: 'El cuidado personal no es egoísmo, es una necesidad legítima.',
    day: 30,
  },
  {
    id: 31,
    quote:
      'Cuando sientas que no puedes más, recuerda que ya has superado días difíciles.',
    day: 31,
  },
  {
    id: 32,
    quote: 'Reconocer tus emociones es el primer paso para regularlas.',
    day: 32,
  },
  {
    id: 33,
    quote: 'La esperanza no requiere certeza, solo disposición a seguir.',
    day: 33,
  },
  { id: 34, quote: 'Tu mente merece tanto descanso como tu cuerpo.', day: 34 },
  {
    id: 35,
    quote:
      'Date permiso de sentir sin juzgarte; todas tus emociones son válidas.',
    day: 35,
  },
  {
    id: 36,
    quote: 'Cada vez que buscas ayuda, estás eligiendo cuidarte.',
    day: 36,
  },
  {
    id: 37,
    quote: 'La rutina puede ser un ancla cuando el mundo parece incierto.',
    day: 37,
  },
  {
    id: 38,
    quote: 'No tienes que resolverlo todo hoy; enfócate en este momento.',
    day: 38,
  },
  {
    id: 39,
    quote: 'Tus experiencias difíciles no definen tu valor como persona.',
    day: 39,
  },
  {
    id: 40,
    quote: 'Hay fuerza en la quietud y en el silencio interior.',
    day: 40,
  },
  {
    id: 41,
    quote: 'Hoy elige una cosa que te traiga un poco de alegría.',
    day: 41,
  },
  {
    id: 42,
    quote:
      'Las crisis también son oportunidades para conocerte más profundamente.',
    day: 42,
  },
  {
    id: 43,
    quote: 'Mereces apoyo; no tienes que atravesar esto solo.',
    day: 43,
  },
  {
    id: 44,
    quote: 'Respirar es el ancla más poderosa al momento presente.',
    day: 44,
  },
  {
    id: 45,
    quote:
      'La recuperación no es lineal; los retrocesos forman parte del proceso.',
    day: 45,
  },
  {
    id: 46,
    quote: 'Cada vez que cuidas de ti mismo, estás eligiendo tu bienestar.',
    day: 46,
  },
  {
    id: 47,
    quote: 'El descanso también es productivo; tu cuerpo y mente lo necesitan.',
    day: 47,
  },
  {
    id: 48,
    quote: 'Tus sentimientos son válidos, aunque no siempre sean cómodos.',
    day: 48,
  },
  {
    id: 49,
    quote:
      'Hoy observa un momento de belleza en tu entorno, por pequeño que sea.',
    day: 49,
  },
  {
    id: 50,
    quote:
      'La aceptación no es resignación; es el punto de partida del cambio.',
    day: 50,
  },
  {
    id: 51,
    quote: 'Puedes atravesar lo difícil sin que eso te defina para siempre.',
    day: 51,
  },
  {
    id: 52,
    quote: 'La gratitud puede coexistir con el dolor; no son opuestos.',
    day: 52,
  },
  {
    id: 53,
    quote: 'Hoy confía en que eres suficiente tal como eres.',
    day: 53,
  },
  {
    id: 54,
    quote:
      'Cada vez que te levantas después de caer, demuestras tu resiliencia.',
    day: 54,
  },
  {
    id: 55,
    quote:
      'La conexión con otros puede ser un refugio en los momentos difíciles.',
    day: 55,
  },
  {
    id: 56,
    quote: 'No hay prisa en la sanación; cada ritmo es válido.',
    day: 56,
  },
  { id: 57, quote: 'Date el permiso de no tener todo bajo control.', day: 57 },
  {
    id: 58,
    quote:
      'Tus pensamientos no siempre dicen la verdad; obsévalos con gentileza.',
    day: 58,
  },
  {
    id: 59,
    quote: 'La bondad hacia ti mismo es el cimiento de una vida plena.',
    day: 59,
  },
  {
    id: 60,
    quote: 'Incluso en los días grises, hay algo por lo que continuar.',
    day: 60,
  },
  {
    id: 61,
    quote: 'Hoy elige una emoción difícil y nómbrala sin juzgarla.',
    day: 61,
  },
  {
    id: 62,
    quote:
      'Estar plenamente presente en el momento es un regalo que puedes darte.',
    day: 62,
  },
  { id: 63, quote: 'No estás roto; estás en proceso de sanación.', day: 63 },
  {
    id: 64,
    quote:
      'Cada acto de cuidado personal suma en tu camino hacia el bienestar.',
    day: 64,
  },
  {
    id: 65,
    quote:
      'La mente y el cuerpo trabajan juntos; cuida ambos con igual atención.',
    day: 65,
  },
  {
    id: 66,
    quote: 'Hoy reconoce algo que hayas hecho bien, por pequeño que parezca.',
    day: 66,
  },
  {
    id: 67,
    quote: 'Buscar ayuda profesional es una de las decisiones más valientes.',
    day: 67,
  },
  {
    id: 68,
    quote: 'Las emociones intensas son señales, no sentencias permanentes.',
    day: 68,
  },
  {
    id: 69,
    quote: 'Hoy practica decirte algo amable a ti mismo y créetelo.',
    day: 69,
  },
  {
    id: 70,
    quote: 'La resiliencia se construye un día difícil a la vez.',
    day: 70,
  },
  {
    id: 71,
    quote: 'No tienes que ganar cada batalla; basta con no rendirte.',
    day: 71,
  },
  {
    id: 72,
    quote: 'Hoy permite que alguien te cuide si lo necesitas; no estás solo.',
    day: 72,
  },
  {
    id: 73,
    quote: 'La autoconciencia es la llave que abre las puertas del cambio.',
    day: 73,
  },
  {
    id: 74,
    quote: 'Cada pequeño progreso merece ser reconocido y celebrado.',
    day: 74,
  },
  {
    id: 75,
    quote: 'Hoy escucha lo que tu cuerpo necesita y atiéndelo.',
    day: 75,
  },
  {
    id: 76,
    quote:
      'La compasión hacia ti mismo es tan válida como hacia cualquier otra persona.',
    day: 76,
  },
  {
    id: 77,
    quote: 'No hay vergüenza en pedir ayuda; es un acto de amor propio.',
    day: 77,
  },
  {
    id: 78,
    quote: 'Hoy enfócate en lo que puedes controlar y suelta lo que no puedes.',
    day: 78,
  },
  {
    id: 79,
    quote: 'La creatividad puede ser un canal para procesar tus emociones.',
    day: 79,
  },
  {
    id: 80,
    quote: 'Un pequeño momento de calma puede cambiar el curso de tu día.',
    day: 80,
  },
  {
    id: 81,
    quote: 'Hoy recuerda que estás aprendiendo, no fallando.',
    day: 81,
  },
  {
    id: 82,
    quote: 'La conexión con la naturaleza puede ser una fuente de serenidad.',
    day: 82,
  },
  {
    id: 83,
    quote: 'Tus límites son una expresión de respeto hacia ti mismo.',
    day: 83,
  },
  {
    id: 84,
    quote:
      'Hoy encuentra un momento para agradecer por algo, por pequeño que sea.',
    day: 84,
  },
  {
    id: 85,
    quote:
      'La mente necesita espacios de silencio para recuperarse y descansar.',
    day: 85,
  },
  {
    id: 86,
    quote:
      'No tienes que sentirte bien para actuar con cuidado hacia ti mismo.',
    day: 86,
  },
  {
    id: 87,
    quote: 'Sé tan paciente contigo como lo serías con alguien que amas.',
    day: 87,
  },
  {
    id: 88,
    quote: 'Cada crisis superada es evidencia de tu capacidad de sobrevivir.',
    day: 88,
  },
  {
    id: 89,
    quote:
      'Aceptar tus emociones sin juzgarlas reduce su intensidad con el tiempo.',
    day: 89,
  },
  {
    id: 90,
    quote:
      'Hoy celebra el hecho de haber llegado hasta aquí; eso es suficiente.',
    day: 90,
  },
  {
    id: 91,
    quote: 'Las relaciones de apoyo son un pilar fundamental del bienestar.',
    day: 91,
  },
  {
    id: 92,
    quote:
      'No todo lo que piensas es un hecho; observa tus pensamientos con distancia.',
    day: 92,
  },
  {
    id: 93,
    quote: 'Hoy elige una habilidad de afrontamiento y ponla en práctica.',
    day: 93,
  },
  {
    id: 94,
    quote:
      'La sanación no ocurre de golpe; ocurre en capas, con tiempo y cuidado.',
    day: 94,
  },
  {
    id: 95,
    quote:
      'Mereces un espacio donde te sientas seguro y profundamente comprendido.',
    day: 95,
  },
  {
    id: 96,
    quote: 'Hoy recuerda una vez en que superaste algo que parecía imposible.',
    day: 96,
  },
  {
    id: 97,
    quote: 'La autoestima no depende del juicio ajeno; viene de dentro de ti.',
    day: 97,
  },
  {
    id: 98,
    quote: 'Sé gentil con los errores del pasado; te hicieron quien eres hoy.',
    day: 98,
  },
  {
    id: 99,
    quote:
      'La regulación emocional es una habilidad que se aprende con práctica constante.',
    day: 99,
  },
  {
    id: 100,
    quote: 'Cada día que eliges cuidarte es un paso en la dirección correcta.',
    day: 100,
  },
  {
    id: 101,
    quote: 'No eres tu diagnóstico; eres mucho más que cualquier etiqueta.',
    day: 101,
  },
  {
    id: 102,
    quote: 'Hoy busca un momento de conexión genuina con alguien de confianza.',
    day: 102,
  },
  {
    id: 103,
    quote:
      'Los momentos de calma también existen; encuéntralos y habita en ellos.',
    day: 103,
  },
  {
    id: 104,
    quote:
      'Date permiso de descansar sin sentirte culpable; el descanso también sana.',
    day: 104,
  },
  {
    id: 105,
    quote:
      'La esperanza es el combustible que nos mantiene en marcha día a día.',
    day: 105,
  },
  {
    id: 106,
    quote: 'No tienes que ser el mismo de ayer; puedes elegir cómo ser hoy.',
    day: 106,
  },
  {
    id: 107,
    quote:
      'Hoy presta atención a una sensación física agradable, por pequeña que sea.',
    day: 107,
  },
  {
    id: 108,
    quote:
      'El camino hacia el bienestar incluye tropiezos; eso es completamente normal.',
    day: 108,
  },
  {
    id: 109,
    quote:
      'Tus pensamientos más oscuros no son una predicción; son señales de que necesitas apoyo.',
    day: 109,
  },
  {
    id: 110,
    quote: 'Hoy recuerda que mereces cuidado, ayuda y compasión incondicional.',
    day: 110,
  },
  {
    id: 111,
    quote: 'Cada instante en que te cuidas a ti mismo es un acto de valentía.',
    day: 111,
  },
  {
    id: 112,
    quote:
      'La atención plena te ayuda a vivir el presente, no el miedo al futuro.',
    day: 112,
  },
  {
    id: 113,
    quote: 'Hoy encuentra algo que te conecte con tu sentido de propósito.',
    day: 113,
  },
  {
    id: 114,
    quote:
      'No estás solo en tu sufrimiento; muchos han transitado caminos similares.',
    day: 114,
  },
  {
    id: 115,
    quote:
      'Hoy elige una forma de movimiento que te haga sentir bien en tu cuerpo.',
    day: 115,
  },
  {
    id: 116,
    quote:
      'La salud mental es tan real e importante como cualquier otra salud.',
    day: 116,
  },
  {
    id: 117,
    quote: 'Cada vez que te hablas con amabilidad, te estás ayudando a sanar.',
    day: 117,
  },
  {
    id: 118,
    quote:
      'Hoy identifica qué emoción estás sintiendo y dale espacio sin juzgarla.',
    day: 118,
  },
  {
    id: 119,
    quote:
      'El bienestar es un camino, no un destino; disfruta cada paso del proceso.',
    day: 119,
  },
  {
    id: 120,
    quote:
      'Hoy y siempre, recuerda: mereces sanar, mereces ser amado y mereces ser feliz.',
    day: 120,
  },
];

async function ensureBehaviors(manager: EntityManager): Promise<void> {
  logger.log('Seeding behaviors...');
  const existing = await manager.find(Behavior);

  if (existing.length === 0) {
    for (const behavior of behaviorSeeds) {
      await manager.insert(Behavior, behavior);
    }
  }
}

async function ensureEmaTypes(manager: EntityManager): Promise<void> {
  logger.log('Seeding ema types...');
  const existing = await manager.find(EmaType);

  if (existing.length === 0) {
    for (const emaType of emaTypeSeeds) {
      await manager.insert(EmaType, emaType);
    }
  }
}

async function ensureMoodStates(manager: EntityManager): Promise<void> {
  logger.log('Seeding mood states...');
  const existing = await manager.find(MoodState);

  if (existing.length === 0) {
    for (const moodState of moodStateSeeds) {
      await manager.insert(MoodState, moodState);
    }
  }
}

async function ensureSkills(manager: EntityManager): Promise<void> {
  logger.log('Seeding skills...');
  const existing = await manager.find(Skill);

  if (existing.length === 0) {
    for (const skill of skillSeeds) {
      await manager.insert(Skill, skill);
    }
  }
}

async function ensureSubSkills(manager: EntityManager): Promise<void> {
  logger.log('Seeding sub skills...');
  const existing = await manager.find(SubSkill);

  if (existing.length === 0) {
    for (const subSkill of subSkillSeeds) {
      await manager.query(
        `INSERT INTO sub_skills (id, name, "skillId", "deletedAt") VALUES ($1, $2, $3, NULL)`,
        [subSkill.id, subSkill.name, subSkill.skillId],
      );
    }
  }
}

async function ensureSteps(manager: EntityManager): Promise<void> {
  logger.log('Seeding steps...');
  const existing = await manager.find(Step);

  if (existing.length === 0) {
    for (const step of stepSeeds) {
      await manager.query(
        `INSERT INTO steps (id, description, "hasTimer", "requiresValidation", "subSkillId", "deletedAt") VALUES ($1, $2, $3, $4, $5, NULL)`,
        [
          step.id,
          step.description,
          step.hasTimer,
          step.requiresValidation,
          step.subSkillId,
        ],
      );
    }
  }
}

async function ensureDailyQuotes(manager: EntityManager): Promise<void> {
  logger.log('Seeding daily quotes...');
  const existing = await manager.find(DailyQuote);

  if (existing.length === 0) {
    for (const quote of dailyQuoteSeeds) {
      await manager.insert(DailyQuote, quote);
    }
  }
}

async function runSeed(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      await ensureBehaviors(manager);
      await ensureEmaTypes(manager);
      await ensureMoodStates(manager);
      await ensureSkills(manager);
      await ensureSubSkills(manager);
      await ensureSteps(manager);
      await ensureDailyQuotes(manager);
      logger.log('✅ Seed completed successfully');
    });
  } finally {
    await dataSource.destroy();
  }
}

export { runSeed };

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}
