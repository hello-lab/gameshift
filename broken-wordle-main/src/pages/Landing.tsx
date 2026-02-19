import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center scanlines gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-6xl font-black text-glow tracking-tighter">GLITCH</h1>
                <h2 className="text-2xl text-primary font-bold tracking-widest text-glow-secondary">PROTOCOL</h2>
            </div>

            <div className="flex flex-col gap-4 w-64">
                <Link to="/play" className="px-6 py-4 bg-primary/20 hover:bg-primary/30 border border-primary text-primary font-bold text-center rounded-sm transition-all hover:scale-105 active:scale-95 text-glow">
                    JOIN GAME
                </Link>
                <Link to="/admin" className="px-6 py-3 bg-muted/20 hover:bg-muted/30 border border-muted-foreground/50 text-muted-foreground font-bold text-center rounded-sm transition-all hover:scale-105 active:scale-95 text-xs">
                    HOST CONTROL
                </Link>
            </div>
        </div>
    );
};

export default Landing;
