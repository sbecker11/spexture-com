/**
 * PageContainer Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PageContainer from './PageContainer';

describe('PageContainer', () => {
  it('renders without crashing', () => {
    render(<PageContainer>Test Content</PageContainer>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <PageContainer>
        <h1>Page Title</h1>
        <p>Page content</p>
      </PageContainer>
    );
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('applies default className', () => {
    const { container } = render(<PageContainer>Test</PageContainer>);
    const pageContainer = container.querySelector('.page-container');
    expect(pageContainer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageContainer className="custom-class">Test</PageContainer>
    );
    const pageContainer = container.querySelector('.page-container.custom-class');
    expect(pageContainer).toBeInTheDocument();
  });

  it('applies default maxWidth style (none)', () => {
    const { container } = render(<PageContainer>Test</PageContainer>);
    const pageContainer = container.querySelector('.page-container');
    expect(pageContainer).toHaveStyle({ maxWidth: '100%' });
  });

  it('applies custom maxWidth style', () => {
    const { container } = render(
      <PageContainer maxWidth="1200px">Test</PageContainer>
    );
    const pageContainer = container.querySelector('.page-container');
    expect(pageContainer).toHaveStyle({ maxWidth: '1200px' });
  });

  it('handles empty children', () => {
    const { container } = render(<PageContainer></PageContainer>);
    const pageContainer = container.querySelector('.page-container');
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).toBeEmptyDOMElement();
  });

  it('handles multiple className values', () => {
    const { container } = render(
      <PageContainer className="class1 class2 class3">Test</PageContainer>
    );
    const pageContainer = container.querySelector('.page-container.class1.class2.class3');
    expect(pageContainer).toBeInTheDocument();
  });

  it('applies both className and maxWidth together', () => {
    const { container } = render(
      <PageContainer className="custom" maxWidth="800px">
        Test
      </PageContainer>
    );
    const pageContainer = container.querySelector('.page-container.custom');
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).toHaveStyle({ maxWidth: '800px' });
  });
});

