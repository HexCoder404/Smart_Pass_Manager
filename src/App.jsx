import { useState } from 'react';
import PasswordGenerator from './features/passwordgenerator/PasswordGenerator';
import PasswordChecker from './features/passwordchecker/PasswordChecker';

function App() {
    const [activeTab, setActiveTab] = useState('generator');

    return (
        <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-2xl mb-8 flex space-x-4">
                <button 
                    onClick={() => setActiveTab('checker')}
                    className={`flex-1 py-3 rounded-lg shadow font-medium ${activeTab === 'checker' ? 'bg-[#1e293b] text-emerald-400 border border-slate-600' : 'bg-[#0f172a] text-slate-400'}`}>
                    🔍 Strength Checker
                </button>
                <button 
                    onClick={() => setActiveTab('generator')}
                    className={`flex-1 py-3 rounded-lg shadow font-medium ${activeTab === 'generator' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-[#0f172a] text-slate-400'}`}>
                    ⚡ Password Generator
                </button>
            </div>

            <div className="w-full max-w-2xl">
                {activeTab === 'generator' ? <PasswordGenerator /> : <PasswordChecker />}
            </div>
        </div>
    );
}

export default App;