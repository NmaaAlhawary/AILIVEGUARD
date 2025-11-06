import logo from '@/assets/logo.png';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = 'Initializing System...' }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation */}
        <div className="relative">
          <img 
            src={logo} 
            alt="AILiveGuard Logo" 
            className="w-48 h-48 animate-pulse"
          />
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl animate-pulse" />
        </div>

        {/* Brand name */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-status-fit animate-fade-in">
            AILiveGuard
          </h1>
          <p className="text-xl text-secondary animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Player Monitoring System
          </p>
        </div>

        {/* Loading message */}
        <div className="flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-muted-foreground">{message}</p>
          
          {/* Loading dots animation */}
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-status-fit rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-status-fit rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-status-fit rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};