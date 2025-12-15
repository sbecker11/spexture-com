import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jobDescriptionsAPI } from '../services/api';
import Loading from './Loading';

const JDAnalyzer = () => {
  const [currentJD, setCurrentJD] = useState({
    date: new Date().toISOString().split('T')[0],
    contactInfo: '',
    jobInfo: '',
    jobTitle: '',
    consultingRate: '',
    consultingPeriod: '',
    description: '',
  });

  const [savedJDs, setSavedJDs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Load saved job descriptions on mount
  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const loadJobDescriptions = async () => {
    setIsLoading(true);
    try {
      const response = await jobDescriptionsAPI.getAll();
      setSavedJDs(response.jobDescriptions || []);
    } catch (error) {
      toast.error('Failed to load job descriptions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentJD({ ...currentJD, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing job description
        await jobDescriptionsAPI.update(editingId, currentJD);
        toast.success('Job description updated successfully!');
        setEditingId(null);
      } else {
        // Create new job description
        await jobDescriptionsAPI.create(currentJD);
        toast.success('Job description saved successfully!');
      }
      
      // Reload the list
      await loadJobDescriptions();
      
      // Clear the form
      handleClear();
    } catch (error) {
      toast.error('Failed to save job description: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setCurrentJD({
      date: new Date().toISOString().split('T')[0],
      contactInfo: '',
      jobInfo: '',
      jobTitle: '',
      consultingRate: '',
      consultingPeriod: '',
      description: '',
    });
    setEditingId(null);
  };

  const handleEdit = (jd) => {
    setCurrentJD({
      date: jd.date || new Date().toISOString().split('T')[0],
      contactInfo: jd.contact_info || '',
      jobInfo: jd.job_info || '',
      jobTitle: jd.job_title || '',
      consultingRate: jd.consulting_rate || '',
      consultingPeriod: jd.consulting_period || '',
      description: jd.description || '',
    });
    setEditingId(jd.id);
    toast.info('Editing job description');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job description?')) {
      return;
    }

    try {
      await jobDescriptionsAPI.delete(id);
      toast.success('Job description deleted successfully!');
      await loadJobDescriptions();
    } catch (error) {
      toast.error('Failed to delete job description: ' + error.message);
    }
  };

  if (isLoading) {
    return <Loading message="Loading job descriptions..." />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Job Description Analyzer
      </h2>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="date" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date:
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={currentJD.date}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="jobTitle" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Job Title:
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={currentJD.jobTitle}
              onChange={handleChange}
              placeholder="Enter job title"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="contactInfo" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Contact Info:
            </label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              value={currentJD.contactInfo}
              onChange={handleChange}
              placeholder="Enter contact information"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="consultingRate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Consulting Rate:
            </label>
            <input
              type="text"
              id="consultingRate"
              name="consultingRate"
              value={currentJD.consultingRate}
              onChange={handleChange}
              placeholder="Enter consulting rate"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="consultingPeriod" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Consulting Period:
            </label>
            <input
              type="text"
              id="consultingPeriod"
              name="consultingPeriod"
              value={currentJD.consultingPeriod}
              onChange={handleChange}
              placeholder="Enter consulting period"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="jobInfo" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Job Info:
            </label>
            <textarea
              id="jobInfo"
              name="jobInfo"
              value={currentJD.jobInfo}
              onChange={handleChange}
              placeholder="Enter job information"
              rows="4"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description:
            </label>
            <textarea
              id="description"
              name="description"
              value={currentJD.description}
              onChange={handleChange}
              placeholder="Enter job description"
              rows="6"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: 'var(--button-border-radius)',
                fontSize: 'var(--button-font-size)',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '10px 20px',
                backgroundColor: isSaving ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--button-border-radius)',
                fontSize: 'var(--button-font-size)',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Save & Analyze')}
            </button>
          </div>
        </form>
      </div>
      
      {/* Saved Job Descriptions List */}
      {savedJDs.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            Saved Job Descriptions ({savedJDs.length})
          </h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {savedJDs.map((jd) => (
              <div
                key={jd.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: editingId === jd.id ? '#e7f3ff' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                      {jd.job_title || 'Untitled Position'}
                    </h4>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                      <strong>Date:</strong> {new Date(jd.date).toLocaleDateString()}
                    </p>
                    {jd.consulting_rate && (
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Rate:</strong> {jd.consulting_rate} 
                        {jd.consulting_period && ` (${jd.consulting_period})`}
                      </p>
                    )}
                    {jd.contact_info && (
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Contact:</strong> {jd.contact_info}
                      </p>
                    )}
                    {jd.description && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                        {jd.description.substring(0, 150)}
                        {jd.description.length > 150 && '...'}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
                    <button
                      onClick={() => handleEdit(jd)}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--button-border-radius)',
                        fontSize: 'var(--button-font-size)',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(jd.id)}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--button-border-radius)',
                        fontSize: 'var(--button-font-size)',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
          💡 Note: Analysis functionality is coming soon. Job descriptions are now saved to the database.
        </p>
      </div>
    </div>
  );
};

export default JDAnalyzer;