// FILEPATH: /Users/sbecker11/workspace-react/react-super-app/src/components/Footer.test.js

import { render, screen } from '@testing-library/react';
import React from 'react'; 
import { TestRouter } from '../test-utils';
import Footer from './Footer';

describe('Footer', () => {
    it('renders without crashing', () => {
        render(<TestRouter><Footer /></TestRouter>);
    });

    it('displays the current year', () => {
        const currentYear = new Date().getFullYear();
        render(<TestRouter><Footer /></TestRouter>);
        expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('displays copyright text', () => {
        render(<TestRouter><Footer /></TestRouter>);
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });

    it('displays company name', () => {
        render(<TestRouter><Footer /></TestRouter>);
        expect(screen.getByText(/Spexture.com/i)).toBeInTheDocument();
    });

    it('renders footer element', () => {
        const { container } = render(<TestRouter><Footer /></TestRouter>);
        const footer = container.querySelector('footer');
        expect(footer).toBeInTheDocument();
    });
});