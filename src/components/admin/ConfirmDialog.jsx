import { Check, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// `tone`: "danger" (a deletion, the default) or "confirm" (a positive action, e.g. a payment received).
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  busyLabel,
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const danger = tone === "danger";
  const Icon = danger ? Trash2 : Check;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <AlertDialogContent className="max-w-md rounded-none border border-petrol/15 bg-ivory p-7 text-petrol">
        <AlertDialogHeader className="space-y-3 text-left">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full",
              danger ? "bg-destructive/10 text-destructive" : "bg-gold/20 text-gold-deep",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <AlertDialogTitle className="font-display text-[1.35rem] font-bold leading-snug text-petrol">
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-[0.92rem] leading-relaxed text-petrol/65">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 gap-3 sm:justify-end">
          <AlertDialogCancel
            disabled={busy}
            className="label-caps mt-0 rounded-full border border-petrol/25 bg-transparent px-5 py-2.5 text-petrol transition-colors hover:border-petrol hover:bg-petrol/5 hover:text-petrol"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className={cn(
              "label-caps inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-ivory transition-colors",
              danger ? "bg-destructive hover:bg-destructive/90" : "bg-petrol hover:bg-petrol-deep",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? (busyLabel ?? (danger ? "Suppression" : "Envoi")) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
