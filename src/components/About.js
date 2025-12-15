import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer';

function About() {
    // Define a state variable 'count' and its corresponding setter function 'setCount'
    const [count, setCount] = useState(localStorage.getItem('count') || 0);

    // Update the stored value in localStorage whenever 'count' changes
    useEffect(() => {
        localStorage.setItem('count', `${count}`);
    }, [count]);
    
    // Use 'count' and 'setCount' to manage and update the state
    const increment = () => {
        setCount(`${parseInt(count) + 1}`);
    };

    return (
        <PageContainer>
            <h2>About Us</h2>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Nulla gravida, est eget interdum hendrerit, nulla arcu placerat est, 
                non feugiat dui quam ac nulla. Sed nec bibendum nunc. 
                Nulla varius mi ut odio varius, vel dictum velit dictum.
            </p>
            <p>Count: {count}</p>
            <button 
              onClick={increment}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--button-border-radius)',
                fontSize: 'var(--button-font-size)',
                cursor: 'pointer'
              }}
            >
              Increment
            </button>
        </PageContainer>
    );
}

export default About;
