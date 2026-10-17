import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            '!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-pop',
          description: '!text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { toast };
