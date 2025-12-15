// FILEPATH: /Users/sbecker11/workspace-react/spexture-com/src/components/About.test.js

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react'; 
import { TestRouter } from '../test-utils';
import About from './About';

export const onAboutClick = jest.fn();

describe('About', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(<TestRouter><About /></TestRouter>);
    });

    it('displays the About Us heading', () => {
        render(<TestRouter><About /></TestRouter>);
        expect(screen.getByText('About Us')).toBeInTheDocument();
    });

    it('displays the count with initial value', () => {
        render(<TestRouter><About /></TestRouter>);
        expect(screen.getByText(/Count:/i)).toBeInTheDocument();
    });

    it('displays increment button', () => {
        render(<TestRouter><About /></TestRouter>);
        const incrementButton = screen.getByText('Increment');
        expect(incrementButton).toBeInTheDocument();
    });

    it('increments count when button is clicked', () => {
        localStorage.setItem('count', '5');
        render(<TestRouter><About /></TestRouter>);
        const incrementButton = screen.getByText('Increment');
        fireEvent.click(incrementButton);
        expect(screen.getByText(/Count: 6/i)).toBeInTheDocument();
    });

    it('persists count in localStorage', () => {
        render(<TestRouter><About /></TestRouter>);
        const incrementButton = screen.getByText('Increment');
        fireEvent.click(incrementButton);
        expect(localStorage.getItem('count')).toBe('1');
    });

    it('loads count from localStorage on mount', () => {
        localStorage.setItem('count', '10');
        render(<TestRouter><About /></TestRouter>);
        expect(screen.getByText(/Count: 10/i)).toBeInTheDocument();
    });
});