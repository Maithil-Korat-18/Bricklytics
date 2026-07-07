import React, { useState } from 'react';
import AuthExperience from './AuthExperience';
import BricklyticsLanding from './BricklyticsLanding';

function App() {
    // view can be: 'landing' | 'login' | 'signup' | 'onboarding' | 'dashboard'
    const [view, setView] = useState('landing');
    
    // user Profile configured during onboarding
    const [userProfile, setUserProfile] = useState({
        propertyType: 'apartment',
        budget: 80,
        priorities: ['safety', 'schools']
    });

    const handleNavigate = (targetView) => {
        setView(targetView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
            {view === 'landing' ? (
                <BricklyticsLanding onNavigate={handleNavigate} />
            ) : (
                <AuthExperience 
                    initialMode={view === 'signup' ? 'signup' : 'login'}
                    initialPhase={view === 'onboarding' ? 'onboarding' : view === 'dashboard' ? 'dashboard' : 'auth'}
                    onNavigate={handleNavigate}
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                />
            )}
        </div>
    );
}

export default App;