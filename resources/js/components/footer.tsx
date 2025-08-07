import { cn } from '@/lib/utils';

export default function Footer() {
    const version = typeof __APP_VERSION__ !== 'undefined' 
        ? __APP_VERSION__.substring(0, 8)
        : 'unknown';

    return (
        <footer className={cn(
            "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            "py-2 px-4 text-xs text-muted-foreground text-center"
        )}>
            <div className="max-w-7xl mx-auto">
                Version {version}
            </div>
        </footer>
    );
}