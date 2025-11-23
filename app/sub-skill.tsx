import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, ImageBackground, ScrollView, Text, TouchableOpacity, View, DeviceEventEmitter } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { get, post } from './lib/api'
import { loadUser } from './lib/storage'

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
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-indigo-600 mt-3">Cargando…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-xl text-red-600">{error}</Text>
      </View>
    )
  }

  return (
    <ImageBackground source={require('../assets/images/background/bg2.png')} resizeMode="cover" style={{ flex: 1 }} imageStyle={{ opacity: 1 }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center">
            <Text className="text-indigo-600 text-lg">← Volver</Text>
          </TouchableOpacity>
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-indigo-700 mb-1">{name}</Text>
            <Text className="text-indigo-500 text-center">{skillName}</Text>
          </View>
        </View>
        <View className="px-6">
          <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-6">
            <Text className="text-indigo-700 text-lg font-semibold mb-3">Paso {currentIndex + 1} de {steps.length}</Text>
            <Text className="text-indigo-700 text-base leading-6 mb-4">{currentStep?.description}</Text>
            {currentStep?.hasTimer && (
              <View className="items-center mb-4">
                <Text className="text-indigo-600 text-xl font-bold mb-2">{secondsLeft}s</Text>
                {!timerRunning ? (
                  <TouchableOpacity onPress={startTimer} className="bg-indigo-600 rounded-xl px-5 py-3">
                    <Text className="text-white font-semibold">Iniciar temporizador</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={pauseTimer} className="bg-indigo-300 rounded-xl px-5 py-3">
                    <Text className="text-white font-semibold">Pausar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {currentStep?.requiresValidation && (
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Califica efectividad</Text>
                <View className="flex-row justify-between" style={{ gap: 8 }}>
                  {[1,2,3,4,5].map(v => (
                    <TouchableOpacity key={v} onPress={() => setRating(v)} className={`w-10 h-10 rounded-full items-center justify-center ${ratings[currentStep.id] === v ? 'bg-indigo-600' : 'bg-white border border-indigo-200'}`}>
                      <Text className={`${ratings[currentStep.id] === v ? 'text-white' : 'text-indigo-700'} font-bold`}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity onPress={handleNext} disabled={!canProceed()} className={`rounded-2xl px-6 py-4 mt-6 ${canProceed() ? 'bg-indigo-600' : 'bg-indigo-300'}`}>
              <Text className="text-white text-center font-semibold text-lg">{currentIndex < steps.length - 1 ? 'Siguiente' : 'Finalizar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="h-8" />
      </ScrollView>
    </ImageBackground>
  )
}