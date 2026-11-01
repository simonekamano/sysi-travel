import { Loader2, Trash2 } from "lucide-react";
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

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <AlertDialogContent className="max-w-md rounded-none border border-petrol/15 bg-ivory p-7 text-petrol">
        <AlertDialogHeader className="space-y-3 text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" strokeWidth={1.7} />
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
            className="label-caps mt-0 rounded-full border border-petrol/25 bg-transparent px-5 py-3 text-petrol transition-colors hover:border-petrol hover:bg-petrol/5 hover:text-petrol"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-ivory transition-colors hover:bg-destructive/90"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Suppression" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}