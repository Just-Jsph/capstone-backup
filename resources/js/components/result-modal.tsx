import { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ModalType = 'success' | 'error' | 'warning';

interface ResultModalProps {
    open: boolean;
    onClose: () => void;
    type?: ModalType;
    title: string;
    message?: string;
    autoClose?: number; // ms, 0 = no auto-close
}

export function ResultModal({
    open,
    onClose,
    type = 'success',
    title,
    message,
    autoClose = 2500,
}: ResultModalProps) {
    useEffect(() => {
        if (open && autoClose > 0) {
            const timer = setTimeout(onClose, autoClose);
            return () => clearTimeout(timer);
        }
    }, [open, autoClose, onClose]);

    const config = {
        success: {
            icon: CheckCircle,
            iconClass: 'text-emerald-500',
            bgClass: 'bg-emerald-500/10',
            borderClass: 'border-emerald-500/20',
            barClass: 'bg-emerald-500',
        },
        error: {
            icon: XCircle,
            iconClass: 'text-destructive',
            bgClass: 'bg-destructive/10',
            borderClass: 'border-destructive/20',
            barClass: 'bg-destructive',
        },
        warning: {
            icon: XCircle,
            iconClass: 'text-amber-500',
            bgClass: 'bg-amber-500/10',
            borderClass: 'border-amber-500/20',
            barClass: 'bg-amber-500',
        },
    }[type];

    const Icon = config.icon;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent
                className="sm:max-w-[360px] p-0 overflow-hidden border-none shadow-2xl"
                onInteractOutside={onClose}
            >
                {/* Accessibility: Hidden Title for Screen Readers if you want to keep custom UI */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{message || 'Action result'}</DialogDescription>
                </DialogHeader>

                {/* Auto-close progress bar */}
                {autoClose > 0 && open && (
                    <div className="h-1 w-full bg-muted absolute top-0 left-0 z-10">
                        <div
                            className={cn('h-full animate-[shrink_var(--dur)_linear_forwards]', config.barClass)}
                            style={{ '--dur': `${autoClose}ms` } as React.CSSProperties}
                        />
                    </div>
                )}

                <div className={cn('flex flex-col items-center gap-4 px-8 py-10 text-center', config.bgClass)}>
                    {/* Icon */}
                    <div className={cn('rounded-full p-4 border-2', config.borderClass, config.bgClass)}>
                        <Icon className={cn('size-10', config.iconClass)} strokeWidth={1.5} />
                    </div>

                    {/* Text */}
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                        {message && (
                            <p className="text-sm text-muted-foreground">{message}</p>
                        )}
                    </div>

                    {/* OK Button */}
                    <Button
                        onClick={onClose}
                        className={cn(
                            'mt-2 w-full h-11 font-bold rounded-xl shadow-lg transition-all active:scale-95',
                            type === 'success'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                                : type === 'error'
                                    ? 'bg-destructive hover:bg-destructive/90 text-white'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                        )}
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
