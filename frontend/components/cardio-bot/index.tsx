"use client"

import type React from "react"

import { useState } from "react"
import { Bot, X, MessageCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BotMessage {
  type: "bot" | "user"
  message: string
  timestamp?: Date
}

interface CardioBotProps {
  messages: BotMessage[]
  onSendMessage: (message: string) => void
}

export function CardioBot({ messages, onSendMessage }: CardioBotProps) {
  const [showBot, setShowBot] = useState(false)
  const [inputMessage, setInputMessage] = useState("")

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage)
      setInputMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "¿Cómo interpretar los resultados?",
    "Factores de riesgo principales",
    "Recomendaciones para pacientes",
    "Importar datos médicos",
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!showBot && (
        <Button
          onClick={() => setShowBot(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
        >
          <Bot className="h-8 w-8" />
        </Button>
      )}

      {showBot && (
        <Card className="w-96 h-[500px] shadow-2xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <CardTitle className="text-lg">CardioBot AI</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBot(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-blue-100">Asistente inteligente de salud cardiovascular</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[420px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}

              {/* Preguntas rápidas */}
              {messages.length === 1 && (
                <div className="space-y-2 mt-4">
                  <div className="text-xs text-gray-500 text-center">Preguntas frecuentes:</div>
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-xs h-auto py-2"
                      onClick={() => onSendMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Pregúntame sobre salud cardiovascular..."
                  className="flex-1"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
