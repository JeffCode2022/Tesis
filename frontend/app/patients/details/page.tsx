import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Detalles del Paciente | Sistema de Predicción Cardiovascular',
    description: 'Vista detallada de la información del paciente y su historial médico',
}

interface PatientDetailsPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function PatientDetailsPage({ params }: PatientDetailsPageProps) {
    const { id } = await params

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Detalles del Paciente
                </h1>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <p className="text-gray-600 mb-4">
                        ID del Paciente: {id}
                    </p>
                    <p className="text-gray-600">
                        Esta página está en desarrollo. Aquí se mostrará la información detallada del paciente.
                    </p>
                </div>
            </div>
        </div>
    )
}