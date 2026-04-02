import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuraCard } from '@/components/vesper/AuraCard';

// Since we're using framer-motion which behaves differently in JSDOM,
// we might want to mock it partially if we see issues, but let's test it raw first.

describe('AuraCard Component', () => {
    const mockIdentity = {
        name: 'Sonic Architect',
        description: 'Mocked description',
        lastResonated: null
    };

    const mockStats = [
        { id: '1', label: 'Plays', value: 100 },
        { id: '2', label: 'Time', value: 45, unit: 'hrs' }
    ];

    const mockGenres = [
        { name: 'Electronic' },
        { name: 'Ambient' }
    ];

    it('should render the AuraCard with correct identity name', () => {
        render(<AuraCard identity={mockIdentity} stats={mockStats} genres={mockGenres} />);
        
        // Check for the "Sonic Architect" text which is rendered span by span
        expect(screen.getByText('Sonic')).toBeInTheDocument();
        expect(screen.getByText('Architect')).toBeInTheDocument();
        
        // Check stats rendering
        expect(screen.getByText('Plays')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Time')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('hrs')).toBeInTheDocument();

        // Check genre mapping
        expect(screen.getByText('Electronic')).toBeInTheDocument();
        expect(screen.getByText('Ambient')).toBeInTheDocument();
    });
});
