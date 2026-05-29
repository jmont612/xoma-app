import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, DeviceEventEmitter, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { get, post } from './lib/api'
import { loadUser } from './lib/storage'

function skillToIcon(skillName: string): any {
  const s = (skillName || '').toLowerCase()
  if (s.includes('temper')) return require('../assets/images/icons/temperature-icon.png')
  if (s.includes('ejerc') || s.includes('intens') || s.includes('mov')) return require('../assets/images/icons/intense-icon.png')
  return require('../assets/images/icons/breath-icon.png')
}

function skillToTags(skillName: string): { label: string; icon: any }[] {
  const s = (skillName || '').toLowerCase()
  if (s.includes('temper')) {
    return [
      { label: 'Calma', icon: require('../assets/images/icons/mood-good.png') },
      { label: 'Frío', icon: require('../assets/images/icons/temperature-icon.png') },
    ]
  }
  if (s.includes('ejerc') || s.includes('intens') || s.includes('mov')) {
    return [
      { label: 'Energía', icon: require('../assets/images/icons/intense-icon.png') },
      { label: 'Movimiento', icon: require('../assets/images/icons/mood-amazing.png') },
    ]
  }
  return [
    { label: 'Calma', icon: require('../assets/images/icons/mood-good.png') },
    { label: 'Respiro', icon: require('../assets/images/icons/breath-icon.png') },
  ]
}

function stepLabel(index: number): string {
  if (index === 0) return 'Preparación'
  if (index === 1) return 'Práctica'
  if (index === 2) return 'Cierre'
  return 'Paso'
}

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function SubSkillScreen() {
  const { subSkillId } = useLocalSearchParams<{ subSkillId: string }>()
  const idNum = useMemo(() => Number(subSkillId), [subSkillId])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [skillName, setSkillName] = useState('')
  const [steps, setSteps] = useState<{ id: number; description: string; hasTimer: boolean; requiresValidation: boolean }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await get<{ data: { id: number; name: string; skill: { id: number; name: string }; steps: { id: number; description: string; hasTimer: boolean; requiresValidation: boolean }[] } }>(`/sub-skills/${idNum}`)
        const data = res.data
        setName(data.name)
        setSkillName(data.skill?.name || '')
        setSteps((data.steps || []).map(s => ({ id: s.id, description: s.description, hasTimer: !!s.hasTimer, requiresValidation: !!s.requiresValidation })))
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar la sub-habilidad')
      } finally {
        setLoading(false)
      }
    })()
  }, [idNum])

  useEffect(() => {
    if (!timerRunning) return
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  const startTimer = () => {
    setSecondsLeft(30)
    setTimerRunning(true)
  }

  const pauseTimer = () => {
    setTimerRunning(false)
  }

  const resetTimer = () => {
    setSecondsLeft(30)
    setTimerRunning(false)
  }

  const currentStep = steps[currentIndex]
  const canProceed = () => {
    if (!currentStep) return false
    if (currentStep.requiresValidation && !ratings[currentStep.id]) return false
    return true
  }

  const handleNext = async () => {
    if (!canProceed()) return
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSecondsLeft(30)
      setTimerRunning(false)
    } else {
      try {
        const me = await loadUser<any>()
        const userId = (me?.id ?? me?.userId ?? 1) as number
        const ratingsValues = Object.values(ratings)
        const ratingVal = ratingsValues.length ? ratingsValues[ratingsValues.length - 1] : 0
        const effective = ratingVal >= 3
        await post<any>('/user-skill-activities', {
          userId,
          subSkillId: idNum,
          status: 'completed',
          effective,
          rating: ratingVal,
        })
      } catch {}
      DeviceEventEmitter.emit('skill-completed', { subSkillId: idNum })
      router.back()
    }
  }

  const setRating = (value: number) => {
    if (!currentStep) return
    setRatings(prev => ({ ...prev, [currentStep.id]: value }))
  }

  if (loading) {
    return (
      <View className="flex-1 bg-neutral items-center justify-center">
        <ActivityIndicator size="large" color="#2D5A6E" />
        <Text className="text-primary mt-3 font-semibold">Cargando…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral items-center justify-center px-6">
        <Text className="text-red-600 text-center font-semibold">{error}</Text>
      </View>
    )
  }

  const totalSteps = steps.length || 3
  const headerTitle = 'Guía de Calma'
  const mainIcon = skillToIcon(skillName)
  const tags = skillToTags(skillName)
  const isStepOne = currentIndex === 0
  const isTimerStep = !!currentStep?.hasTimer
  const isFinalStep = currentIndex === totalSteps - 1

  return (
    <View className="flex-1 bg-neutral">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <View className="px-6 pt-14">
          {isStepOne ? (
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
                <Text className="text-primary text-2xl" style={{ includeFontPadding: false, lineHeight: 24 }}>×</Text>
              </TouchableOpacity>
              <Text className="text-gray-800 font-bold text-base">{headerTitle}</Text>
              <View className="w-10 h-10" />
            </View>
          ) : (
            <View className="items-center">
              {isFinalStep ? (
                <View className="w-full flex-row items-center">
                  <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2 mr-2">
                    <Text className="text-primary text-xl" style={{ includeFontPadding: false, lineHeight: 20 }}>←</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-800 font-bold text-base">Reflection</Text>
                </View>
              ) : (
                <View className="w-full flex-row items-center justify-between">
                  <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
                    <Text className="text-primary text-xl" style={{ includeFontPadding: false, lineHeight: 20 }}>←</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-800 font-bold">The Resilient Sanctuary</Text>
                  <View className="w-10 h-10" />
                </View>
              )}
            </View>
          )}

          <View className="mt-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs font-bold tracking-widest">{`PASO ${currentIndex + 1} DE ${totalSteps}`}</Text>
              {isFinalStep ? (
                <Text className="text-primary font-bold text-sm">100%</Text>
              ) : (
                <Text className="text-gray-500 text-sm">{stepLabel(currentIndex)}</Text>
              )}
            </View>
            <View className="h-2 rounded-full bg-gray-100 mt-3 overflow-hidden">
              <View
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, ((currentIndex + 1) / totalSteps) * 100))}%` }}
              />
            </View>
          </View>
        </View>

        {isStepOne && (
          <View className="px-6 mt-6">
            <View className="bg-[#DDF4F3] rounded-[28px] h-72 overflow-hidden items-center justify-center">
              <View className="absolute w-72 h-72 rounded-full bg-[#CFF1E2] -top-44 -left-44 opacity-60" />
              <View className="absolute w-72 h-72 rounded-full bg-[#DFF4FC] -bottom-44 -right-44 opacity-60" />
              <View className="w-56 h-56 rounded-[24px] bg-white/30 items-center justify-center">
                <Image
                  source={require('../assets/images/person-meditation.png')}
                  resizeMode="contain"
                  style={{ width: 240, height: 240, opacity: 0.95 }}
                />
              </View>
            </View>

            <View className="bg-white rounded-[28px] p-6 mt-6 shadow-sm border border-gray-100">
              <Text className="text-gray-900 text-2xl font-extrabold mb-3">Prepárate</Text>
              <Text className="text-gray-500 leading-6">{currentStep?.description || 'Encuentra un lugar tranquilo y respira profundamente. Este es tu momento de seguridad.'}</Text>

              <View className="flex-row mt-6" style={{ gap: 16 }}>
                {tags.map(t => (
                  <View key={t.label} className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-[#EAF5F5] items-center justify-center mr-3">
                      <Image source={t.icon} resizeMode="contain" style={{ width: 18, height: 18, tintColor: '#2D5A6E' }} />
                    </View>
                    <Text className="text-gray-600 font-bold">{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceed()}
              className={`rounded-full py-5 mt-6 ${canProceed() ? 'bg-primary active:bg-primary/90' : 'bg-primary/60'}`}
            >
              <View className="flex-row items-center justify-between px-6">
                <Text className="text-white font-bold text-base">Continuar</Text>
                <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white text-xl" style={{ includeFontPadding: false, lineHeight: 20 }}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {!isStepOne && isTimerStep && (
          <View className="px-6 mt-8">
            <Text className="text-gray-900 text-3xl font-extrabold text-center mb-8">{name}</Text>

            <View className="items-center mb-10">
              <View className="w-64 h-64 rounded-full bg-[#EAF5F5] items-center justify-center overflow-hidden">
                <View className="absolute w-72 h-72 rounded-full bg-[#DFF4FC] opacity-60" />
                <View className="absolute w-56 h-56 rounded-full bg-white/50" />
                <Text className="text-gray-400 text-[11px] font-bold tracking-widest mb-2">TIEMPO RESTANTE</Text>
                <Text className="text-primary text-5xl font-extrabold" style={{ includeFontPadding: false, lineHeight: 56 }}>
                  {formatMMSS(secondsLeft)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => (timerRunning ? pauseTimer() : startTimer())}
              className="bg-primary rounded-full py-5 items-center shadow-sm"
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-base">
                  {timerRunning ? 'Pausar ejercicio' : 'Iniciar ejercicio'}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row justify-between mt-5" style={{ gap: 16 }}>
              <TouchableOpacity
                onPress={pauseTimer}
                className="flex-1 bg-[#EAF5F5] rounded-full py-4 items-center border border-primary/10"
              >
                <Text className="text-primary font-bold">Detener</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetTimer}
                className="flex-1 bg-[#EAF5F5] rounded-full py-4 items-center border border-primary/10"
              >
                <Text className="text-primary font-bold">Reiniciar</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-[28px] p-6 mt-8 shadow-sm border border-gray-100">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-[#CFF1E2] items-center justify-center mr-4">
                  <Text className="text-primary font-extrabold">i</Text>
                </View>
                <Text className="text-gray-700 leading-6 flex-1">
                  {currentStep?.description || 'Realiza el ejercicio ahora. Mantén la atención en tu respiración. Deja que cada inhalación te ancle al presente.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceed()}
              className={`rounded-full py-5 mt-8 ${canProceed() ? 'bg-[#BFE3F5]' : 'bg-[#BFE3F5]/60'}`}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-primary font-extrabold text-base mr-3">Siguiente</Text>
                <Text className="text-primary text-xl" style={{ includeFontPadding: false, lineHeight: 20 }}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {!isStepOne && !isTimerStep && isFinalStep && (
          <View className="px-6 mt-6">
            <Text className="text-gray-900 text-4xl font-extrabold leading-tight mb-6">
              ¿Te ayudó esta habilidad?
            </Text>
            <Text className="text-gray-500 mb-8">Califica</Text>

            <View className="flex-row justify-between mb-3" style={{ gap: 12 }}>
              {[1, 2, 3, 4, 5].map(v => {
                const selected = !!currentStep && ratings[currentStep.id] === v
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setRating(v)}
                    className={`flex-1 h-12 rounded-full items-center justify-center border ${selected ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`${selected ? 'text-white' : 'text-primary'} font-extrabold`}>{v}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View className="flex-row justify-between mb-8">
              <Text className="text-gray-400 text-xs font-semibold">Muy poco</Text>
              <Text className="text-gray-400 text-xs font-semibold">Bastante</Text>
            </View>

            <View className="rounded-[28px] overflow-hidden bg-[#EAF5F5] mb-8">
              <Image
                source={require('../assets/images/background/bg4.png')}
                resizeMode="cover"
                style={{ width: '100%', height: 140 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceed()}
              className={`rounded-full py-5 mt-6 ${canProceed() ? 'bg-primary active:bg-primary/90' : 'bg-primary/60'}`}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-white font-extrabold text-base mr-3">Finalizar</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {!isStepOne && !isTimerStep && !isFinalStep && (
          <View className="px-6 mt-6">
            <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-[#EAF5F5] items-center justify-center mr-4">
                  <Image source={mainIcon} resizeMode="contain" style={{ width: 22, height: 22, tintColor: '#2D5A6E' }} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-extrabold">{name}</Text>
                  <Text className="text-gray-500 text-xs">{skillName}</Text>
                </View>
              </View>

              <Text className="text-gray-700 leading-6">{currentStep?.description}</Text>

              {currentStep?.requiresValidation && (
                <View className="mt-6">
                  <Text className="text-gray-800 font-bold mb-3">Califica efectividad</Text>
                  <View className="flex-row" style={{ gap: 10 }}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <TouchableOpacity
                        key={v}
                        onPress={() => setRating(v)}
                        className={`w-11 h-11 rounded-full items-center justify-center ${ratings[currentStep.id] === v ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                      >
                        <Text className={`${ratings[currentStep.id] === v ? 'text-white' : 'text-gray-700'} font-bold`}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={handleNext}
                disabled={!canProceed()}
                className={`rounded-full py-5 mt-6 ${canProceed() ? 'bg-primary active:bg-primary/90' : 'bg-primary/60'}`}
              >
                <Text className="text-white text-center font-bold text-base">
                  {currentIndex < totalSteps - 1 ? 'Continuar' : 'Finalizar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
