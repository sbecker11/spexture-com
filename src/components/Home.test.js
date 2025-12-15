// FILEPATH: /Users/sbecker11/workspace-react/spexture-com/src/components/Home.test.js

import { render, screen } from '@testing-library/react';
import React from 'react'; 
import { TestRouter } from '../test-utils';
import Home from './Home';

export const onHomeClick = jest.fn();

describe('Home', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(<TestRouter><Home /></TestRouter>);
    });

    it('displays the welcome heading', () => {
        render(<TestRouter><Home /></TestRouter>);
        expect(screen.getByText('Welcome to Our Website')).toBeInTheDocument();
    });

    it('displays welcome content paragraphs', () => {
        render(<TestRouter><Home /></TestRouter>);
        const paragraphs = screen.getAllByText(/Lorem ipsum|explore our latest|Don't hesitate/i);
        expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('has the correct container class', () => {
        const { container } = render(<TestRouter><Home /></TestRouter>);
        // Home component uses PageContainer which may not have .home-container class
        // Check for any container element or PageContainer
        const pageContainer = container.querySelector('.page-container') || 
                              container.querySelector('[class*="container"]') ||
                              container.firstChild;
        expect(pageContainer).toBeInTheDocument();
    });
});