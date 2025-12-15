import React from 'react';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

describe('Loading', () => {
  it('renders without crashing', () => {
    render(<Loading />);
  });

  it('displays default loading message', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays custom loading message', () => {
    render(<Loading message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders without message when message prop is empty', () => {
    render(<Loading message="" />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies small size correctly', () => {
    const { container } = render(<Loading size="small" />);
    const spinner = container.querySelector('div[style*="width: 24px"]');
    expect(spinner).toBeInTheDocument();
  });

  it('applies medium size correctly (default)', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('div[style*="width: 40px"]');
    expect(spinner).toBeInTheDocument();
  });

  it('applies large size correctly', () => {
    const { container } = render(<Loading size="large" />);
    const spinner = container.querySelector('div[style*="width: 60px"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders in fullScreen mode', () => {
    const { container } = render(<Loading fullScreen={true} />);
    const loadingContainer = container.firstChild;
    expect(loadingContainer).toHaveStyle({ position: 'fixed' });
  });

  it('renders in inline mode by default', () => {
    const { container } = render(<Loading />);
    const loadingContainer = container.firstChild;
    expect(loadingContainer).toHaveStyle({ display: 'flex' });
    expect(loadingContainer).not.toHaveStyle({ position: 'fixed' });
  });
});

