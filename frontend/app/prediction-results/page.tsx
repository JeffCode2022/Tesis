import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Resultados de Predicción | Sistema de Predicción Cardiovascular',
    description: 'Resultados y análisis de las predicciones cardiovasculares realizadas',
}

export default function PredictionResultsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Resultados de Predicción
                </h1>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <p className="text-gray-600">
                        Esta página está en desarrollo. Aquí se mostrarán los resultados de las predicciones realizadas.
                    </p>
                </div>
            </div>
        </div>
    )
}