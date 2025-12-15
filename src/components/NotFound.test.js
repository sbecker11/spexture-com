import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestRouter } from '../test-utils';
import NotFound from './NotFound';

describe('NotFound', () => {
  it('renders without crashing', () => {
    render(
      <TestRouter>
        <NotFound />
      </TestRouter>
    );
  });

  it('displays 404 heading', () => {
    render(
      <TestRouter>
        <NotFound />
      </TestRouter>
    );
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays page not found message', () => {
    render(
      <TestRouter>
        <NotFound />
      </TestRouter>
    );
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('displays helpful error message', () => {
    render(
      <TestRouter>
        <NotFound />
      </TestRouter>
    );
    expect(screen.getByText(/Sorry, the page you are looking for/i)).toBeInTheDocument();
  });

  it('displays link to home page', () => {
    render(
      <TestRouter>
        <NotFound />
      </TestRouter>
    );
    const homeLink = screen.getByText('Go to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });
});

