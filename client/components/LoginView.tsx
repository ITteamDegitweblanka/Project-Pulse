import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import Button from './ui/Button';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
        setError("Please enter a username and password.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        await onLogin(trimmedUsername, password);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
    } finally {
        setIsLoading(false);
    }
  };
  
  const inputStyles = "mt-1 block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:ring-violet-500 focus:border-violet-500 sm:text-sm p-2.5";


  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-login-bg flex flex-col justify-center items-center p-4 animate-fade-in">
        <div className="w-full max-w-sm">
            <div className="text-center mb-8">
                <Icon name="logo" className="h-12 w-12 text-violet-500 mx-auto" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
                    Sign in to Project Pulse
                </h1>
            </div>
            <div className="bg-light-card dark:bg-dark-card shadow-xl rounded-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={inputStyles}
                            placeholder="e.g., Alia Chan"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputStyles}
                            placeholder="password"
                        />
                         <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">Hint: the password is 'password' for all users.</p>
                    </div>
                    
                    {error && (
                        <div className="bg-rose-950 text-rose-300 border border-rose-500/20 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <Button type="submit" variant="primary" className="w-full justify-center py-3 font-semibold bg-violet-600 hover:bg-violet-700 focus:ring-violet-500" disabled={isLoading}>
                            {isLoading ? (
                                <Icon name="spinner" className="animate-spin h-5 w-5" />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default LoginView;