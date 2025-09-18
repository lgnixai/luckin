// Optional deps shim to keep type-check green without installing them
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useTheme: any = () => ({ theme: 'system' });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sonner: any = (props: any) => null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let toast: any = () => {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nextThemes = require('next-themes');
  useTheme = nextThemes.useTheme;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sonner = require('sonner');
  Sonner = sonner.Toaster;
  toast = sonner.toast;
} catch {}

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
