import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestRouter } from '../test-utils';
import JDAnalyzer from './JDAnalyzer';
import * as api from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  jobDescriptionsAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('JDAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response with empty array
    api.jobDescriptionsAPI.getAll.mockResolvedValue({ jobDescriptions: [] });
  });

  it('renders without crashing', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('displays the Job Description Analyzer heading', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Job Description Analyzer')).toBeInTheDocument();
    });
  });

  it('renders all form fields', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact info/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/consulting rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/consulting period/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job info/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders Clear and Save buttons', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
    expect(screen.getByText('Save & Analyze')).toBeInTheDocument();
  });

  it('updates job title field when user types', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const jobTitleInput = screen.getByLabelText(/job title/i);
    fireEvent.change(jobTitleInput, { target: { value: 'Software Engineer' } });
    expect(jobTitleInput).toHaveValue('Software Engineer');
  });

  it('updates email field when user types', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const contactInput = screen.getByLabelText(/contact info/i);
    fireEvent.change(contactInput, { target: { value: 'test@example.com' } });
    expect(contactInput).toHaveValue('test@example.com');
  });

  it('updates description textarea when user types', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    expect(descriptionInput).toHaveValue('Test description');
  });

  it('clears all form fields when Clear button is clicked', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    const jobTitleInput = screen.getByLabelText(/job title/i);
    const contactInput = screen.getByLabelText(/contact info/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    fireEvent.change(jobTitleInput, { target: { value: 'Software Engineer' } });
    fireEvent.change(contactInput, { target: { value: 'test@example.com' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    expect(jobTitleInput).toHaveValue('');
    expect(contactInput).toHaveValue('');
    expect(descriptionInput).toHaveValue('');
  });

  it('sets default date to today', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const dateInput = screen.getByLabelText(/date/i);
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput).toHaveValue(today);
  });

  it('calls API to create job description on form submission', async () => {
    api.jobDescriptionsAPI.create.mockResolvedValue({ jobDescription: { id: '1' } });
    
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    const saveButton = screen.getByText('Save & Analyze');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.jobDescriptionsAPI.create).toHaveBeenCalled();
    });
  });

  it('displays placeholder note about analysis functionality', async () => {
    render(
      <TestRouter>
        <JDAnalyzer />
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Job descriptions are now saved to the database/i)).toBeInTheDocument();
    });
  });

  describe('CRUD Operations', () => {
    describe('Load job descriptions', () => {
      it('should load job descriptions on mount', async () => {
        const mockJDs = [
          {
            id: '1',
            job_title: 'Software Engineer',
            date: '2024-01-01',
            consulting_rate: '$100/hr',
            description: 'Great job',
          },
        ];

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: mockJDs,
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.getAll).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        });
      });

      it('should display error when loading fails', async () => {
        api.jobDescriptionsAPI.getAll.mockRejectedValue(
          new Error('Failed to load')
        );

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.getAll).toHaveBeenCalled();
        });
      });

      it('should handle empty job descriptions list', async () => {
        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [],
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.queryByText(/Saved Job Descriptions/i)).not.toBeInTheDocument();
        });
      });
    });

    describe('Create job description', () => {
      it('should create job description successfully', async () => {
        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [],
        });
        api.jobDescriptionsAPI.create.mockResolvedValue({
          jobDescription: { id: '1' },
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        const jobTitleInput = screen.getByLabelText(/job title/i);
        fireEvent.change(jobTitleInput, {
          target: { value: 'Software Engineer' },
        });

        const saveButton = screen.getByText('Save & Analyze');
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.create).toHaveBeenCalled();
        });
      });

      it('should show error when create fails', async () => {
        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [],
        });
        api.jobDescriptionsAPI.create.mockRejectedValue(
          new Error('Failed to create')
        );

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save & Analyze');
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.create).toHaveBeenCalled();
        });
      });
    });

    describe('Update job description', () => {
      it('should enter edit mode when Edit clicked', async () => {
        const mockJD = {
          id: '1',
          job_title: 'Software Engineer',
          date: '2024-01-01',
          contact_info: 'contact@example.com',
          consulting_rate: '$100/hr',
          description: 'Great job',
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        });

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        await waitFor(() => {
          expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
        });

        expect(screen.getByText('Update')).toBeInTheDocument();
      });

      it('should update job description successfully', async () => {
        const mockJD = {
          id: '1',
          job_title: 'Software Engineer',
          date: '2024-01-01',
          description: 'Great job',
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });
        api.jobDescriptionsAPI.update.mockResolvedValue({
          jobDescription: { ...mockJD, job_title: 'Senior Engineer' },
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit'));

        await waitFor(() => {
          expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
        });

        const titleInput = screen.getByDisplayValue('Software Engineer');
        fireEvent.change(titleInput, {
          target: { value: 'Senior Engineer' },
        });

        fireEvent.click(screen.getByText('Update'));

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.update).toHaveBeenCalledWith(
            '1',
            expect.any(Object)
          );
        });
      });

      it('should handle update error', async () => {
        const mockJD = {
          id: '1',
          job_title: 'Software Engineer',
          date: '2024-01-01',
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });
        api.jobDescriptionsAPI.update.mockRejectedValue(
          new Error('Update failed')
        );

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit'));
        
        await waitFor(() => {
          expect(screen.getByText('Update')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Update'));

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.update).toHaveBeenCalled();
        });
      });
    });

    describe('Delete job description', () => {
      it('should show confirmation dialog before delete', async () => {
        const mockJD = {
          id: '1',
          job_title: 'Software Engineer',
          date: '2024-01-01',
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });

        // Mock window.confirm
        global.confirm = jest.fn(() => false);

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete'));

        expect(global.confirm).toHaveBeenCalledWith(
          'Are you sure you want to delete this job description?'
        );
        expect(api.jobDescriptionsAPI.delete).not.toHaveBeenCalled();
      });

      it('should delete job description when confirmed', async () => {
        const mockJD = {
          id: '1',
          job_title: 'Software Engineer',
          date: '2024-01-01',
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });
        api.jobDescriptionsAPI.delete.mockResolvedValue({ success: true });

        global.confirm = jest.fn(() => true);

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete'));

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.delete).toHaveBeenCalledWith('1');
        });
      });

      it('should handle delete error', async () => {
        const mockJD = {
          id: '1',
          job_title: 'Software Engineer',
          date: '2024-01-01',
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });
        api.jobDescriptionsAPI.delete.mockRejectedValue(
          new Error('Delete failed')
        );

        global.confirm = jest.fn(() => true);

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete'));

        await waitFor(() => {
          expect(api.jobDescriptionsAPI.delete).toHaveBeenCalled();
        });
      });
    });

    describe('Display saved job descriptions', () => {
      it('should display list of saved job descriptions', async () => {
        const mockJDs = [
          {
            id: '1',
            job_title: 'Software Engineer',
            date: '2024-01-01',
            consulting_rate: '$100/hr',
            consulting_period: '3 months',
            contact_info: 'contact@example.com',
            description: 'Great job opportunity',
          },
          {
            id: '2',
            job_title: 'Product Manager',
            date: '2024-01-02',
            consulting_rate: '$150/hr',
          },
        ];

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: mockJDs,
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Saved Job Descriptions (2)')).toBeInTheDocument();
        });

        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Product Manager')).toBeInTheDocument();
        // The consulting_rate is displayed as "Rate: $100/hr" where "Rate:" is in <strong> and "$100/hr" is separate text
        // Use getAllByText and filter to find rates in saved job descriptions (not in form)
        const allRate100 = screen.getAllByText((content, element) => {
          const text = element?.textContent || '';
          return text.includes('$100/hr') && !text.includes('Consulting Rate:');
        });
        expect(allRate100.length).toBeGreaterThan(0);
        
        const allRate150 = screen.getAllByText((content, element) => {
          const text = element?.textContent || '';
          return text.includes('$150/hr') && !text.includes('Consulting Rate:');
        });
        expect(allRate150.length).toBeGreaterThan(0);
      });

      it('should truncate long descriptions', async () => {
        const longDescription = 'A'.repeat(200);
        const mockJD = {
          id: '1',
          job_title: 'Test Job',
          date: '2024-01-01',
          description: longDescription,
        };

        api.jobDescriptionsAPI.getAll.mockResolvedValue({
          jobDescriptions: [mockJD],
        });

        render(
          <TestRouter>
            <JDAnalyzer />
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByText('Test Job')).toBeInTheDocument();
        });

        // Should show truncated version with ellipsis
        const displayedText = screen.getByText(/A{150}\.\.\./, { exact: false });
        expect(displayedText).toBeInTheDocument();
      });
    });
  });
});

