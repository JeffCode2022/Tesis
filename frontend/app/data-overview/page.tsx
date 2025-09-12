import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Vista General de Datos | Sistema de Predicción Cardiovascular',
    description: 'Vista general y análisis de datos del sistema de predicción cardiovascular',
}

export default function DataOverviewPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Vista General de Datos
                </h1>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <p className="text-gray-600">
                        Esta página está en desarrollo. Aquí se mostrará un análisis completo de los datos del sistema.
                    </p>
                </div>
            </div>
        </div>
    )
}